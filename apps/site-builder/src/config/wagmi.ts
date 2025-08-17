import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { metaMask, injected } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    metaMask(),
    injected(),
    // WalletConnect can be added later with proper project ID
    // walletConnect({ 
    //   projectId: 'your-project-id-here',
    //   metadata: {
    //     name: 'WalrENS',
    //     description: 'ENS-powered Walrus Sites builder',
    //     url: 'https://walrens.com',
    //     icons: ['https://walrens.com/icon.png']
    //   }
    // }),
  ],
  transports: {
    [mainnet.id]: http('https://eth.llamarpc.com'),
    [sepolia.id]: http('https://eth.llamarpc.com'),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}