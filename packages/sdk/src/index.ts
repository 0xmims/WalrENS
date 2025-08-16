export type WalrusMapping =
	| { type: 'blob'; id: string }
	| { type: 'site'; id: string; index?: string };

export interface ResolveOptions {
	provider?: any;
}

export interface PublishOptions {
	network?: string;
	textOnly?: boolean;
}

export function getGatewayUrl(name: string, path: string = '/'): string {
	const safePath = path.startsWith('/') ? path : `/${path}`;
	return `https://${name}.walrus.tools${safePath}`;
}

export async function resolveWalrusFromEns(name: string, _opts: ResolveOptions = {}): Promise<WalrusMapping | null> {
	// TODO: implement ENS lookup via viem. Placeholder returns null.
	return null;
}

export async function publishToEns(
	name: string,
	payload: Blob | Uint8Array | ArrayBuffer | string,
	_opts: PublishOptions = {}
): Promise<{ txHash: string }> {
	// TODO: implement upload + ENS text record write.
	return { txHash: '0x' };
}

export const WalrusTextSchema = {
	key: 'walrus',
	parse(value: string): WalrusMapping | null {
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
	},
	stringify(mapping: WalrusMapping): string {
		if (mapping.type === 'blob') return `blob:${mapping.id}`;
		return JSON.stringify(mapping);
	}
};