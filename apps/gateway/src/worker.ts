import { Router } from 'itty-router';
import { createPublicClient, http } from 'viem';
import { getEnsText, getEnsResolver } from 'viem/ens';
import { mainnet } from 'viem/chains';

export interface Env {
	WALRUS_BASE: string;
	ETH_RPC_URL?: string;
	SUI_RPC_URL?: string;
}

// MIME type mapping for common file extensions
const MIME_TYPES: Record<string, string> = {
	'.html': 'text/html',
	'.css': 'text/css',
	'.js': 'application/javascript',
	'.json': 'application/json',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.ttf': 'font/ttf',
	'.pdf': 'application/pdf'
};

function getMimeType(path: string): string {
	const ext = path.substring(path.lastIndexOf('.'));
	return MIME_TYPES[ext] || 'application/octet-stream';
}

// Create viem client for ENS resolution
function createViemClient(env: Env) {
	const rpcUrl = env.ETH_RPC_URL || 'https://eth.llamarpc.com';
	return createPublicClient({
		chain: mainnet,
		transport: http(rpcUrl),
	});
}

// Parse walrus mapping from ENS text record with enhanced format support
function parseWalrusMapping(text: string): { type: 'blob' | 'site'; id: string; index?: string; network?: string } | null {
	try {
		// Check if it's a blob mapping
		if (text.startsWith('blob:')) {
			return { type: 'blob', id: text.substring(5) };
		}
		
		// Check if it's a site mapping
		const parsed = JSON.parse(text);
		
		// Enhanced format with objectId
		if (parsed.type === 'site' && parsed.objectId) {
			return { 
				type: 'site', 
				id: parsed.objectId,
				index: parsed.index || 'index.html',
				network: parsed.network
			};
		}
		
		// Legacy format with id
		if (parsed.type === 'site' && parsed.id) {
			return { 
				type: 'site', 
				id: parsed.id, 
				index: parsed.index || 'index.html'
			};
		}
		
		return null;
	} catch {
		return null;
	}
}

// Build Walrus URL from mapping and path with enhanced site support
function buildWalrusUrl(mapping: { type: 'blob' | 'site'; id: string; index?: string }, path: string, env: Env): string {
	if (mapping.type === 'blob') {
		return `${env.WALRUS_BASE}/blobs/${mapping.id}`;
	} else {
		// For Walrus Sites, handle routing properly
		if (path === '/' || path === '') {
			// Default to index file
			const indexPath = mapping.index || 'index.html';
			return `${env.WALRUS_BASE}/sites/${mapping.id}/${indexPath}`;
		}
		
		// Remove leading slash for site resources
		const cleanPath = path.startsWith('/') ? path.substring(1) : path;
		return `${env.WALRUS_BASE}/sites/${mapping.id}/${cleanPath}`;
	}
}

const router = Router();

router.get('/:ensName/*', async (request, env: Env) => {
	const { params, url } = request as any;
	const ensName = params.ensName;
	let path = new URL(url).pathname.replace(`/${ensName}`, '') || '/';

	try {
		// Resolve ENS name and get text record
		const client = createViemClient(env);
		let walrusText: string | null = null;
		
		// Try new walrus-site text record first
		try {
			walrusText = await getEnsText(client, {
				name: ensName,
				key: 'walrus-site',
			});
		} catch {
			// Fallback to legacy walrus text record
			try {
				walrusText = await getEnsText(client, {
					name: ensName,
					key: 'walrus',
				});
			} catch {
				// Final fallback to resolver.text
				const resolver = await getEnsResolver(client, { name: ensName });
				if (resolver) {
					try {
						walrusText = await resolver.getText('walrus-site');
					} catch {
						walrusText = await resolver.getText('walrus');
					}
				}
			}
		}

		if (!walrusText) {
			return new Response('ENS name not found or no walrus record', { status: 404 });
		}

		// Parse the walrus mapping
		const mapping = parseWalrusMapping(walrusText);
		if (!mapping) {
			return new Response('Invalid walrus mapping format', { status: 400 });
		}

		// Build Walrus URL
		const walrusUrl = buildWalrusUrl(mapping, path, env);

		// Check cache first
		const cacheKey = new Request(walrusUrl, request);
		const cache = caches.default;
		let response = await cache.match(cacheKey);
		let cacheStatus = 'MISS';

		if (response) {
			cacheStatus = 'HIT';
		} else {
			// Fetch from upstream
			const upstream = await fetch(walrusUrl, { 
				headers: { 'Accept': 'application/octet-stream' } 
			});

			if (!upstream.ok) {
				// For SPAs, try to serve index.html on 404
				if (upstream.status === 404 && mapping.type === 'site' && !path.includes('.')) {
					const indexUrl = buildWalrusUrl(mapping, '/', env);
					const indexResponse = await fetch(indexUrl);
					
					if (indexResponse.ok) {
						response = new Response(indexResponse.body, {
							status: 200,
							headers: {
								'Content-Type': 'text/html',
								'Cache-Control': 'public, max-age=300',
								'x-cache': 'SPA-FALLBACK',
							}
						});
					} else {
						return new Response(`Upstream error: ${upstream.status}`, { 
							status: upstream.status 
						});
					}
				} else {
					return new Response(`Upstream error: ${upstream.status}`, { 
						status: upstream.status 
					});
				}
			} else {
				// Determine content type
				const contentType = upstream.headers.get('Content-Type') || getMimeType(path);
				
				// Create response with proper headers
				response = new Response(upstream.body, {
					status: upstream.status,
					headers: {
						'Content-Type': contentType,
						'Cache-Control': mapping.type === 'site' ? 'public, max-age=3600' : 'public, max-age=600',
						'x-cache': cacheStatus,
					}
				});
			}

			// Cache the response
			if (response) {
				ctxWaitUntil(cache.put(cacheKey, response.clone()));
			}
		}

		// Add cache status header to response
		const responseHeaders = new Headers(response.headers);
		responseHeaders.set('x-cache', cacheStatus);

		return new Response(response.body, {
			status: response.status,
			headers: responseHeaders,
		});

	} catch (error) {
		console.error('ENS resolution error:', error);
		return new Response('Internal server error', { status: 500 });
	}
});

router.all('*', () => new Response('Not found', { status: 404 }));

export default {
	fetch: (request: Request, env: Env, ctx: ExecutionContext) => router.handle(request, env, ctx)
};

function ctxWaitUntil(p: Promise<any>) {
	try {
		// @ts-ignore
		const ctx: ExecutionContext | undefined = arguments?.callee?.caller?.arguments?.[2];
		ctx?.waitUntil(p);
	} catch {}
}