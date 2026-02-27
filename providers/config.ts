import { http, createConfig } from 'wagmi'
import { polygon, lineaSepolia, flowTestnet, opBNBTestnet, anvil, baseSepolia, arbitrumSepolia, sepolia } from 'wagmi/chains'
import monad from './monad'
import {
  injectedWallet,
  rainbowWallet,
  walletConnectWallet,
  trustWallet,
  metaMaskWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { connectorsForWallets } from '@rainbow-me/rainbowkit'

// Arbitrum Sepolia is now the primary chain
const chains = process.env.NODE_ENV === 'development'
  ? [arbitrumSepolia, sepolia, baseSepolia, polygon, anvil, lineaSepolia, flowTestnet, opBNBTestnet, monad] as const
  : [arbitrumSepolia, sepolia, baseSepolia, polygon, lineaSepolia, flowTestnet, opBNBTestnet] as const

// configure wallets
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '3a8170812b534d0ff9d794f19a901d64'

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [
        injectedWallet,
        metaMaskWallet,
        rainbowWallet,
        walletConnectWallet,
        trustWallet,
      ],
    },
  ],
  {
    appName: 'Super Guild',
    projectId,
  }
)

// configure transports
const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_ID;

const transports = Object.fromEntries(
  chains.map((chain) => [
    chain.id,
    chain.id === arbitrumSepolia.id && alchemyKey
      ? http(`https://arb-sepolia.g.alchemy.com/v2/${alchemyKey}`)
      : chain.id === baseSepolia.id && alchemyKey
        ? http(`https://base-sepolia.g.alchemy.com/v2/${alchemyKey}`)
        : chain.id === sepolia.id
          ? http('https://ethereum-sepolia-rpc.publicnode.com')
          : http()
  ])
) as Record<number, ReturnType<typeof http>>

export const config = createConfig({
  chains,
  transports,
  connectors,
})
