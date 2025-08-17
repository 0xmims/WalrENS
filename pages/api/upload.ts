import { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import JSZip from 'jszip'

export const config = {
  api: {
    bodyParser: false,
  },
}

interface UploadResult {
  success: boolean
  objectId?: string
  error?: string
  previewUrl?: string
  files?: string[]
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResult>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB
      keepExtensions: true,
    })

    const [fields, files] = await form.parse(req)
    
    if (!files.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' })
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file
    const fileBuffer = fs.readFileSync(file.filepath)

    // Determine if it's a zip file or individual files
    let walrusPayload: Buffer
    let fileList: string[] = []

    if (file.mimetype === 'application/zip' || file.originalFilename?.endsWith('.zip')) {
      // Handle zip file
      const zip = new JSZip()
      const zipContent = await zip.loadAsync(fileBuffer)
      
      // Extract files and create new zip for Walrus
      const newZip = new JSZip()
      
      for (const [filename, fileData] of Object.entries(zipContent.files)) {
        if (!fileData.dir) {
          const content = await fileData.async('uint8array')
          newZip.file(filename, content)
          fileList.push(filename)
        }
      }
      
      walrusPayload = Buffer.from(await newZip.generateAsync({ type: 'uint8array' }))
    } else {
      // Single file
      walrusPayload = fileBuffer
      fileList = [file.originalFilename || 'index.html']
    }

    // Upload to Walrus
    const walrusUrl = `${process.env.WALRUS_BASE}/v1/blobs`
    const uploadResponse = await fetch(walrusUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
        ...(process.env.WALRUS_API_KEY && {
          'Authorization': `Bearer ${process.env.WALRUS_API_KEY}`
        })
      },
      body: walrusPayload as BodyInit
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      throw new Error(`Walrus upload failed: ${uploadResponse.status} ${errorText}`)
    }

    const walrusResult = await uploadResponse.json()
    
    // Extract blob ID from Walrus response
    let blobId: string
    if (walrusResult.newlyCreated) {
      blobId = walrusResult.newlyCreated.blobObject.blobId
    } else if (walrusResult.alreadyCertified) {
      blobId = walrusResult.alreadyCertified.blobId
    } else {
      throw new Error('Unexpected Walrus response format')
    }

    const previewUrl = `${process.env.NEXT_PUBLIC_WALRUS_BASE}/v1/blobs/${blobId}`

    // Clean up temporary file
    fs.unlinkSync(file.filepath)

    return res.status(200).json({
      success: true,
      objectId: blobId,
      previewUrl,
      files: fileList
    })

  } catch (error) {
    console.error('Upload error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    })
  }
}