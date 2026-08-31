/* eslint-disable react-refresh/only-export-components */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { WagmiProvider } from 'wagmi'
import { hasProductionRpc, robinhoodChain } from './network.js'

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID?.trim()
const publicAppUrl = (import.meta.env.VITE_PUBLIC_APP_URL || 'https://givexa.xyz').replace(/\/$/u, '')

export const web3Configuration = Object.freeze({
  projectIdConfigured: Boolean(projectId),
  rpcConfigured: hasProductionRpc,
  ready: Boolean(projectId && hasProductionRpc),
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 15_000, retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
})

let wagmiAdapter

if (web3Configuration.ready) {
  wagmiAdapter = new WagmiAdapter({
    networks: [robinhoodChain],
    projectId,
    ssr: false,
  })

  createAppKit({
    adapters: [wagmiAdapter],
    networks: [robinhoodChain],
    defaultNetwork: robinhoodChain,
    projectId,
    metadata: {
      name: 'Givexa',
      description: 'Programmable asset gifts on Robinhood Chain',
      url: publicAppUrl,
      icons: [`${publicAppUrl}/brand/givexa-logo.png`],
    },
    themeMode: 'light',
    themeVariables: {
      '--apkt-font-family': 'Inter, ui-sans-serif, system-ui, sans-serif',
      '--apkt-accent': '#6d45ff',
      '--apkt-color-mix': '#6d45ff',
      '--apkt-color-mix-strength': 18,
      '--apkt-border-radius-master': '10px',
      '--apkt-z-index': 100,
    },
    features: { analytics: false },
  })
}

export function AppKitProvider({ children }) {
  if (!web3Configuration.ready) return children
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
