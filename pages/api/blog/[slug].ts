import { NextApiRequest, NextApiResponse } from 'next'
import { readFile, writeFile, access } from 'fs/promises'
import { join } from 'path'

// Simple JSON file-based storage for linking data
const LINKAGE_FILE = join(process.cwd(), 'data', 'blog-linkage.json')

interface BlogLinkage {
  ens: string
  title: string
  slug: string
  vercelPreviewUrl: string
  walrusCid: string
  timestamp: string
}

interface LinkageDatabase {
  [slug: string]: BlogLinkage
}

async function ensureDataDir() {
  try {
    await access(join(process.cwd(), 'data'))
  } catch {
    // Directory doesn't exist, but we'll handle this gracefully
    // In a real app, you'd want to create it or use a proper database
  }
}

async function loadLinkageData(): Promise<LinkageDatabase> {
  try {
    await ensureDataDir()
    const data = await readFile(LINKAGE_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return {}
  }
}

async function saveLinkageData(data: LinkageDatabase): Promise<void> {
  try {
    await ensureDataDir()
    await writeFile(LINKAGE_FILE, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Failed to save linkage data:', error)
    throw new Error('Failed to save linkage data')
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { slug } = req.query

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Invalid slug parameter' })
  }

  if (req.method === 'GET') {
    // Retrieve blog linkage data
    try {
      const linkageData = await loadLinkageData()
      const blogData = linkageData[slug]

      if (!blogData) {
        return res.status(404).json({ 
          error: `No blog data found for slug: ${slug}` 
        })
      }

      return res.status(200).json(blogData)

    } catch (error) {
      return res.status(500).json({ 
        error: 'Failed to retrieve blog data' 
      })
    }

  } else if (req.method === 'POST') {
    // Store blog linkage data
    try {
      const { ens, title, vercelPreviewUrl, walrusCid }: Partial<BlogLinkage> = req.body

      if (!ens || !title || !vercelPreviewUrl || !walrusCid) {
        return res.status(400).json({ 
          error: 'Missing required fields: ens, title, vercelPreviewUrl, walrusCid' 
        })
      }

      const linkageData = await loadLinkageData()
      
      linkageData[slug] = {
        ens,
        title,
        slug,
        vercelPreviewUrl,
        walrusCid,
        timestamp: new Date().toISOString()
      }

      await saveLinkageData(linkageData)

      return res.status(200).json({ 
        success: true, 
        message: 'Blog linkage data saved',
        data: linkageData[slug]
      })

    } catch (error) {
      return res.status(500).json({ 
        error: 'Failed to save blog data' 
      })
    }

  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}
