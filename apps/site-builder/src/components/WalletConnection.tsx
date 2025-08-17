import { useState } from 'react'
import { WalletIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useConnect, useAccount, useDisconnect } from 'wagmi'
import { useWallet } from '../hooks/useWallet'

export default function WalletConnection() {
  const { address, isConnected } = useAccount()
  const { connectors, connect, isPending, error } = useConnect()
  const { disconnect } = useDisconnect()
  const { isReady } = useWallet()
  const [selectedConnector, setSelectedConnector] = useState<string>('')

  const handleConnect = (connector: any) => {
    setSelectedConnector(connector.id)
    connect({ connector })
  }

  if (isConnected && address) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-400" />
            <span className="ml-2 text-sm font-medium text-green-800">
              Wallet Connected
            </span>
          </div>
          <button
            onClick={() => disconnect()}
            className="text-sm text-green-700 hover:text-green-900 underline"
          >
            Disconnect
          </button>
        </div>
        <p className="mt-1 text-sm text-green-700">
          Address: {address.slice(0, 6)}...{address.slice(-4)}
        </p>
        <p className="mt-1 text-xs text-green-600">
          Ready to deploy your ENS-powered website
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <WalletIcon className="h-5 w-5 text-blue-400" />
          <span className="ml-2 text-sm font-medium text-blue-800">
            Connect Your Ethereum Wallet
          </span>
        </div>
        <p className="mt-1 text-sm text-blue-700">
          Connect your Ethereum wallet to verify ENS ownership and deploy your site.
          No private keys required - we'll use your wallet to sign transactions.
        </p>
      </div>

      <div className="space-y-3">
        {connectors.map((connector) => (
          <button
            key={connector.id}
            onClick={() => handleConnect(connector)}
            disabled={isPending}
            className={`w-full flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
              isPending && selectedConnector === connector.id
                ? 'bg-gray-100 cursor-not-allowed'
                : 'hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <WalletIcon className="h-5 w-5 text-gray-400" />
              <span className="ml-3 text-sm font-medium text-gray-900">
                {connector.name}
              </span>
              {connector.id === 'io.metamask' && (
                <span className="ml-2 text-xs text-gray-500">(Recommended)</span>
              )}
            </div>
            {isPending && selectedConnector === connector.id && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <span className="ml-2 text-sm font-medium text-red-800">
              Connection Failed
            </span>
          </div>
          <p className="mt-1 text-sm text-red-700">
            {error.message}
          </p>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              What happens next?
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc space-y-1 pl-5">
                <li>We'll verify you own the ENS name you want to use</li>
                <li>Your wallet will sign transactions to update ENS records</li>
                <li>Walrus Sites deployment happens server-side (no Sui wallet needed)</li>
                <li>Your private keys never leave your wallet</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}