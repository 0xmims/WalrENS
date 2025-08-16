import { Router } from 'itty-router';

export interface Env {
	WALRUS_BASE: string;
}

const router = Router();

router.get('/:ensName/*', async (request, env: Env) => {
	const { params, url } = request as any;
	const ensName = params.ensName;
	const path = new URL(url).pathname.replace(`/${ensName}`, '') || '/index.html';

	// TODO: ENS lookup for Text record key 'walrus'
	// Placeholder: assume a fixed blob id for now
	const walrusId = 'demo-blob-id';
	const walrusUrl = `${env.WALRUS_BASE}/blobs/${walrusId}${path}`;

	const cacheKey = new Request(walrusUrl, request);
	const cache = caches.default;
	let response = await cache.match(cacheKey);
	if (!response) {
		const upstream = await fetch(walrusUrl, { headers: { 'Accept': 'application/octet-stream' } });
		response = new Response(upstream.body, {
			status: upstream.status,
			headers: {
				'Content-Type': upstream.headers.get('Content-Type') || 'application/octet-stream',
				'Cache-Control': 'public, max-age=600',
			}
		});
		ctxWaitUntil(cache.put(cacheKey, response.clone()));
	}
	return response;
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