import { useState, useEffect } from 'react'
import { EyeIcon, DevicePhoneMobileIcon, ComputerDesktopIcon, DeviceTabletIcon } from '@heroicons/react/24/outline'

interface SitePreviewProps {
  files: Array<{ path: string; content: string | ArrayBuffer }>
  selectedTemplate: string | null
}

type ViewportSize = 'mobile' | 'tablet' | 'desktop'

const viewportSizes = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1200, height: 800 }
}

export default function SitePreview({ files, selectedTemplate }: SitePreviewProps) {
  const [viewport, setViewport] = useState<ViewportSize>('desktop')
  const [previewHtml, setPreviewHtml] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    generatePreview()
  }, [files, selectedTemplate])

  const generatePreview = async () => {
    setLoading(true)
    
    try {
      // Find the main HTML file
      let htmlFile = files.find(f => 
        f.path === 'index.html' || 
        f.path.endsWith('/index.html') ||
        f.path.endsWith('.html')
      )

      if (!htmlFile && selectedTemplate) {
        // Generate template-based HTML if no HTML file is uploaded
        htmlFile = { path: 'index.html', content: generateTemplateHtml(selectedTemplate) }
      }

      if (htmlFile && typeof htmlFile.content === 'string') {
        // Create a basic preview with inline styles/scripts
        let html = htmlFile.content

        // Inject other files as inline content for preview
        files.forEach(file => {
          if (file.path.endsWith('.css') && typeof file.content === 'string') {
            html = html.replace(
              '</head>', 
              `<style>${file.content}</style></head>`
            )
          } else if (file.path.endsWith('.js') && typeof file.content === 'string') {
            html = html.replace(
              '</body>', 
              `<script>${file.content}</script></body>`
            )
          }
        })

        setPreviewHtml(html)
      } else {
        setPreviewHtml('<div style="padding: 2rem; text-align: center; color: #666;">No HTML file found. Please upload an index.html file or select a template.</div>')
      }
    } catch (error) {
      console.error('Error generating preview:', error)
      setPreviewHtml('<div style="padding: 2rem; text-align: center; color: #666;">Error generating preview.</div>')
    } finally {
      setLoading(false)
    }
  }

  const generateTemplateHtml = (templateId: string): string => {
    const baseHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 2rem; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { color: #333; margin-bottom: 1rem; }
        p { color: #666; margin-bottom: 1rem; }
        .section { margin-bottom: 2rem; padding: 1rem; border: 1px solid #ddd; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
        ${getTemplateContent(templateId)}
    </div>
</body>
</html>`
    return baseHtml
  }

  const getTemplateContent = (templateId: string): string => {
    switch (templateId) {
      case 'personal':
        return `
          <h1>Hello, I'm John Doe</h1>
          <div class="section">
            <h2>About Me</h2>
            <p>I'm a passionate developer who loves creating amazing web experiences.</p>
          </div>
          <div class="section">
            <h2>Contact</h2>
            <p>Get in touch: john@example.com</p>
          </div>
        `
      case 'portfolio':
        return `
          <h1>My Portfolio</h1>
          <div class="section">
            <h2>Featured Projects</h2>
            <p>Here are some of my recent projects and work.</p>
          </div>
          <div class="section">
            <h2>Skills</h2>
            <p>React, TypeScript, Node.js, and more.</p>
          </div>
        `
      case 'blog':
        return `
          <h1>My Blog</h1>
          <div class="section">
            <h2>Latest Posts</h2>
            <p>Welcome to my blog where I share thoughts on technology and development.</p>
          </div>
          <div class="section">
            <h2>Categories</h2>
            <p>Technology, Web Development, React</p>
          </div>
        `
      case 'business':
        return `
          <h1>Our Business</h1>
          <div class="section">
            <h2>Services</h2>
            <p>We provide high-quality services to help your business grow.</p>
          </div>
          <div class="section">
            <h2>Contact Us</h2>
            <p>Ready to work together? Get in touch today.</p>
          </div>
        `
      default:
        return '<h1>Website Preview</h1><p>Select a template or upload files to see your website preview.</p>'
    }
  }

  const currentSize = viewportSizes[viewport]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <EyeIcon className="w-6 h-6 mr-2" />
            Preview
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            See how your website will look across different devices
          </p>
        </div>

        {/* Viewport Controls */}
        <div className="flex space-x-2">
          <button
            onClick={() => setViewport('mobile')}
            className={`p-2 rounded-lg ${
              viewport === 'mobile'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
            aria-label="Mobile view"
          >
            <DevicePhoneMobileIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewport('tablet')}
            className={`p-2 rounded-lg ${
              viewport === 'tablet'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
            aria-label="Tablet view"
          >
            <DeviceTabletIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewport('desktop')}
            className={`p-2 rounded-lg ${
              viewport === 'desktop'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
            aria-label="Desktop view"
          >
            <ComputerDesktopIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Preview Frame */}
      <div className="flex justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-8">
        <div 
          className="bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden transition-all duration-300"
          style={{
            width: Math.min(currentSize.width, window.innerWidth - 200),
            height: Math.min(currentSize.height, window.innerHeight - 300),
            maxWidth: '100%'
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <iframe
              srcDoc={previewHtml}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
              title="Website Preview"
            />
          )}
        </div>
      </div>

      {/* Preview Info */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        Viewing in {viewport} mode ({currentSize.width} × {currentSize.height}px)
      </div>
    </div>
  )
}
