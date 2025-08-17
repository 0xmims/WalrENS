import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { slug } = req.query
  if (!slug || !Array.isArray(slug)) {
    return res.status(400).json({ error: 'Invalid request' })
  }

  const [ensName, ...pathParts] = slug
  const path = pathParts.join('/') || ''

  try {
    // Resolve ENS name to Walrus mapping
    const resolveUrl = new URL('/api/resolve', 
      req.headers.host?.startsWith('localhost') 
        ? 'http://localhost:3000' 
        : `https://${req.headers.host}`
    )
    resolveUrl.searchParams.set('name', ensName)

    const resolveResponse = await fetch(resolveUrl.toString())
    
    if (!resolveResponse.ok) {
      if (resolveResponse.status === 404) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>ENS Not Found - ${ensName}</title>
              <meta charset="utf-8">
              <style>
                body { font-family: system-ui, sans-serif; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
                .error { background: #fee; border: 1px solid #fcc; border-radius: 8px; padding: 20px; margin: 20px 0; }
                .code { background: #f5f5f5; padding: 4px 8px; border-radius: 4px; font-family: monospace; }
              </style>
            </head>
            <body>
              <h1>ENS Name Not Found</h1>
              <div class="error">
                <p>The ENS name <span class="code">${ensName}</span> does not have a Walrus Sites mapping.</p>
                <p>To set up your site:</p>
                <ol style="text-align: left; display: inline-block;">
                  <li>Visit <a href="/">WalrENS</a> to upload your site</li>
                  <li>Connect your wallet that owns <span class="code">${ensName}</span></li>
                  <li>Set the ENS text record to point to your Walrus site</li>
                </ol>
              </div>
            </body>
          </html>
        `)
      }
      throw new Error(`Resolution failed: ${resolveResponse.status}`)
    }

    const resolveData = await resolveResponse.json()
    
    if (!resolveData.success || !resolveData.walrusMapping) {
      throw new Error('Invalid resolution response')
    }

    // Fetch content from Walrus
    const walrusUrl = `${process.env.NEXT_PUBLIC_WALRUS_BASE}/v1/blobs/${resolveData.walrusMapping.id}`
    
    const walrusResponse = await fetch(walrusUrl)
    
    if (!walrusResponse.ok) {
      throw new Error(`Walrus fetch failed: ${walrusResponse.status}`)
    }

    // For blob type, serve the content directly
    if (resolveData.walrusMapping.type === 'blob') {
      const contentType = walrusResponse.headers.get('content-type') || 'text/html'
      
      res.setHeader('Content-Type', contentType)
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400')
      res.setHeader('X-ENS-Name', ensName)
      res.setHeader('X-Walrus-Blob-Id', resolveData.walrusMapping.id)
      
      const content = await walrusResponse.text()
      return res.send(content)
    }

    // For site type, we would need to implement Walrus Sites serving
    // For now, serve the blob content directly
    const contentType = walrusResponse.headers.get('content-type') || 'text/html'
    
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400')
    res.setHeader('X-ENS-Name', ensName)
    res.setHeader('X-Walrus-Object-Id', resolveData.walrusMapping.id)
    
    const content = await walrusResponse.text()
    return res.send(content)

  } catch (error) {
    console.error('Proxy error:', error)
    
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error - ${ensName}</title>
          <meta charset="utf-8">
          <style>
            body { font-family: system-ui, sans-serif; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
            .error { background: #fee; border: 1px solid #fcc; border-radius: 8px; padding: 20px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>Error Loading Site</h1>
          <div class="error">
            <p>Failed to load content for <strong>${ensName}</strong></p>
            <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
          <p><a href="/">← Back to WalrENS</a></p>
        </body>
      </html>
    `)
  }
}