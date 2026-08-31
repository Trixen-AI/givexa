import { formatUnits } from 'viem'
import { BLOCK_EXPLORER_URL, TOKEN_DECIMALS } from '../config/deployment.js'

export function formatTokenAmount(value, maximumFractionDigits = 6) {
  if (value === undefined || value === null) return '0'
  const numericValue = Number(formatUnits(value, TOKEN_DECIMALS))
  if (!Number.isFinite(numericValue)) return '0'
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(numericValue)
}

export function shortAddress(address) {
  return address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ''
}

export function formatDate(timestamp) {
  if (!timestamp) return 'Available now'
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(Number(timestamp) * 1000))
}

export function transactionUrl(hash) {
  return `${BLOCK_EXPLORER_URL}/tx/${hash}`
}

