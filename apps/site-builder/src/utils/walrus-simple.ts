import { uploadToWalrus } from '@walrens/sdk'

/**
 * Simple function to upload a single HTML file to Walrus for testing
 * This bypasses the full Walrus Sites creation and just uploads the content
 */
export async function uploadHtmlToWalrus(html: string): Promise<string> {
  try {
    const content = new TextEncoder().encode(html)
    const blobId = await uploadToWalrus(content)
    console.log('Successfully uploaded HTML to Walrus blob:', blobId)
    return blobId
  } catch (error) {
    console.error('Failed to upload HTML to Walrus:', error)
    throw error
  }
}

/**
 * Create a simple preview URL for a Walrus blob
 */
export function createWalrusPreviewUrl(blobId: string): string {
  return `https://aggregator.walrus-testnet.walrus.space/v1/${blobId}`
}