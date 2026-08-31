import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react'
import {
  ArrowLeft,
  ArrowSquareOut,
  CalendarBlank,
  CheckCircle,
  Clock,
  Gift,
  ShieldCheck,
  UserCircle,
  WarningCircle,
  X,
} from '@phosphor-icons/react'
import { usePublicClient, useReadContract, useWriteContract } from 'wagmi'
import { TransactionStatus } from '../../components/app/TransactionStatus.jsx'
import {
  ASSET_BY_ADDRESS,
  BLOCK_EXPLORER_URL,
  CONTRACTS,
  ROBINHOOD_CHAIN_ID,
} from '../../config/deployment.js'
import { giftVaultAbi } from '../../web3/abis.js'
import { getTransactionErrorMessage } from '../../web3/errors.js'
import { formatDate, formatTokenAmount, shortAddress } from '../../web3/format.js'
import { robinhoodChain } from '../../web3/network.js'

const DISPLAY_STATUS = ['Nonexistent', 'Scheduled', 'Active', 'Expired', 'Claimed', 'Cancelled', 'Returned']

const STATUS_CONTENT = {
  Scheduled: ['Scheduled', 'This funded gift is waiting for its unlock time.', 'scheduled'],
  Active: ['Ready to claim', 'The private claim link can be used until this gift expires.', 'active'],
  Expired: ['Expired', 'The claim window has closed. Recovery always returns the principal to the sender.', 'expired'],
  Claimed: ['Claimed', 'The principal has been transferred to the wallet that submitted the valid bearer secret.', 'claimed'],
  Cancelled: ['Cancelled', 'The sender ended this gift and received the principal back.', 'cancelled'],
  Returned: ['Returned', 'The expired gift principal has been returned to the original sender.', 'returned'],
}

function normalizeGift(value) {
  if (!value) return null
  return {
    sender: value.sender ?? value[0],
    asset: value.asset ?? value[1],
    principal: value.principal ?? value[2],
    createdAt: value.createdAt ?? value[3],
    unlockAt: value.unlockAt ?? value[4],
    expiresAt: value.expiresAt ?? value[5],
    storedStatus: value.status ?? value[6],
    claimCodeHash: value.claimCodeHash ?? value[8],
  }
}

function addressUrl(address) {
  return `${BLOCK_EXPLORER_URL}/address/${address}`
}

function ConfirmationDialog({ action, assetSymbol, amount, onCancel, onConfirm, busy }) {
  const cancelRef = useRef(null)
  const confirmRef = useRef(null)
  const isCancel = action === 'cancel'

  useEffect(() => {
    cancelRef.current?.focus()
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !busy) onCancel()
      if (event.key !== 'Tab') return
      const targets = [cancelRef.current, confirmRef.current].filter(Boolean)
      const currentIndex = targets.indexOf(document.activeElement)
      const nextIndex = event.shiftKey
        ? (currentIndex <= 0 ? targets.length - 1 : currentIndex - 1)
        : (currentIndex + 1) % targets.length
      event.preventDefault()
      targets[nextIndex]?.focus()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [busy, onCancel])

  return (
    <div className="gift-dialog-backdrop" role="presentation">
      <section
        className="gift-dialog app-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="gift-dialog-title"
        aria-describedby="gift-dialog-copy"
      >
        <button className="gift-dialog__close" type="button" onClick={onCancel} disabled={busy} aria-label="Close confirmation">
          <X size={19} />
        </button>
        <span className={`gift-dialog__icon ${isCancel ? 'is-danger' : ''}`}>
          {isCancel ? <WarningCircle size={30} weight="duotone" /> : <ShieldCheck size={30} weight="duotone" />}
        </span>
        <p className="app-eyebrow">Onchain confirmation</p>
        <h2 id="gift-dialog-title">{isCancel ? 'Cancel this funded gift?' : 'Return this expired gift?'}</h2>
        <p id="gift-dialog-copy">
          {isCancel
            ? `${amount} ${assetSymbol} will return to the sender. The private claim link will stop working permanently.`
            : `${amount} ${assetSymbol} will return to the original sender. The connected wallet only pays gas to trigger recovery.`}
        </p>
        <div className="gift-dialog__actions">
          <button ref={cancelRef} className="app-secondary-button" type="button" onClick={onCancel} disabled={busy}>Keep gift</button>
          <button
            ref={confirmRef}
            className={isCancel ? 'app-danger-button' : 'app-primary-button'}
            type="button"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Waiting for wallet' : isCancel ? 'Confirm cancellation' : 'Confirm recovery'}
          </button>
        </div>
      </section>
    </div>
  )
}

