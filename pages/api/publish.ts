import { NextApiRequest, NextApiResponse } from 'next'
import { verifyMessage } from 'viem'
import { setEnsWalrusRecord, verifyEnsOwnership } from '../../lib/ens'

interface PublishRequest {
  ensName: string
  objectId: string
  signature: string
  message: string
  address: string
  useContenthash?: boolean
}

interface PublishResult {
  success: boolean
  txHash?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublishResult>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { ensName, objectId, signature, message, address, useContenthash = false }: PublishRequest = req.body

    if (!ensName || !objectId || !signature || !message || !address) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      })
    }

    // Verify the signature to ensure the user owns the address
    const isValidSignature = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    })

    if (!isValidSignature) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid signature' 
      })
    }

    // Verify ENS ownership
    const ownsEns = await verifyEnsOwnership(ensName, address)
    if (!ownsEns) {
      return res.status(403).json({ 
        success: false, 
        error: `Address ${address} does not own ENS name ${ensName}` 
      })
    }

    // Create Walrus mapping
    const walrusMapping = {
      type: 'site' as const,
      id: objectId,
      index: 'index.html'
    }

    // Set ENS record (server-side with configured private key)
    const txHash = await setEnsWalrusRecord(ensName, walrusMapping, {
      useContenthash
    })

    return res.status(200).json({
      success: true,
      txHash
    })

  } catch (error) {
    console.error('Publish error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Publication failed'
    })
  }
}