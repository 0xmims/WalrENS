import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  ArrowTopRightOnSquareIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'
import { DeployedSite, getDeployedSites, removeDeployedSite } from '../utils/storage'

export default function Dashboard() {
  const [sites, setSites] = useState<DeployedSite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load sites from localStorage
    try {
      const deployedSites = getDeployedSites()
      setSites(deployedSites)
    } catch (error) {
      console.error('Error loading deployed sites:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleDeleteSite = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this site from your dashboard? This will not delete the actual deployed site.')) {
      const success = removeDeployedSite(id)
      if (success) {
        setSites(prev => prev.filter(site => site.id !== id))
      } else {
        alert('Failed to remove site from dashboard')
      }
    }
  }

  const getStatusBadge = (status: DeployedSite['status']) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>
      case 'deploying':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Deploying</span>
      case 'error':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Error</span>
    }
  }

  const getTemplateIcon = (_template: string) => {
    return <GlobeAltIcon className="w-5 h-5" />
  }

  const formatDate = (date: Date) => {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              to="/"
              className="text-xl font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
            >
              WalrENS
            </Link>
            <Link
              to="/builder"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              New Site
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your deployed Walrus Sites
          </p>
        </div>

        {sites.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <GlobeAltIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No sites deployed yet
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Get started by creating your first decentralized website.
            </p>
            <Link
              to="/builder"
              className="mt-6 inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Your First Site
            </Link>
          </div>
        ) : (
          /* Sites Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sites.map((site) => (
              <div
                key={site.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {getTemplateIcon(site.template || 'custom')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {site.ensName}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {site.template} template
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(site.status)}
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Files:</span>
                      <span className="text-gray-900 dark:text-white">{site.filesCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Deployed:</span>
                      <span className="text-gray-900 dark:text-white">{formatDate(site.deployedAt)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Object ID:</span>
                      <span className="text-gray-900 dark:text-white font-mono text-xs truncate max-w-24">
                        {site.objectId}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3">
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <button
                        className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                        title="Preview"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        className="text-gray-600 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400"
                        title="Edit"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSite(site.id)}
                        className="text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <a
                      href={`https://${site.ensName}.walrus.site`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex items-center"
                    >
                      Visit Site
                      <ArrowTopRightOnSquareIcon className="w-4 h-4 ml-1" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Statistics */}
        {sites.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Sites</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{sites.length}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Files</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {sites.reduce((sum, site) => sum + site.filesCount, 0)}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Sites</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {sites.filter(site => site.status === 'active').length}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
