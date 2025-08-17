import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { CloudArrowUpIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline'

export interface UploadedFile {
  file: File
  path: string
  size: number
  type: string
}

interface FileUploaderProps {
  files: UploadedFile[]
  onFilesChange: (files: UploadedFile[]) => void
  maxFiles?: number
  maxSize?: number // in bytes
  accept?: Record<string, string[]>
}

export default function FileUploader({ 
  files, 
  onFilesChange, 
  maxFiles = 100,
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = {
    'text/html': ['.html', '.htm'],
    'text/css': ['.css'],
    'text/javascript': ['.js'],
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.svg'],
    'application/json': ['.json'],
    'text/plain': ['.txt', '.md']
  }
}: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      path: file.webkitRelativePath || file.name,
      size: file.size,
      type: file.type
    }))

    // Filter out files that are too large
    const validFiles = newFiles.filter(f => f.size <= maxSize)
    
    // Combine with existing files and limit total
    const allFiles = [...files, ...validFiles].slice(0, maxFiles)
    onFilesChange(allFiles)
  }, [files, onFilesChange, maxFiles, maxSize])

  const onDragEnter = useCallback(() => {
    setDragActive(true)
  }, [])

  const onDragLeave = useCallback(() => {
    setDragActive(false)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDragEnter,
    onDragLeave,
    accept,
    maxFiles,
    maxSize
  })

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    onFilesChange(newFiles)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Website Files</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Upload HTML, CSS, JavaScript, images, and other assets for your website.
        </p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive || dragActive
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
        `}
      >
        <input {...getInputProps()} />
        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          {isDragActive ? 'Drop files here' : 'Click to upload or drag and drop'}
        </p>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          HTML, CSS, JS, images, and other web assets
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
          Max {maxFiles} files, {formatFileSize(maxSize)} per file
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Uploaded Files ({files.length})
          </h3>
          
          <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            {files.map((uploadedFile, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <DocumentIcon className="h-6 w-6 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {uploadedFile.path}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {formatFileSize(uploadedFile.size)} • {uploadedFile.type || 'Unknown type'}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => removeFile(index)}
                  className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Remove file"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Summary */}
      {files.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Total files:</span>
            <span className="font-medium text-gray-900 dark:text-white">{files.length}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600 dark:text-gray-400">Total size:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatFileSize(files.reduce((sum, f) => sum + f.size, 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
