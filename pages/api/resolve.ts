import { NextApiRequest, NextApiResponse } from 'next'
import { createPublicClient, http } from 'viem'
import { mainnet, sepolia } from 'viem/chains'
import { getEnsText } from 'viem/ens'

interface ResolveResult {
  success: boolean
  ensName?: string
  walrusMapping?: {
    type: 'blob' | 'site'
    id: string
    index?: string
  }
  previewUrl?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResolveResult>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { name } = req.query

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ success: false, error: 'ENS name is required' })
  }

  try {
    const rpcUrl = process.env.ETH_RPC_URL || process.env.NEXT_PUBLIC_ETH_RPC_URL
    if (!rpcUrl) {
      throw new Error('No RPC URL configured')
    }

    // Create viem client
    const client = createPublicClient({
      chain: rpcUrl.includes('sepolia') ? sepolia : mainnet,
      transport: http(rpcUrl),
    })

    // Try to get walrus text record
    let walrusText: string | null = null
    try {
      walrusText = await getEnsText(client, {
        name,
        key: 'walrus',
      })
    } catch (error) {
      console.warn(`Failed to get 'walrus' text record for ${name}:`, error)
    }

    // If no walrus record, try contenthash
    if (!walrusText) {
      try {
        // For now, we'll focus on text records
        // Contenthash support can be added later
      } catch (error) {
        console.warn(`Failed to get contenthash for ${name}:`, error)
      }
    }

    if (!walrusText) {
      return res.status(404).json({
        success: false,
        error: `No Walrus mapping found for ${name}`
      })
    }

    // Parse the walrus text record
    let walrusMapping: ResolveResult['walrusMapping']
    
    if (walrusText.startsWith('blob:')) {
      walrusMapping = {
        type: 'blob',
        id: walrusText.slice(5)
      }
    } else {
      try {
        const parsed = JSON.parse(walrusText)
        if (parsed.type === 'site' && parsed.id) {
          walrusMapping = {
            type: 'site',
            id: parsed.id,
            index: parsed.index || 'index.html'
          }
        } else {
          throw new Error('Invalid walrus mapping format')
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: `Invalid walrus text record format for ${name}`
        })
      }
    }

    const previewUrl = `${process.env.NEXT_PUBLIC_WALRUS_BASE}/v1/blobs/${walrusMapping.id}`

    return res.status(200).json({
      success: true,
      ensName: name,
      walrusMapping,
      previewUrl
    })

  } catch (error) {
    console.error('Resolve error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Resolution failed'
    })
  }
}