import { createPublicClient, http, createWalletClient as createViemWalletClient, parseEther } from 'viem';
import { getEnsText, getEnsResolver } from 'viem/ens';
import { mainnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { encodeFunctionData } from 'viem';
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
	key?: string;
}): Promise<`0x${string}`> {
	try {
		const client = createViemClient(opts.rpcUrl);
		const walletClient = createWalletClient(opts.rpcUrl, opts.privateKey);
		
		// Get the resolver address for this ENS name
		const resolver = await getEnsResolver(client, { name: opts.name });
		if (!resolver) {
			throw new Error(`No resolver found for ENS name: ${opts.name}`);
		}

		// ENS Text Resolver ABI for setText function
		const textResolverAbi = [
			{
				name: 'setText',
				type: 'function',
				stateMutability: 'nonpayable',
				inputs: [
					{ name: 'node', type: 'bytes32' },
					{ name: 'key', type: 'string' },
					{ name: 'value', type: 'string' }
				],
				outputs: []
			}
		] as const;

		// Calculate ENS node hash (namehash)
		const node = await getNodeHash(opts.name);
		
		// Encode the setText function call
		const data = encodeFunctionData({
			abi: textResolverAbi,
			functionName: 'setText',
			args: [node, opts.key || 'walrus', opts.value]
		});

		// Send transaction to resolver
		const hash = await walletClient.sendTransaction({
			to: resolver,
			data,
			gas: 100000n, // Reasonable gas limit for setText
		});

		return hash;
	} catch (error) {
		console.error('Error setting ENS text record:', error);
		throw error;
	}
}

/**
 * Calculate ENS namehash for a given name
 * @param name ENS name (e.g., 'example.eth')
 * @returns Namehash as bytes32
 */
async function getNodeHash(name: string): Promise<`0x${string}`> {
	// Import keccak256 and toBytes for namehash calculation
	const { keccak256, toBytes } = await import('viem');
	
	function namehash(name: string): `0x${string}` {
		if (!name) return '0x0000000000000000000000000000000000000000000000000000000000000000';
		
		const labels = name.toLowerCase().split('.');
		let node = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;
		
		for (let i = labels.length - 1; i >= 0; i--) {
			const labelHash = keccak256(toBytes(labels[i]));
			node = keccak256(toBytes(node + labelHash.slice(2)));
		}
		
		return node;
	}
	
	return namehash(name);
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
		// Try the new walrus-site text record first
		let textRecord = await getEnsTextRecord(name, 'walrus-site', rpcUrl);
		
		// Fall back to legacy walrus text record
		if (!textRecord) {
			textRecord = await getEnsTextRecord(name, 'walrus', rpcUrl);
		}
		
		if (!textRecord) {
			return null;
		}
		
		return parseWalrusText(textRecord);
	} catch (error) {
		console.error('Error resolving Walrus from ENS:', error);
		return null;
	}
}

/**
 * Set ENS text record for Walrus Site with enhanced format support
 * @param opts Options object containing ENS name, mapping, RPC URL, and private key
 * @returns Transaction hash
 */
export async function setEnsWalrusSiteRecord(opts: {
	name: string;
	mapping: WalrusMapping;
	rpcUrl: string;
	privateKey: `0x${string}`;
	useNewFormat?: boolean; // Use walrus-site instead of walrus text record
}): Promise<`0x${string}`> {
	const textKey = opts.useNewFormat ? 'walrus-site' : 'walrus';
	const textValue = stringifyWalrusMapping(opts.mapping);
	
	// Use the enhanced format for walrus-site records
	if (opts.useNewFormat && opts.mapping.type === 'site') {
		const enhancedValue = JSON.stringify({
			type: 'site',
			objectId: opts.mapping.id,
			network: 'sui-testnet', // or sui-mainnet
			index: opts.mapping.index || 'index.html'
		});
		
		return await setEnsTextRecord({
			name: opts.name,
			value: enhancedValue,
			rpcUrl: opts.rpcUrl,
			privateKey: opts.privateKey,
			key: textKey
		});
	}
	
	return await setEnsTextRecord({
		name: opts.name,
		value: textValue,
		rpcUrl: opts.rpcUrl,
		privateKey: opts.privateKey,
		key: textKey
	});
}
