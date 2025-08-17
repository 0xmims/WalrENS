import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeftIcon, RocketLaunchIcon } from '@heroicons/react/24/outline'
import TemplateSelector from '../components/TemplateSelector'
import FileUploader, { UploadedFile } from '../components/FileUploader'
import SitePreview from '../components/SitePreview'
import DeploymentStatus, { DeploymentResult } from '../components/DeploymentStatus'
import WalletConnection from '../components/WalletConnection'
import { deployWebsiteToWalrus } from '@walrens/sdk'
import { useSetEnsWalrusSite, useVerifyEnsOwnership } from '../utils/ens-wagmi'
import { uploadHtmlToWalrus, createWalrusPreviewUrl } from '../utils/walrus-simple'
import { useWallet } from '../hooks/useWallet'
import { saveDeployedSite } from '../utils/storage'
import { useErrorHandler } from '../hooks/useErrorHandler'

type BuilderStep = 'template' | 'upload' | 'preview' | 'deploy' | 'complete'

export default function Builder() {
  const { address, isReady } = useWallet()
  const { handleApiError, handleSuccess, handleValidationError } = useErrorHandler()
  const setEnsWalrusSite = useSetEnsWalrusSite()
  const verifyEnsOwnership = useVerifyEnsOwnership()
  const [currentStep, setCurrentStep] = useState<BuilderStep>('template')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [ensName, setEnsName] = useState('')
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null)

  const steps = [
    { id: 'template', name: 'Choose Template', completed: selectedTemplate !== null },
    { id: 'upload', name: 'Upload Files', completed: uploadedFiles.length > 0 },
    { id: 'preview', name: 'Preview', completed: false },
    { id: 'deploy', name: 'Deploy', completed: deploymentResult?.success || false }
  ]

  const canProceedToNext = () => {
    switch (currentStep) {
      case 'template':
        return selectedTemplate !== null
      case 'upload':
        return uploadedFiles.length > 0 || selectedTemplate !== null
      case 'preview':
        return ensName.trim() !== '' && isReady
      default:
        return false
    }
  }

  const handleNext = () => {
    switch (currentStep) {
      case 'template':
        setCurrentStep('upload')
        break
      case 'upload':
        setCurrentStep('preview')
        break
      case 'preview':
        setCurrentStep('deploy')
        break
    }
  }

  const handlePrevious = () => {
    switch (currentStep) {
      case 'upload':
        setCurrentStep('template')
        break
      case 'preview':
        setCurrentStep('upload')
        break
      case 'deploy':
        setCurrentStep('preview')
        break
    }
  }

  const handleDeploy = async () => {
    if (!ensName.trim()) {
      handleValidationError('ENS Name', 'Please enter an ENS name')
      return
    }

    if (!ensName.endsWith('.eth')) {
      handleValidationError('ENS Name', 'ENS name must end with .eth')
      return
    }

    setIsDeploying(true)
    setCurrentStep('complete')

    try {
      // Prepare files for deployment
      const filesToDeploy = await Promise.all(
        uploadedFiles.map(async (file) => {
          const content = await readFileAsArrayBuffer(file.file)
          return {
            path: file.path,
            content: new Uint8Array(content)
          }
        })
      )

      // If no files uploaded but template selected, generate template files
      if (filesToDeploy.length === 0 && selectedTemplate) {
        filesToDeploy.push({
          path: 'index.html',
          content: new TextEncoder().encode(generateTemplateHtml(selectedTemplate))
        })
      }

      if (!address) {
        throw new Error('Ethereum wallet must be connected for deployment')
      }

      // Verify ENS ownership before deployment
      const ownsEns = await verifyEnsOwnership(ensName, address)
      if (!ownsEns) {
        throw new Error(`You don't own the ENS name ${ensName}. Please connect the wallet that owns this ENS name.`)
      }

      // For testing: Upload HTML content directly to Walrus as a blob
      // In production, this would be handled server-side with proper Walrus Sites creation
      console.log('Uploading content to Walrus for testing...')
      
      let htmlContent = ''
      if (filesToDeploy.length > 0) {
        // Use the first HTML file or generate from template
        const htmlFile = filesToDeploy.find(f => f.path.endsWith('.html')) || filesToDeploy[0]
        htmlContent = new TextDecoder().decode(htmlFile.content)
      } else if (selectedTemplate) {
        htmlContent = generateTemplateHtml(selectedTemplate)
      } else {
        htmlContent = `<!DOCTYPE html>
<html><head><title>${ensName}</title></head>
<body><h1>Welcome to ${ensName}!</h1><p>This site was deployed with WalrENS.</p></body>
</html>`
      }
      
      let result
      try {
        // Upload HTML content to Walrus
        const blobId = await uploadHtmlToWalrus(htmlContent)
        const previewUrl = createWalrusPreviewUrl(blobId)
        
        result = {
          objectId: blobId, // Use blob ID as object ID for now
          transactionHash: '0x' + Math.random().toString(16).slice(2), // Mock transaction hash
          resources: [{
            path: '/index.html',
            blobId: blobId,
            contentType: 'text/html',
            headers: { 'Content-Type': 'text/html' }
          }],
          previewUrl: previewUrl
        }
        
        console.log('Successfully uploaded to Walrus:', result)
      } catch (walrusError) {
        console.error('Walrus upload failed:', walrusError)
        throw new Error(`Failed to upload to Walrus: ${walrusError instanceof Error ? walrusError.message : String(walrusError)}`)
      }
      
      // Set ENS text record using connected wallet
      await setEnsWalrusSite(ensName, result.objectId, true)

      // Save to localStorage for dashboard
      try {
        saveDeployedSite({
          ensName: ensName,
          objectId: result.objectId,
          transactionHash: result.transactionHash,
          filesCount: result.resources.length,
          template: selectedTemplate || 'custom',
          status: 'active',
          previewUrl: result.previewUrl,
          gatewayUrl: `https://${ensName}.walrus.site`
        })
      } catch (error) {
        console.warn('Failed to save site to dashboard:', error)
      }

      handleSuccess(`Successfully deployed ${ensName} to Walrus Sites!`)
      
      setDeploymentResult({
        success: true,
        objectId: result.objectId,
        transactionHash: result.transactionHash,
        ensName: ensName,
        gatewayUrl: `https://${ensName}.walrus.site`,
        previewUrl: result.previewUrl,
        filesUploaded: result.resources.length
      })

    } catch (error) {
      console.error('Deployment error:', error)
      handleApiError(error, 'deployment')
      setDeploymentResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deployment error'
      })
    } finally {
      setIsDeploying(false)
    }
  }

  const handleReset = () => {
    setCurrentStep('template')
    setSelectedTemplate(null)
    setUploadedFiles([])
    setEnsName('')
    setDeploymentResult(null)
    setIsDeploying(false)
  }

  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  const generateTemplateHtml = (templateId: string): string => {
    // This would generate more sophisticated HTML based on the template
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My ${templateId.charAt(0).toUpperCase() + templateId.slice(1)} Site</title>
    <style>
        body { font-family: system-ui, sans-serif; margin: 0; padding: 2rem; }
        .container { max-width: 800px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to my ${templateId} site!</h1>
        <p>This site was created with WalrENS and deployed to Walrus Sites.</p>
    </div>
</body>
</html>`
  }

  const getPreviewFiles = () => {
    return uploadedFiles.map(file => ({
      path: file.path,
      content: file.file.toString() // This is simplified - would need proper file reading
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                to="/"
                className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Home
              </Link>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              WalrENS Site Builder
            </h1>
            <div className="w-24"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        {currentStep !== 'complete' && (
          <div className="mb-8">
            <nav aria-label="Progress">
              <ol className="flex items-center justify-center space-x-8">
                {steps.map((step, index) => (
                  <li key={step.id} className="flex items-center">
                    <div className={`
                      flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                      ${step.completed || currentStep === step.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }
                    `}>
                      {step.completed ? '✓' : index + 1}
                    </div>
                    <span className={`
                      ml-2 text-sm font-medium
                      ${step.completed || currentStep === step.id
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400'
                      }
                    `}>
                      {step.name}
                    </span>
                    {index < steps.length - 1 && (
                      <div className="w-8 h-px bg-gray-300 dark:bg-gray-600 ml-4" />
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        )}

        {/* Step Content */}
        <div className="max-w-4xl mx-auto">
          {currentStep === 'template' && (
            <TemplateSelector
              selectedTemplate={selectedTemplate}
              onSelectTemplate={setSelectedTemplate}
            />
          )}

          {currentStep === 'upload' && (
            <FileUploader
              files={uploadedFiles}
              onFilesChange={setUploadedFiles}
            />
          )}

          {currentStep === 'preview' && (
            <div className="space-y-6">
              <SitePreview
                files={getPreviewFiles()}
                selectedTemplate={selectedTemplate}
              />
              
              {/* ENS Name Input */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <label htmlFor="ensName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ENS Name
                </label>
                <input
                  type="text"
                  id="ensName"
                  value={ensName}
                  onChange={(e) => setEnsName(e.target.value)}
                  placeholder="yourname.eth"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Enter the ENS name where your site will be accessible
                </p>
              </div>

              {/* Wallet Setup */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Wallet Configuration
                </h3>
                <WalletConnection />
              </div>
            </div>
          )}

          {currentStep === 'deploy' && (
            <div className="text-center space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ready to Deploy</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Your site will be deployed to <span className="font-mono text-blue-600">{ensName}</span>
                </p>
              </div>
              
              <button
                onClick={handleDeploy}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg flex items-center mx-auto transition-colors"
              >
                <RocketLaunchIcon className="w-5 h-5 mr-2" />
                Deploy to Walrus Sites
              </button>
            </div>
          )}

          {currentStep === 'complete' && (
            <DeploymentStatus
              result={deploymentResult}
              isDeploying={isDeploying}
              onReset={handleReset}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        {currentStep !== 'complete' && currentStep !== 'deploy' && (
          <div className="flex justify-between mt-8 max-w-4xl mx-auto">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 'template'}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <button
              onClick={handleNext}
              disabled={!canProceedToNext()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStep === 'preview' ? 'Deploy' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
