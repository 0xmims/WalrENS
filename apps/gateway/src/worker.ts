import { Router } from 'itty-router';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

export interface Env {
	WALRUS_BASE: string;
	ETH_RPC_URL: string;
}

type WalrusMapping =
	| { type: 'blob'; id: string }
	| { type: 'site'; id: string; index?: string };

const router = Router();

function parseWalrusRecord(value: string | null): WalrusMapping | null {
	if (!value) return null;
	try {
		if (value.startsWith('blob:')) return { type: 'blob', id: value.slice(5) };
		const json = JSON.parse(value);
		if (json && json.type === 'site' && typeof json.id === 'string') {
			return { type: 'site', id: json.id, index: json.index };
		}
		return null;
	} catch {
		return null;
	}
}

function normalizeSitePath(requestPath: string, indexOverride?: string): string {
	// Ensure leading slash
	let p = requestPath || '';
	if (!p.startsWith('/')) p = `/${p}`;
	// Default to index when empty or directory
	if (p === '/' || p.endsWith('/')) {
		return indexOverride && indexOverride.startsWith('/') ? indexOverride : `${p}${indexOverride || 'index.html'}`.replace('//', '/');
	}
	return p;
}

router.get('/:ensName/*', async (request, env: Env, ctx: ExecutionContext) => {
	const { params } = request as any;
	const ensName = params.ensName as string;
	if (!ensName) return new Response('Bad request', { status: 400 });

	// Compute the requested path (portion after /:ensName)
	const pathname = new URL((request as Request).url).pathname;
	const pathAfterName = pathname.slice(ensName.length + 1); // keeps leading '/' if present

	// Resolve ENS Text record "walrus"
	const client = createPublicClient({ chain: mainnet, transport: http(env.ETH_RPC_URL) });
	let textValue: string | null = null;
	try {
		// @ts-ignore - viem client has getEnsText in v2
		textValue = await client.getEnsText({ name: ensName, key: 'walrus' });
	} catch (err) {
		console.error('ENS text read error', err);
		return new Response('ENS resolution failed', { status: 502 });
	}
	const mapping = parseWalrusRecord(textValue);
	if (!mapping) {
		return new Response('ENS mapping not found', { status: 404 });
	}

	let walrusUrl: string;
	if (mapping.type === 'blob') {
		walrusUrl = `${env.WALRUS_BASE}/blobs/${encodeURIComponent(mapping.id)}`;
	} else {
		const resolvedPath = normalizeSitePath(pathAfterName, mapping.index);
		walrusUrl = `${env.WALRUS_BASE}/sites/${encodeURIComponent(mapping.id)}${resolvedPath}`;
	}

	const cache = caches.default;
	const cacheKey = new Request(walrusUrl, { method: 'GET' });
	let response = await cache.match(cacheKey);
	if (response) {
		console.log('HIT', walrusUrl);
		return response;
	}

	console.log('MISS', walrusUrl);
	const upstream = await fetch(walrusUrl, { headers: { 'Accept': 'application/octet-stream' } });
	response = new Response(upstream.body, {
		status: upstream.status,
		headers: {
			'Content-Type': upstream.headers.get('Content-Type') || 'application/octet-stream',
			'Cache-Control': 'public, max-age=600'
		}
	});
	ctx.waitUntil(cache.put(cacheKey, response.clone()));
	return response;
});

router.all('*', () => new Response('Not found', { status: 404 }));

export default {
	fetch: (request: Request, env: Env, ctx: ExecutionContext) => router.handle(request, env, ctx)
};