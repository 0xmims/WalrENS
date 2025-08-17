import { createPublicClient, createWalletClient, http, encodeFunctionData, namehash } from 'viem'
import { mainnet, sepolia } from 'viem/chains'
import { getEnsText, getEnsResolver, getEnsAddress } from 'viem/ens'
import { privateKeyToAccount } from 'viem/accounts'

// ENS Resolver ABI for setText
const resolverAbi = [
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
] as const

export interface WalrusMapping {
  type: 'blob' | 'site'
  id: string
  index?: string
}

export async function verifyEnsOwnership(
  ensName: string, 
  address: string,
  rpcUrl?: string
): Promise<boolean> {
  try {
    const client = createPublicClient({
      chain: rpcUrl?.includes('sepolia') ? sepolia : mainnet,
      transport: http(rpcUrl || process.env.NEXT_PUBLIC_ETH_RPC_URL),
    })

    const owner = await getEnsAddress(client, { name: ensName })
    return owner?.toLowerCase() === address.toLowerCase()
  } catch (error) {
    console.error('ENS ownership verification failed:', error)
    return false
  }
}

export async function getEnsWalrusRecord(
  ensName: string,
  rpcUrl?: string
): Promise<WalrusMapping | null> {
  try {
    const client = createPublicClient({
      chain: rpcUrl?.includes('sepolia') ? sepolia : mainnet,
      transport: http(rpcUrl || process.env.NEXT_PUBLIC_ETH_RPC_URL),
    })

    const walrusText = await getEnsText(client, {
      name: ensName,
      key: 'walrus',
    })

    if (!walrusText) return null

    // Parse walrus text record
    if (walrusText.startsWith('blob:')) {
      return {
        type: 'blob',
        id: walrusText.slice(5)
      }
    }

    try {
      const parsed = JSON.parse(walrusText)
      if (parsed.type === 'site' && parsed.id) {
        return {
          type: 'site',
          id: parsed.id,
          index: parsed.index || 'index.html'
        }
      }
    } catch {
      // Invalid JSON, try legacy format
      if (walrusText.startsWith('walrus-site:')) {
        return {
          type: 'site',
          id: walrusText.slice(12)
        }
      }
    }

    return null
  } catch (error) {
    console.error('Failed to get ENS walrus record:', error)
    return null
  }
}

export async function setEnsWalrusRecord(
  ensName: string,
  mapping: WalrusMapping,
  options: {
    privateKey?: string
    rpcUrl?: string
    useContenthash?: boolean
  } = {}
): Promise<string> {
  const { privateKey, rpcUrl, useContenthash = false } = options

  if (!privateKey && !process.env.PRIVATE_KEY) {
    throw new Error('Private key required for ENS record updates')
  }

  const actualPrivateKey = (privateKey || process.env.PRIVATE_KEY) as `0x${string}`
  const actualRpcUrl = rpcUrl || process.env.ETH_RPC_URL

  if (!actualRpcUrl) {
    throw new Error('RPC URL required')
  }

  const chain = actualRpcUrl.includes('sepolia') ? sepolia : mainnet
  const account = privateKeyToAccount(actualPrivateKey)

  const publicClient = createPublicClient({
    chain,
    transport: http(actualRpcUrl),
  })

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(actualRpcUrl),
  })

  // Get the resolver for this ENS name
  const resolver = await getEnsResolver(publicClient, { name: ensName })
  if (!resolver) {
    throw new Error(`No resolver found for ENS name: ${ensName}`)
  }

  // For now, always use text record (contenthash support can be added later)
  const textValue = mapping.type === 'blob' 
    ? `blob:${mapping.id}`
    : JSON.stringify(mapping)

  // Encode the setText function call
  const node = namehash(ensName)
  const data = encodeFunctionData({
    abi: resolverAbi,
    functionName: 'setText',
    args: [node, 'walrus', textValue]
  })

  // Send the transaction
  const hash = await walletClient.sendTransaction({
    to: resolver,
    data,
    gas: 100000n,
  })

  return hash
}