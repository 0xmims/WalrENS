import { createContext, useContext, ReactNode } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'

interface WalletContextType {
  address?: string
  isConnected: boolean
  isConnecting: boolean
  connector?: any
  connect: (connector: any) => void
  disconnect: () => void
  isReady: boolean
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

interface WalletProviderProps {
  children: ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  const { address, isConnected, connector } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  const handleConnect = (selectedConnector: any) => {
    connect({ connector: selectedConnector })
  }

  const isReady = Boolean(address && isConnected)

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected,
        isConnecting: isPending,
        connector,
        connect: handleConnect,
        disconnect,
        isReady
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}