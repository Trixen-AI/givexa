import { solana } from '@reown/appkit/networks'
import { defineChain } from 'viem'
import { BLOCK_EXPLORER_URL, ROBINHOOD_CHAIN_ID } from '../config/deployment.js'

// Wallet network. Reown AppKit connects Solana wallets only.
export const walletNetwork = solana
export const WALLET_NAMESPACE = 'solana'
export const WALLET_NETWORK_NAME = 'Solana'

const configuredSolanaRpcUrl = import.meta.env.VITE_SOLANA_RPC_URL?.trim()

export const walletCustomRpcUrls = configuredSolanaRpcUrl
  ? { [solana.caipNetworkId]: [{ url: configuredSolanaRpcUrl }] }
  : undefined

export function isWalletNetwork(chainId) {
  return String(chainId) === String(walletNetwork.id)
}

// Read-only transport for the existing Gift Vault contracts. These are unchanged.
const configuredRpcUrl = import.meta.env.VITE_ROBINHOOD_RPC_URL?.trim()

export const robinhoodChain = defineChain({
  id: ROBINHOOD_CHAIN_ID,
  name: 'Robinhood Chain Mainnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [configuredRpcUrl || 'https://rpc.robinhoodchain.com'] },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: BLOCK_EXPLORER_URL },
  },
  testnet: false,
})

export const hasProductionRpc = Boolean(configuredRpcUrl)
