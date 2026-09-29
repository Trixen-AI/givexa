import { defineChain } from 'viem'
import { BLOCK_EXPLORER_URL, ROBINHOOD_CHAIN_ID } from '../config/deployment.js'

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