export function GiftDetailFlow({ routeGiftId }) {
  const giftId = useMemo(() => (/^\d+$/u.test(routeGiftId || '') ? BigInt(routeGiftId) : null), [routeGiftId])
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount({ namespace: 'eip155' })
  const { chainId, switchNetwork } = useAppKitNetwork()
  const publicClient = usePublicClient({ chainId: ROBINHOOD_CHAIN_ID })
  const { writeContractAsync } = useWriteContract()
  const [dialogAction, setDialogAction] = useState('')
  const [transaction, setTransaction] = useState({ status: 'idle', message: '', hash: '' })

  const {
    data: giftResult,
    isLoading: giftLoading,
    error: giftError,
    refetch: refetchGift,
  } = useReadContract({
    address: CONTRACTS.giftVault,
    abi: giftVaultAbi,
    functionName: 'gift',
    args: giftId ? [giftId] : undefined,
    chainId: ROBINHOOD_CHAIN_ID,
    query: { enabled: Boolean(giftId), retry: false },
  })
  const {
    data: statusResult,
    isLoading: statusLoading,
    error: statusError,
    refetch: refetchStatus,
  } = useReadContract({
    address: CONTRACTS.giftVault,
    abi: giftVaultAbi,
    functionName: 'displayStatus',
    args: giftId ? [giftId] : undefined,
    chainId: ROBINHOOD_CHAIN_ID,
    query: { enabled: Boolean(giftId), retry: false },
  })

  if (!giftId) {
    return (
      <section className="gift-detail-state app-card">
        <WarningCircle size={38} weight="duotone" />
        <p className="app-eyebrow">Invalid gift ID</p>
        <h1>Open a valid Gift Vault.</h1>
        <p>The gift address must include a numeric onchain ID.</p>
        <a className="app-secondary-button" href="/dashboard">Return to dashboard</a>
      </section>
    )
  }

  if (giftLoading || statusLoading) {
    return <div className="claim-loading app-card" role="status"><span className="app-spinner" /><strong>Reading Gift Vault #{routeGiftId}</strong><p>Checking the verified contract on Robinhood Chain.</p></div>
  }

  if (giftError || statusError || !giftResult) {
    return (
      <section className="gift-detail-state app-card">
        <WarningCircle size={38} weight="duotone" />
        <p className="app-eyebrow">Gift unavailable</p>
        <h1>This Gift Vault could not be verified.</h1>
        <p>Check the gift ID and RPC connection, then try again.</p>
        <a className="app-secondary-button" href="/dashboard">Return to dashboard</a>
      </section>
    )
  }

  const giftRecord = normalizeGift(giftResult)
  const status = DISPLAY_STATUS[Number(statusResult ?? 0)] || 'Nonexistent'
  const [statusLabel, statusCopy, statusTone] = STATUS_CONTENT[status] || ['Unavailable', 'The current gift state is unavailable.', 'expired']
  const asset = ASSET_BY_ADDRESS.get(giftRecord.asset.toLowerCase())
  const amount = formatTokenAmount(giftRecord.principal)
  const onCorrectNetwork = Number(chainId) === ROBINHOOD_CHAIN_ID
  const isSender = Boolean(address && address.toLowerCase() === giftRecord.sender.toLowerCase())
  const canCancel = isSender && ['Scheduled', 'Active', 'Expired'].includes(status)
  const canRecover = status === 'Expired'
  const busy = transaction.status === 'pending'

  async function requestAction(action) {
    setTransaction({ status: 'idle', message: '', hash: '' })
    if (!isConnected) {
      await open({ view: 'Connect', namespace: 'eip155' })
      return
    }
    if (!onCorrectNetwork) {
      await switchNetwork(robinhoodChain)
      return
    }
    setDialogAction(action)
  }

  async function confirmAction() {
    const action = dialogAction
    if (!action || !publicClient || !address) return
    const functionName = action === 'cancel' ? 'cancel' : 'recoverExpired'
    try {
      setTransaction({ status: 'pending', message: 'Simulating the contract action before wallet confirmation.', hash: '' })
      const { request } = await publicClient.simulateContract({
        account: address,
        address: CONTRACTS.giftVault,
        abi: giftVaultAbi,
        functionName,
        args: [giftId],
      })
      const hash = await writeContractAsync(request)
      setDialogAction('')
      setTransaction({ status: 'pending', message: 'Transaction submitted. Waiting for Robinhood Chain confirmation.', hash })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      if (receipt.status !== 'success') throw new Error('Gift lifecycle transaction reverted.')
      await Promise.all([refetchGift(), refetchStatus()])
      setTransaction({
        status: 'success',
        message: action === 'cancel'
          ? `${amount} ${asset?.symbol || 'tokens'} returned to the sender.`
          : `${amount} ${asset?.symbol || 'tokens'} returned to the original sender.`,
        hash,
      })
    } catch (error) {
      setDialogAction('')
      setTransaction({ status: 'error', message: getTransactionErrorMessage(error), hash: '' })
    }
  }

  return (
    <div className="gift-detail-page">
      <a className="gift-detail-back" href="/dashboard"><ArrowLeft size={17} /> Dashboard</a>
      <section className="gift-detail-hero app-card">
        <div className="gift-detail-hero__asset">
          {asset ? <img src={`/stocks/${asset.symbol}.webp`} alt={`${asset.name} logo`} width="72" height="72" /> : <Gift size={46} weight="duotone" />}
          <div><p className="app-eyebrow">Gift Vault #{giftId}</p><h1>{amount} <span>{asset?.symbol || 'Token'}</span></h1><p>{asset?.name || 'Supported Stock Token'}</p></div>
        </div>
        <div className={`gift-status-badge gift-status-badge--${statusTone}`}><span />{statusLabel}</div>
      </section>

      <div className="gift-detail-grid">
        <section className="gift-detail-card app-card">
          <div className="gift-detail-card__heading"><div><p className="app-eyebrow">Lifecycle</p><h2>Onchain gift details</h2></div><a href={`${BLOCK_EXPLORER_URL}/address/${CONTRACTS.giftVault}`} target="_blank" rel="noreferrer">Verified contract <ArrowSquareOut size={15} /></a></div>
          <p className="gift-detail-status-copy">{statusCopy}</p>
          <dl className="gift-detail-list">
            <div><dt><UserCircle size={18} /> Sender</dt><dd><a href={addressUrl(giftRecord.sender)} target="_blank" rel="noreferrer">{shortAddress(giftRecord.sender)} <ArrowSquareOut size={13} /></a></dd></div>
            <div><dt><CalendarBlank size={18} /> Created</dt><dd>{formatDate(giftRecord.createdAt)}</dd></div>
            <div><dt><Clock size={18} /> Unlocks</dt><dd>{formatDate(giftRecord.unlockAt)}</dd></div>
            <div><dt><Clock size={18} /> Expires</dt><dd>{formatDate(giftRecord.expiresAt)}</dd></div>
            <div><dt><ShieldCheck size={18} /> Claim protection</dt><dd>{giftRecord.claimCodeHash && !/^0x0{64}$/u.test(giftRecord.claimCodeHash) ? 'Private link and Claim Code' : 'Private bearer link'}</dd></div>
          </dl>
        </section>

        <aside className="gift-detail-actions app-card">
          <p className="app-eyebrow">Available actions</p>
          <h2>Manage this gift</h2>
          {!isConnected && <p>Connect a wallet to see actions available for this onchain state.</p>}
          {isConnected && !isSender && !canRecover && <p>Only the original sender can cancel an active gift. Claiming requires the private bearer link.</p>}
          {isSender && !canCancel && !canRecover && <p>This gift has reached a final state. No further lifecycle action is available.</p>}
          {canCancel && <button className="app-danger-button app-action-button" type="button" onClick={() => requestAction('cancel')} disabled={busy}>Cancel gift</button>}
          {canRecover && <button className="app-primary-button app-action-button" type="button" onClick={() => requestAction('recover')} disabled={busy}>Return expired gift</button>}
          {!isConnected && <button className="app-primary-button app-action-button" type="button" onClick={() => requestAction(canRecover ? 'recover' : 'cancel')}>Connect wallet</button>}
          <div className="gift-detail-actions__note"><ShieldCheck size={18} /><p>Recovery can be triggered by any wallet, but the contract always transfers the principal to the original sender.</p></div>
          <TransactionStatus {...transaction} />
        </aside>
      </div>

      {transaction.status === 'success' && <div className="gift-detail-success" role="status"><CheckCircle size={19} weight="fill" /> The latest contract state has been refreshed.</div>}
      {dialogAction && <ConfirmationDialog action={dialogAction} assetSymbol={asset?.symbol || 'tokens'} amount={amount} onCancel={() => !busy && setDialogAction('')} onConfirm={confirmAction} busy={busy} />}
    </div>
  )
}
