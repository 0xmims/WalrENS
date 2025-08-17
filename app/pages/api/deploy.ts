import { NextApiRequest, NextApiResponse } from 'next'
import JSZip from 'jszip'
import { setEnsWalrusRecord } from '../../lib/ens'

// Force Node runtime to handle Buffer operations
export const config = {
  runtime: 'nodejs',
}

interface DeployRequest {
  ens: string
  walrusUrl?: string
  files?: Array<{
    name: string
    content: string
  }>
}

interface DeployResult {
  success: boolean
  deploymentUrl?: string
  domain?: string
  ensTransactionHash?: string
  error?: string
  deploymentId?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeployResult>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  // Validate environment variables
  const requiredEnvVars = {
    VERCEL_TOKEN: process.env.VERCEL_TOKEN,
    BASE_DOMAIN: process.env.BASE_DOMAIN || 'walrens.app',
    ETH_RPC_URL: process.env.ETH_RPC_URL,
    WALRUS_BASE: process.env.WALRUS_BASE
  }

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      return res.status(500).json({ 
        success: false, 
        error: `Missing environment variable: ${key}` 
      })
    }
  }

  try {
    const { ens, walrusUrl, files }: DeployRequest = req.body

    if (!ens) {
      return res.status(400).json({ 
        success: false, 
        error: 'ENS name is required' 
      })
    }

    if (!walrusUrl && !files) {
      return res.status(400).json({ 
        success: false, 
        error: 'Either walrusUrl or files must be provided' 
      })
    }

    // Step 1: Prepare files for deployment
    let deploymentFiles: Record<string, { file: string }> = {}

    if (walrusUrl) {
      console.log(`Fetching files from Walrus: ${walrusUrl}`)
      
      try {
        const walrusResponse = await fetch(walrusUrl)
        if (!walrusResponse.ok) {
          throw new Error(`Failed to fetch from Walrus: ${walrusResponse.status}`)
        }

        const arrayBuffer = await walrusResponse.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)

        // Try to unzip if it's a zip file
        try {
          const zip = new JSZip()
          const zipContent = await zip.loadAsync(uint8Array)
          
          for (const [filename, fileData] of Object.entries(zipContent.files)) {
            if (!fileData.dir) {
              const content = await fileData.async('string')
              deploymentFiles[filename] = { file: content }
            }
          }
          
          console.log(`Extracted ${Object.keys(deploymentFiles).length} files from zip`)
        } catch (zipError) {
          // Not a zip file, treat as single file
          const content = new TextDecoder().decode(uint8Array)
          const filename = walrusUrl.includes('index.html') ? 'index.html' : 'index.html'
          deploymentFiles[filename] = { file: content }
          console.log('Treated as single HTML file')
        }
      } catch (error) {
        console.error('Error fetching from Walrus:', error)
        return res.status(400).json({
          success: false,
          error: `Failed to fetch files from Walrus: ${error instanceof Error ? error.message : 'Unknown error'}`
        })
      }
    } else if (files) {
      // Use provided files
      files.forEach(file => {
        deploymentFiles[file.name] = { file: file.content }
      })
      console.log(`Using ${files.length} provided files`)
    }

    // Ensure we have an index.html
    if (!deploymentFiles['index.html']) {
      const htmlFiles = Object.keys(deploymentFiles).filter(name => name.endsWith('.html'))
      if (htmlFiles.length > 0) {
        // Rename first HTML file to index.html
        const firstHtml = htmlFiles[0]
        deploymentFiles['index.html'] = deploymentFiles[firstHtml]
        if (firstHtml !== 'index.html') {
          delete deploymentFiles[firstHtml]
        }
      } else {
        // Create a basic index.html
        deploymentFiles['index.html'] = {
          file: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${ens}</title>
</head>
<body>
    <h1>Welcome to ${ens}</h1>
    <p>This site was deployed with WalrENS.</p>
</body>
</html>`
        }
      }
    }

    // Step 2: Create Vercel deployment
    console.log('Creating Vercel deployment...')
    
    // Convert files object to array format for Vercel API
    const filesArray = Object.entries(deploymentFiles).map(([filename, data]) => ({
      file: filename,
      data: data.file
    }))

    const deploymentPayload = {
      name: ens.replace('.eth', ''),
      files: filesArray,
      projectSettings: {
        framework: null,
        devCommand: null,
        buildCommand: null,
        outputDirectory: null
      },
      target: 'production'
    }

    const vercelHeaders: Record<string, string> = {
      'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`,
      'Content-Type': 'application/json'
    }

    // Add team ID if provided
    if (process.env.VERCEL_TEAM_ID) {
      vercelHeaders['X-Team-Id'] = process.env.VERCEL_TEAM_ID
    }

    const deploymentResponse = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: vercelHeaders,
      body: JSON.stringify(deploymentPayload)
    })

    if (!deploymentResponse.ok) {
      const errorData = await deploymentResponse.text()
      console.error('Vercel deployment failed:', errorData)
      return res.status(500).json({
        success: false,
        error: `Vercel deployment failed: ${deploymentResponse.status} ${errorData}`
      })
    }

    const deploymentResult = await deploymentResponse.json()
    const deploymentId = deploymentResult.id
    const deploymentUrl = `https://${deploymentResult.url}`

    console.log(`Deployment created: ${deploymentId} at ${deploymentUrl}`)

    // Step 3: Wait for deployment to be ready
    console.log('Waiting for deployment to be ready...')
    
    let deploymentReady = false
    let attempts = 0
    const maxAttempts = 30

    while (!deploymentReady && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const statusResponse = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
        headers: vercelHeaders
      })
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        if (statusData.readyState === 'READY') {
          deploymentReady = true
        } else if (statusData.readyState === 'ERROR') {
          throw new Error('Deployment failed during build')
        }
      }
      
      attempts++
    }

    if (!deploymentReady) {
      console.warn('Deployment taking longer than expected, proceeding anyway')
    }

    // Step 4: Configure custom domain
    const customDomain = `${ens}.${process.env.BASE_DOMAIN}`
    console.log(`Configuring domain: ${customDomain}`)

    // First, add domain to project if PROJECT_ID is configured
    if (process.env.PROJECT_ID) {
      try {
        const domainResponse = await fetch(`https://api.vercel.com/v9/projects/${process.env.PROJECT_ID}/domains`, {
          method: 'POST',
          headers: vercelHeaders,
          body: JSON.stringify({
            name: customDomain
          })
        })

        if (!domainResponse.ok) {
          const domainError = await domainResponse.text()
          console.warn(`Domain configuration warning: ${domainError}`)
          // Continue anyway - domain might already exist
        } else {
          console.log(`Domain ${customDomain} configured successfully`)
        }
      } catch (domainError) {
        console.warn('Domain configuration failed:', domainError)
        // Continue anyway
      }
    }

    // Step 5: Update ENS record
    let ensTransactionHash: string | undefined

    if (process.env.PRIVATE_KEY && walrusUrl) {
      try {
        console.log('Updating ENS record...')
        
        // Create Walrus mapping
        const walrusMapping = {
          type: 'site' as const,
          id: walrusUrl.split('/').pop() || '',
          index: 'index.html'
        }

        ensTransactionHash = await setEnsWalrusRecord(ens, walrusMapping, {
          rpcUrl: process.env.ETH_RPC_URL,
          privateKey: process.env.PRIVATE_KEY
        })

        console.log(`ENS record updated: ${ensTransactionHash}`)
      } catch (ensError) {
        console.error('ENS update failed:', ensError)
        // Don't fail the entire deployment for ENS errors
      }
    } else {
      console.log('Skipping ENS update - no private key or walrus URL')
    }

    return res.status(200).json({
      success: true,
      deploymentUrl,
      domain: customDomain,
      deploymentId,
      ensTransactionHash
    })

  } catch (error) {
    console.error('Deploy error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Deployment failed'
    })
  }
}