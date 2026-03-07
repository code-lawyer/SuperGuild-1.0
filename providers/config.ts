import { http, createConfig } from 'wagmi'
import { polygon, lineaSepolia, flowTestnet, opBNBTestnet, anvil, baseSepolia, base, arbitrumSepolia, arbitrum, sepolia, mainnet } from 'wagmi/chains'
import monad from './monad'
import {
  injectedWallet,
  rainbowWallet,
  walletConnectWallet,
  trustWallet,
  metaMaskWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import { IS_MAINNET, PRIMARY_CHAIN, PRIVILEGE_CHAIN, getAlchemyRpcUrl, PRIMARY_CHAIN_ID, PRIVILEGE_CHAIN_ID } from '@/constants/chain-config'

const chains = IS_MAINNET
  ? (process.env.NODE_ENV === 'development'
    ? [arbitrum, mainnet, base, polygon, anvil] as const
    : [arbitrum, mainnet, base, polygon] as const)
  : (process.env.NODE_ENV === 'development'
    ? [arbitrumSepolia, sepolia, baseSepolia, polygon, anvil, lineaSepolia, flowTestnet, opBNBTestnet, monad] as const
    : [arbitrumSepolia, sepolia, baseSepolia, polygon, lineaSepolia, flowTestnet, opBNBTestnet] as const)

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

// configure transports — Alchemy for primary + privilege chains, public for others
const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_ID;

const transports = Object.fromEntries(
  chains.map((chain) => [
    chain.id,
    chain.id === PRIMARY_CHAIN_ID && alchemyKey
      ? http(getAlchemyRpcUrl(PRIMARY_CHAIN_ID, alchemyKey))
      : chain.id === PRIVILEGE_CHAIN_ID && alchemyKey
        ? http(getAlchemyRpcUrl(PRIVILEGE_CHAIN_ID, alchemyKey))
        : http()
  ])
) as Record<number, ReturnType<typeof http>>

export const config = createConfig({
  chains,
  transports,
  connectors,
})
