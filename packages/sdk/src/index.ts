import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { getEnsText } from 'viem/ens';

export type WalrusMapping =
	| { type: 'blob'; id: string }
	| { type: 'site'; id: string; index?: string };

export interface ResolveOptions {
	provider?: any;
    network?: 'mainnet' | 'sepolia';
}

export interface PublishOptions {
	network?: string;
	textOnly?: boolean;
    privateKey?: string;
}

export function getGatewayUrl(name: string, path: string = '/'): string {
	const safePath = path.startsWith('/') ? path : `/${path}`;
	return `https://${name}.walrus.tools${safePath}`;
}

export async function resolveWalrusFromEns(name: string, opts: ResolveOptions = {}): Promise<WalrusMapping | null> {
	try {
		// Check if provider (RPC URL) is provided
		if (!opts.provider || typeof opts.provider !== 'string') {
			console.error('RPC provider URL is required to resolve ENS names.');
			return null;
		}

		// Create a public viem client for Ethereum mainnet
		const client = createPublicClient({
			chain: mainnet, // This can be updated later to support testnets
			transport: http(opts.provider),
		});

		// Look up the 'walrus' text record for the provided ENS name
		const textRecord = await getEnsText(client, {
			name,
			key: 'walrus',
		});

		// If the result is a non-empty string, parse it using WalrusTextSchema.parse()
		if (textRecord && textRecord.trim() !== '') {
			return WalrusTextSchema.parse(textRecord);
		}

		// Return null if the text record is not found or is empty
		return null;
	} catch (error) {
		// Handle any potential errors gracefully
		console.error('Error resolving Walrus from ENS:', error);
		return null;
	}
}

export async function publishToEns(
	name: string,
	payload: Blob | Uint8Array | ArrayBuffer | string,
	_opts: PublishOptions = {}
): Promise<{ txHash: string }> {
	// This is the placeholder we are reverting to.
	// The next prompt will replace this with the real, working code.
	console.log('publishToEns is not yet fully implemented.');
	throw new Error('publishToEns is not yet fully implemented.');
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