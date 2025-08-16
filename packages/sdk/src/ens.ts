import { createPublicClient, http, createWalletClient as createViemWalletClient, parseEther } from 'viem';
import { getEnsText, getEnsResolver } from 'viem/ens';
import { mainnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import type { WalrusMapping } from './index.js';

// Create viem client for ENS operations
function createViemClient(rpcUrl: string) {
	return createPublicClient({
		chain: mainnet,
		transport: http(rpcUrl),
	});
}

// Create wallet client for transactions
function createWalletClient(rpcUrl: string, privateKey: `0x${string}`) {
	const account = privateKeyToAccount(privateKey);
	return createViemWalletClient({
		account,
		chain: mainnet,
		transport: http(rpcUrl),
	});
}

/**
 * Get ENS text record value
 * @param name ENS name (e.g., 'example.eth')
 * @param key Text record key (defaults to 'walrus')
 * @param rpcUrl Ethereum RPC URL
 * @returns Text record value or null if not found
 */
export async function getEnsTextRecord(
	name: string, 
	key: string = 'walrus', 
	rpcUrl: string
): Promise<string | null> {
	try {
		const client = createViemClient(rpcUrl);
		
		// Try getEnsText first (viem v2)
		try {
			return await getEnsText(client, {
				name,
				key,
			});
		} catch {
					// Fallback to resolver.text if getEnsText is unavailable
		const resolver = await getEnsResolver(client, { name });
		if (resolver) {
			// For now, just return null as the fallback since resolver.getText is not available
			// This can be enhanced later when the proper API is available
			return null;
		}
		}
		
		return null;
	} catch (error) {
		console.error('Error getting ENS text record:', error);
		return null;
	}
}

/**
 * Set ENS text record value
 * @param opts Options object containing name, value, rpcUrl, and privateKey
 * @returns Transaction hash
 */
export async function setEnsTextRecord(opts: {
	name: string;
	value: string;
	rpcUrl: string;
	privateKey: `0x${string}`;
}): Promise<`0x${string}`> {
	// TODO: Implement setEnsTextRecord when proper viem API is available
	throw new Error('setEnsTextRecord not yet implemented - requires proper viem resolver API');
}

/**
 * Parse Walrus text record into structured mapping
 * @param text Text record value
 * @returns Parsed Walrus mapping or null if invalid
 */
export function parseWalrusText(text: string): WalrusMapping | null {
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

/**
 * Convert Walrus mapping to text record value
 * @param mapping Walrus mapping object
 * @returns Text record value string
 */
export function stringifyWalrusMapping(mapping: WalrusMapping): string {
	if (mapping.type === 'blob') {
		return `blob:${mapping.id}`;
	} else {
		return JSON.stringify(mapping);
	}
}

/**
 * Resolve Walrus mapping from ENS name
 * @param name ENS name (e.g., 'example.eth')
 * @param rpcUrl Ethereum RPC URL
 * @returns Parsed Walrus mapping or null if not found/invalid
 */
export async function resolveWalrusFromEns(
	name: string, 
	rpcUrl: string
): Promise<WalrusMapping | null> {
	try {
		const textRecord = await getEnsTextRecord(name, 'walrus', rpcUrl);
		if (!textRecord) {
			return null;
		}
		
		return parseWalrusText(textRecord);
	} catch (error) {
		console.error('Error resolving Walrus from ENS:', error);
		return null;
	}
}
