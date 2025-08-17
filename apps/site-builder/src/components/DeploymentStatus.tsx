import { } from 'react'
import { CheckCircleIcon, ExclamationCircleIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'

export interface DeploymentResult {
  success: boolean
  objectId?: string
  transactionHash?: string
  ensName?: string
  gatewayUrl?: string
  previewUrl?: string
  error?: string
  filesUploaded?: number
}

interface DeploymentStatusProps {
  result: DeploymentResult | null
  isDeploying: boolean
  onReset: () => void
}

export default function DeploymentStatus({ result, isDeploying, onReset }: DeploymentStatusProps) {
  if (isDeploying) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            Deploying Your Site...
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            This may take a few moments. Please don't close this page.
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="animate-pulse w-4 h-4 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700 dark:text-gray-300">Uploading files to Walrus...</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <span className="text-gray-500 dark:text-gray-500">Creating Walrus Site object...</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <span className="text-gray-500 dark:text-gray-500">Setting ENS text record...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!result) {
    return null
  }

  if (result.success) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            Deployment Successful! 🎉
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Your website has been deployed to Walrus Sites and linked to your ENS name.
          </p>
        </div>

        {/* Deployment Details */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-4">
            Deployment Details
          </h3>
          
          <div className="space-y-3">
            {result.ensName && (
              <div className="flex justify-between">
                <span className="text-green-700 dark:text-green-300">ENS Name:</span>
                <span className="font-mono text-green-800 dark:text-green-200">{result.ensName}</span>
              </div>
            )}
            
            {result.objectId && (
              <div className="flex justify-between">
                <span className="text-green-700 dark:text-green-300">Walrus Object ID:</span>
                <span className="font-mono text-green-800 dark:text-green-200 truncate max-w-xs">
                  {result.objectId}
                </span>
              </div>
            )}
            
            {result.transactionHash && (
              <div className="flex justify-between">
                <span className="text-green-700 dark:text-green-300">Transaction:</span>
                <span className="font-mono text-green-800 dark:text-green-200 truncate max-w-xs">
                  {result.transactionHash}
                </span>
              </div>
            )}
            
            {result.filesUploaded && (
              <div className="flex justify-between">
                <span className="text-green-700 dark:text-green-300">Files Uploaded:</span>
                <span className="font-mono text-green-800 dark:text-green-200">{result.filesUploaded}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {result.gatewayUrl && (
            <a
              href={result.gatewayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors"
            >
              <ArrowTopRightOnSquareIcon className="w-5 h-5 mr-2" />
              Visit Your Site
            </a>
          )}
          
          {result.previewUrl && (
            <a
              href={result.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors"
            >
              <ArrowTopRightOnSquareIcon className="w-5 h-5 mr-2" />
              Preview (Walrus)
            </a>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={onReset}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Deploy Another Site
          </button>
        </div>
      </div>
    )
  }

  // Error state
  return (
    <div className="space-y-6">
      <div className="text-center">
        <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-500" />
        <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
          Deployment Failed
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Something went wrong during deployment. Please try again.
        </p>
      </div>

      {/* Error Details */}
      {result.error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Error Details
          </h3>
          <p className="text-red-700 dark:text-red-300 font-mono text-sm">
            {result.error}
          </p>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={onReset}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
