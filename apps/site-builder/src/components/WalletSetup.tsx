import { useState } from 'react'
import { KeyIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useWallet } from '../hooks/useWallet'

export default function WalletSetup() {
  const { wallet, setSuiPrivateKey, setEthPrivateKey, isReady } = useWallet()
  const [showSuiKey, setShowSuiKey] = useState(false)
  const [showEthKey, setShowEthKey] = useState(false)
  const [suiKey, setSuiKey] = useState(wallet.suiPrivateKey || '')
  const [ethKey, setEthKey] = useState(wallet.ethPrivateKey || '')

  const handleSuiKeyChange = (value: string) => {
    setSuiKey(value)
    setSuiPrivateKey(value)
  }

  const handleEthKeyChange = (value: string) => {
    setEthKey(value)
    setEthPrivateKey(value)
  }

  if (isReady) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <KeyIcon className="h-5 w-5 text-green-400" />
          <span className="ml-2 text-sm font-medium text-green-800">
            Wallet configured successfully
          </span>
        </div>
        <p className="mt-1 text-sm text-green-700">
          Both Sui and Ethereum private keys are set and ready for deployment.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <KeyIcon className="h-5 w-5 text-blue-400" />
          <span className="ml-2 text-sm font-medium text-blue-800">
            Private Key Setup Required
          </span>
        </div>
        <p className="mt-1 text-sm text-blue-700">
          To deploy your site, you'll need both Sui and Ethereum private keys. 
          These are stored locally and never sent to our servers.
        </p>
      </div>

      <div className="space-y-4">
        {/* Sui Private Key */}
        <div>
          <label htmlFor="sui-key" className="block text-sm font-medium text-gray-700">
            Sui Private Key
          </label>
          <div className="mt-1 relative">
            <input
              id="sui-key"
              type={showSuiKey ? 'text' : 'password'}
              value={suiKey}
              onChange={(e) => handleSuiKeyChange(e.target.value)}
              placeholder="0x..."
              className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowSuiKey(!showSuiKey)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showSuiKey ? (
                <EyeSlashIcon className="h-4 w-4 text-gray-400" />
              ) : (
                <EyeIcon className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Required for creating Walrus Sites on Sui blockchain
          </p>
        </div>

        {/* Ethereum Private Key */}
        <div>
          <label htmlFor="eth-key" className="block text-sm font-medium text-gray-700">
            Ethereum Private Key
          </label>
          <div className="mt-1 relative">
            <input
              id="eth-key"
              type={showEthKey ? 'text' : 'password'}
              value={ethKey}
              onChange={(e) => handleEthKeyChange(e.target.value)}
              placeholder="0x..."
              className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowEthKey(!showEthKey)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showEthKey ? (
                <EyeSlashIcon className="h-4 w-4 text-gray-400" />
              ) : (
                <EyeIcon className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Required for updating ENS text records (must own the ENS name)
          </p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Security Note
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc space-y-1 pl-5">
                <li>Private keys are stored only in your browser's memory</li>
                <li>Keys are never transmitted to our servers</li>
                <li>Make sure you trust this environment before entering keys</li>
                <li>Consider using testnet keys for testing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}