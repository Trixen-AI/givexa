import { CheckCircle, CircleNotch, WarningCircle } from '@phosphor-icons/react'
import { transactionUrl } from '../../web3/format.js'

export function TransactionStatus({ status, message, hash }) {
  if (!message) return null
  const Icon = status === 'success' ? CheckCircle : status === 'error' ? WarningCircle : CircleNotch
  return (
    <div className={`transaction-status transaction-status--${status}`} role={status === 'error' ? 'alert' : 'status'} aria-live="polite">
      <Icon className={status === 'pending' ? 'animate-spin' : ''} size={22} weight={status === 'success' ? 'fill' : 'bold'} />
      <div>
        <strong>{status === 'success' ? 'Transaction confirmed' : status === 'error' ? 'Action needed' : 'Waiting for confirmation'}</strong>
        <p>{message}</p>
        {hash && <a href={transactionUrl(hash)} target="_blank" rel="noreferrer">View on Blockscout</a>}
      </div>
    </div>
  )
}

