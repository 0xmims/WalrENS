import { Router } from 'itty-router';
import { createPublicClient, http } from 'viem';
import { getEnsText, getEnsResolver } from 'viem/ens';
import { mainnet } from 'viem/chains';

export interface Env {
	WALRUS_BASE: string;
	ETH_RPC_URL?: string;
}

// Create viem client for ENS resolution
function createViemClient(env: Env) {
	const rpcUrl = env.ETH_RPC_URL || 'https://eth.llamarpc.com';
	return createPublicClient({
		chain: mainnet,
		transport: http(rpcUrl),
	});
}

// Parse walrus mapping from ENS text record
function parseWalrusMapping(text: string): { type: 'blob' | 'site'; id: string; index?: string } | null {
	try {
		// Check if it's a blob mapping
		if (text.startsWith('blob:')) {
			return { type: 'blob', id: text.substring(5) };
		}
		
		// Check if it's a site mapping
		const parsed = JSON.parse(text);
		if (parsed.type === 'site' && parsed.id) {
			return { type: 'site', id: parsed.id, index: parsed.index };
		}
		
		return null;
	} catch {
		return null;
	}
}

// Build Walrus URL from mapping and path
function buildWalrusUrl(mapping: { type: 'blob' | 'site'; id: string; index?: string }, path: string, env: Env): string {
	if (mapping.type === 'blob') {
		return `${env.WALRUS_BASE}/blobs/${mapping.id}${path}`;
	} else {
		// For site type, use the index if specified, otherwise default to index.html
		const indexPath = mapping.index || 'index.html';
		if (path === '/' || path === '') {
			return `${env.WALRUS_BASE}/sites/${mapping.id}/${indexPath}`;
		}
		return `${env.WALRUS_BASE}/sites/${mapping.id}${path}`;
	}
}

const router = Router();

router.get('/:ensName/*', async (request, env: Env) => {
	const { params, url } = request as any;
	const ensName = params.ensName;
	let path = new URL(url).pathname.replace(`/${ensName}`, '') || '/';
	
	// Default to index.html for directory requests
	if (path === '/' || path === '') {
		path = '/index.html';
	}

	try {
		// Resolve ENS name and get text record
		const client = createViemClient(env);
		let walrusText: string | null = null;
		
		try {
			// Try getEnsText first (viem v2)
			walrusText = await getEnsText(client, {
				name: ensName,
				key: 'walrus',
			});
		} catch {
			// Fallback to resolver.text if getEnsText is unavailable
			const resolver = await getEnsResolver(client, { name: ensName });
			if (resolver) {
				walrusText = await resolver.getText('walrus');
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
				return new Response(`Upstream error: ${upstream.status}`, { 
					status: upstream.status 
				});
			}

			// Create response with proper headers
			response = new Response(upstream.body, {
				status: upstream.status,
				headers: {
					'Content-Type': upstream.headers.get('Content-Type') || 'application/octet-stream',
					'Cache-Control': 'public, max-age=600',
					'x-cache': cacheStatus,
				}
			});

			// Cache the response
			ctxWaitUntil(cache.put(cacheKey, response.clone()));
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