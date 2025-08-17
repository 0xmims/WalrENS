import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { mainnet, sepolia } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'WalrENS',
  projectId: 'demo', // Use demo project ID to avoid API issues
  chains: [mainnet, sepolia],
  ssr: true,
})

export const supportedChains = [mainnet, sepolia]