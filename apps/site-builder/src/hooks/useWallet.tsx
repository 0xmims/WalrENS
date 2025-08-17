import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface WalletState {
  suiPrivateKey?: string
  ethPrivateKey?: string
  isConnected: boolean
}

interface WalletContextType {
  wallet: WalletState
  setSuiPrivateKey: (key: string) => void
  setEthPrivateKey: (key: string) => void
  disconnect: () => void
  isReady: boolean
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

interface WalletProviderProps {
  children: ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false
  })

  const setSuiPrivateKey = useCallback((key: string) => {
    setWallet(prev => ({
      ...prev,
      suiPrivateKey: key,
      isConnected: Boolean(key && prev.ethPrivateKey)
    }))
  }, [])

  const setEthPrivateKey = useCallback((key: string) => {
    setWallet(prev => ({
      ...prev,
      ethPrivateKey: key,
      isConnected: Boolean(key && prev.suiPrivateKey)
    }))
  }, [])

  const disconnect = useCallback(() => {
    setWallet({
      isConnected: false
    })
  }, [])

  const isReady = Boolean(wallet.suiPrivateKey && wallet.ethPrivateKey)

  return (
    <WalletContext.Provider
      value={{
        wallet,
        setSuiPrivateKey,
        setEthPrivateKey,
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