import { useEffect, useMemo, useState } from 'react'
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react'
import { AnimatePresence, motion as Motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight, CalendarBlank, Check, CheckCircle, Copy, Gift, Info, LockKey,
  ShieldCheck, Wallet,
} from '@phosphor-icons/react'
import { parseEventLogs, parseUnits, stringToHex, zeroHash } from 'viem'
import { usePublicClient, useReadContract, useWriteContract } from 'wagmi'
import { CONTRACTS, DEFAULT_EXPIRY_DAYS, ROBINHOOD_CHAIN_ID, SUPPORTED_ASSETS, TOKEN_DECIMALS } from '../../config/deployment.js'
import { assetRegistryAbi, erc20Abi, feeControllerAbi, giftVaultAbi } from '../../web3/abis.js'
import { getTransactionErrorMessage } from '../../web3/errors.js'
import { formatTokenAmount } from '../../web3/format.js'
import { buildClaimUrl, generateClaimCode, generateSecret } from '../../web3/giftLink.js'
import { robinhoodChain } from '../../web3/network.js'
import { TransactionStatus } from '../../components/app/TransactionStatus.jsx'

const EXPIRY_OPTIONS = [7, 14, 30, 90]
const MAX_UINT128 = (1n << 128n) - 1n
const PENDING_GIFT_KEY = 'givexa.pending-gift'
const PENDING_GIFT_TTL = 7 * 24 * 60 * 60 * 1000

function loadPendingGift() {
  try {
    const value = JSON.parse(window.sessionStorage.getItem(PENDING_GIFT_KEY) || 'null')
    if (!value?.hash || !value?.secret || Date.now() - value.savedAt > PENDING_GIFT_TTL) {
      window.sessionStorage.removeItem(PENDING_GIFT_KEY)
      return null
    }
    return value
  } catch {
    window.sessionStorage.removeItem(PENDING_GIFT_KEY)
    return null
  }
}

function savePendingGift(value) {
  try {
    window.sessionStorage.setItem(PENDING_GIFT_KEY, JSON.stringify({ ...value, savedAt: Date.now() }))
  } catch {
    // The in-memory flow can still complete when storage is unavailable.
  }
}

function clearPendingGift() {
  window.sessionStorage.removeItem(PENDING_GIFT_KEY)
}

function giftFromReceipt(receipt, draft) {
  const [createdEvent] = parseEventLogs({ abi: giftVaultAbi, eventName: 'GiftCreated', logs: receipt.logs })
  if (!createdEvent) throw new Error('GiftCreated event was not found in the receipt.')
  const giftId = createdEvent.args.giftId
  return {
    giftId,
    claimUrl: buildClaimUrl({ giftId, secret: draft.secret, senderName: draft.senderName, message: draft.message, protectedGift: draft.protectedGift }),
    claimCode: draft.claimCode,
    hash: draft.hash,
    symbol: draft.symbol,
    amount: draft.amount,
  }
}

function parsePrincipal(value) {
  if (!/^\d+(?:\.\d{0,18})?$/u.test(value.trim())) return null
  try {
    const parsed = parseUnits(value, TOKEN_DECIMALS)
    return parsed > 0n && parsed <= MAX_UINT128 ? parsed : null
  } catch {
    return null
  }
}

function getUnlockTimestamp(mode, scheduledAt) {
  if (mode === 'instant') return 0n
  const milliseconds = new Date(scheduledAt).getTime()
  if (!Number.isFinite(milliseconds)) return null
  return BigInt(Math.floor(milliseconds / 1000))
}

function formatFeeRate(basisPoints) {
  if (basisPoints === undefined) return 'Unavailable'
  return `${Number(basisPoints) / 100}%`
}

function AssetPicker({ selectedAddress, onChange }) {
  return (
    <fieldset className="app-fieldset">
      <legend>Choose a supported Stock Token</legend>
      <p className="app-field-hint">The selected token and protocol fee are funded from your connected wallet.</p>
      <div className="asset-picker">
        {SUPPORTED_ASSETS.map((asset) => {
          const selected = asset.address === selectedAddress
          return (
            <button
              className={`asset-picker__item ${selected ? 'is-selected' : ''}`}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(asset.address)}
              key={asset.address}
            >
              <img src={`/stocks/${asset.symbol}.webp`} alt="" width="36" height="36" />
              <span><strong>{asset.symbol}</strong><small>{asset.name}</small></span>
              {selected && <CheckCircle size={19} weight="fill" aria-hidden="true" />}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export function CreateGiftFlow() {
  const reduceMotion = useReducedMotion()
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount({ namespace: 'eip155' })
  const { chainId, switchNetwork } = useAppKitNetwork()
  const publicClient = usePublicClient({ chainId: ROBINHOOD_CHAIN_ID })
  const { writeContractAsync } = useWriteContract()

  const [assetAddress, setAssetAddress] = useState(SUPPORTED_ASSETS[0].address)
  const [amount, setAmount] = useState('')
  const [senderName, setSenderName] = useState('')
  const [message, setMessage] = useState('')
  const [mode, setMode] = useState('instant')
  const [scheduledAt, setScheduledAt] = useState('')
  const [expiryDays, setExpiryDays] = useState(DEFAULT_EXPIRY_DAYS)
  const [protectedGift, setProtectedGift] = useState(false)
  const [formError, setFormError] = useState('')
  const [transaction, setTransaction] = useState({ status: 'idle', message: '', hash: '' })
  const [createdGift, setCreatedGift] = useState(null)
  const [copied, setCopied] = useState(false)

  const principal = useMemo(() => parsePrincipal(amount), [amount])
  const selectedAsset = SUPPORTED_ASSETS.find((asset) => asset.address === assetAddress)
  const onCorrectNetwork = Number(chainId) === ROBINHOOD_CHAIN_ID

  const { data: quotedFee = 0n, isLoading: feeLoading, error: feeError } = useReadContract({
    address: CONTRACTS.feeController,
    abi: feeControllerAbi,
    functionName: 'quoteFee',
    args: principal ? [principal] : undefined,
    chainId: ROBINHOOD_CHAIN_ID,
    query: { enabled: Boolean(principal) },
  })
  const { data: feeBps, error: feeRateError } = useReadContract({
    address: CONTRACTS.feeController,
    abi: feeControllerAbi,
    functionName: 'feeBps',
    chainId: ROBINHOOD_CHAIN_ID,
  })
  const { data: supported, error: registryError } = useReadContract({
    address: CONTRACTS.assetRegistry,
    abi: assetRegistryAbi,
    functionName: 'isSupported',
    args: [assetAddress],
    chainId: ROBINHOOD_CHAIN_ID,
  })
  const { data: creationPaused, error: pauseError } = useReadContract({
    address: CONTRACTS.giftVault,
    abi: giftVaultAbi,
    functionName: 'creationPaused',
    chainId: ROBINHOOD_CHAIN_ID,
  })
  const { data: balance = 0n, error: balanceError } = useReadContract({
    address: assetAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: ROBINHOOD_CHAIN_ID,
    query: { enabled: Boolean(address) },
  })
  const { data: allowance = 0n } = useReadContract({
    address: assetAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.giftVault] : undefined,
    chainId: ROBINHOOD_CHAIN_ID,
    query: { enabled: Boolean(address) },
  })

  const totalRequired = principal ? principal + quotedFee : 0n
  const hasBalance = !principal || balance >= totalRequired
  const needsApproval = Boolean(principal && allowance < totalRequired)
  const busy = transaction.status === 'pending'

  useEffect(() => {
    const pending = loadPendingGift()
    if (!pending || !publicClient) return undefined
    let cancelled = false
    setTransaction({ status: 'pending', message: 'Restoring your submitted gift and checking its confirmation.', hash: pending.hash })
    publicClient.waitForTransactionReceipt({ hash: pending.hash })
      .then((receipt) => {
        if (cancelled) return
        if (receipt.status !== 'success') {
          clearPendingGift()
          throw new Error('Gift creation reverted.')
        }
        const recoveredGift = giftFromReceipt(receipt, pending)
        setCreatedGift(recoveredGift)
        setTransaction({ status: 'success', message: `Gift #${recoveredGift.giftId} is funded and ready to share.`, hash: pending.hash })
      })
      .catch((error) => {
        if (!cancelled) setTransaction({ status: 'error', message: getTransactionErrorMessage(error), hash: pending.hash })
      })
    return () => { cancelled = true }
  }, [publicClient])

  function validateForm() {
    if (!principal) return 'Enter a valid amount with no more than 18 decimal places.'
    if (feeLoading) return 'Wait for the live creation fee to finish loading.'
    if (feeError || feeRateError || registryError || pauseError || balanceError) return 'Live contract state could not be verified. Check the Robinhood Chain RPC connection and try again.'
    if (supported === false) return 'This asset is currently disabled in the Givexa registry.'
    if (creationPaused) return 'New gifts are temporarily paused. Existing gifts remain safe.'
    if (senderName.length > 60) return 'Sender name must be 60 characters or fewer.'
    if (message.length > 240) return 'Gift message must be 240 characters or fewer.'
    const unlockAt = getUnlockTimestamp(mode, scheduledAt)
    if (mode === 'scheduled') {
      if (unlockAt === null) return 'Choose a valid unlock date and time.'
      const now = BigInt(Math.floor(Date.now() / 1000))
      if (unlockAt < now + 600n) return 'Scheduled gifts must unlock at least 10 minutes from now.'
      if (unlockAt > now + 365n * 86400n) return 'Scheduled gifts cannot unlock more than 365 days from now.'
    }
    if (!hasBalance) return `Your wallet needs ${formatTokenAmount(totalRequired)} ${selectedAsset.symbol}, including the creation fee.`
    return ''
  }

  async function ensureAllowance(total) {
    const latestAllowance = await publicClient.readContract({
      address: assetAddress,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [address, CONTRACTS.giftVault],
    })
    if (latestAllowance >= total) return
    setTransaction({ status: 'pending', message: `Approve ${formatTokenAmount(total)} ${selectedAsset.symbol} for this gift.`, hash: '' })
    const { request } = await publicClient.simulateContract({
      account: address,
      address: assetAddress,
      abi: erc20Abi,
      functionName: 'approve',
      args: [CONTRACTS.giftVault, total],
    })
    const approvalHash = await writeContractAsync(request)
    setTransaction({ status: 'pending', message: 'Token approval submitted. Waiting for Robinhood Chain confirmation.', hash: approvalHash })
    const receipt = await publicClient.waitForTransactionReceipt({ hash: approvalHash })
    if (receipt.status !== 'success') throw new Error('Token approval reverted.')
  }

  async function handleCreate(event) {
    event.preventDefault()
    setFormError('')
    if (!isConnected) {
      open({ view: 'Connect', namespace: 'eip155' })
      return
    }
    if (!onCorrectNetwork) {
      await switchNetwork(robinhoodChain)
      return
    }
    const validationError = validateForm()
    if (validationError) {
      setFormError(validationError)
      return
    }

    try {
      if (!publicClient) throw new Error('Robinhood Chain RPC is unavailable.')
      const secret = generateSecret()
      const claimCode = protectedGift ? generateClaimCode() : ''
      const unlockAt = getUnlockTimestamp(mode, scheduledAt)
      const expiryDuration = expiryDays * 86400
      const secretHash = await publicClient.readContract({
        address: CONTRACTS.giftVault,
        abi: giftVaultAbi,
        functionName: 'hashSecret',
        args: [secret],
      })
      const claimCodeHash = protectedGift
        ? await publicClient.readContract({
            address: CONTRACTS.giftVault,
            abi: giftVaultAbi,
            functionName: 'hashClaimCode',
            args: [secret, stringToHex(claimCode)],
          })
        : zeroHash

      const latestFee = await publicClient.readContract({
        address: CONTRACTS.feeController,
        abi: feeControllerAbi,
        functionName: 'quoteFee',
        args: [principal],
      })
      const latestTotal = principal + latestFee
      const latestBalance = await publicClient.readContract({
        address: assetAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
      })
      if (latestBalance < latestTotal) throw new Error('Insufficient token balance.')
      await ensureAllowance(latestTotal)

      const finalFee = await publicClient.readContract({
        address: CONTRACTS.feeController,
        abi: feeControllerAbi,
        functionName: 'quoteFee',
        args: [principal],
      })
      await ensureAllowance(principal + finalFee)
      setTransaction({ status: 'pending', message: 'Confirm the Gift Vault transaction in your wallet.', hash: '' })

      const params = {
        asset: assetAddress,
        principal,
        secretHash,
        claimCodeHash,
        unlockAt,
        expiryDuration,
      }
      const { request } = await publicClient.simulateContract({
        account: address,
        address: CONTRACTS.giftVault,
        abi: giftVaultAbi,
        functionName: 'createGift',
        args: [params],
      })
      const hash = await writeContractAsync(request)
      const pendingGift = { hash, secret, claimCode, senderName, message, protectedGift, symbol: selectedAsset.symbol, amount }
      savePendingGift(pendingGift)
      setTransaction({ status: 'pending', message: 'Gift submitted. Waiting for final confirmation.', hash })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      if (receipt.status !== 'success') { clearPendingGift(); throw new Error('Gift creation reverted.') }
      const confirmedGift = giftFromReceipt(receipt, pendingGift)
      setCreatedGift(confirmedGift)
      setTransaction({ status: 'success', message: `Gift #${confirmedGift.giftId} is funded and ready to share.`, hash })
    } catch (error) {
      setTransaction({ status: 'error', message: getTransactionErrorMessage(error), hash: '' })
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(createdGift.claimUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2500)
  }

  if (createdGift) {
    return (
      <Motion.section className="gift-success" initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <span className="gift-success__icon"><Gift size={38} weight="duotone" /></span>
        <p className="app-eyebrow">Gift #{createdGift.giftId} funded</p>
        <h1>Your piece of the market is ready to send.</h1>
        <p>{createdGift.amount} {createdGift.symbol} is secured in the Givexa Gift Vault. The private link contains the claim secret, so share it only with the intended recipient.</p>
        <div className="claim-link-box"><span>{createdGift.claimUrl}</span><button type="button" onClick={copyLink}>{copied ? <Check /> : <Copy />} {copied ? 'Copied' : 'Copy link'}</button></div>
        {createdGift.claimCode && <div className="claim-code-once"><LockKey size={24} /><div><small>Share separately. Shown once.</small><strong>{createdGift.claimCode}</strong></div></div>}
        <TransactionStatus status="success" message="The funding transaction is confirmed on Robinhood Chain." hash={createdGift.hash} />
        <div className="gift-success__actions"><a className="app-primary-button" href={createdGift.claimUrl}>Preview gift</a><button className="app-secondary-button" type="button" onClick={() => { clearPendingGift(); window.location.reload() }}>Create another</button></div>
      </Motion.section>
    )
  }

  return (
    <form className="create-gift-layout" onSubmit={handleCreate} noValidate>
      <div className="create-gift-main">
        <div className="app-section-heading"><p className="app-eyebrow">Create a Gift Vault</p><h1>Give someone a piece of the market.</h1><p>Choose the asset and moment. Givexa handles the onchain funding and creates a private claim link.</p></div>
        <div className="app-card"><AssetPicker selectedAddress={assetAddress} onChange={setAssetAddress} /></div>
        <div className="app-card form-grid">
          <div className="app-field app-field--wide"><label htmlFor="gift-amount">Gift amount</label><div className="amount-input"><input id="gift-amount" value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" autoComplete="off" placeholder="0.00" aria-describedby="amount-help" /><span>{selectedAsset.symbol}</span></div><small id="amount-help">Wallet balance: {isConnected ? `${formatTokenAmount(balance)} ${selectedAsset.symbol}` : 'Connect to view'}</small></div>
          <div className="app-field"><label htmlFor="sender-name">Your name <span>Optional</span></label><input id="sender-name" value={senderName} maxLength="60" onChange={(event) => setSenderName(event.target.value)} placeholder="Shown to the recipient" /></div>
          <div className="app-field app-field--wide"><label htmlFor="gift-message">Gift message <span>Optional</span></label><textarea id="gift-message" value={message} maxLength="240" onChange={(event) => setMessage(event.target.value)} placeholder="Add a personal note" rows="3" /><small>{message.length}/240. Stored only inside the private link.</small></div>
        </div>
        <div className="app-card">
          <fieldset className="app-fieldset"><legend>When can it be claimed?</legend><div className="segmented-control" role="radiogroup" aria-label="Gift schedule"><button type="button" role="radio" aria-checked={mode === 'instant'} className={mode === 'instant' ? 'is-selected' : ''} onClick={() => setMode('instant')}><Gift size={19} />Instant</button><button type="button" role="radio" aria-checked={mode === 'scheduled'} className={mode === 'scheduled' ? 'is-selected' : ''} onClick={() => setMode('scheduled')}><CalendarBlank size={19} />Scheduled</button></div></fieldset>
          <AnimatePresence initial={false}>{mode === 'scheduled' && <Motion.div className="app-field schedule-field" initial={reduceMotion ? false : { opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}><label htmlFor="unlock-at">Unlock date and time</label><input id="unlock-at" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} /><small>At least 10 minutes and no more than 365 days from now.</small></Motion.div>}</AnimatePresence>
          <fieldset className="app-fieldset expiry-fieldset"><legend>Claim window</legend><div className="expiry-options">{EXPIRY_OPTIONS.map((days) => <button type="button" aria-pressed={expiryDays === days} className={expiryDays === days ? 'is-selected' : ''} onClick={() => setExpiryDays(days)} key={days}>{days} days</button>)}</div></fieldset>
          <label className="protected-toggle"><input type="checkbox" checked={protectedGift} onChange={(event) => setProtectedGift(event.target.checked)} /><span className="protected-toggle__control" /><LockKey size={21} /><span><strong>Protected Gift</strong><small>Add an 8-character Claim Code shared separately from the link.</small></span></label>
        </div>
      </div>

      <aside className="gift-summary" aria-label="Gift funding summary">
        <div className="gift-summary__asset"><img src={`/stocks/${selectedAsset.symbol}.webp`} alt="" width="44" height="44" /><div><small>Selected asset</small><strong>{selectedAsset.symbol}</strong><span>{selectedAsset.name}</span></div><ShieldCheck className="ml-auto text-givexa-500" size={23} weight="duotone" /></div>
        <div className="gift-summary__rows"><div><span>Gift principal</span><strong>{principal ? `${formatTokenAmount(principal)} ${selectedAsset.symbol}` : 'Not set'}</strong></div><div><span>Creation fee</span><strong>{feeError || feeRateError ? 'Unavailable' : feeLoading ? 'Loading…' : principal ? `${formatTokenAmount(quotedFee)} ${selectedAsset.symbol}` : formatFeeRate(feeBps)}</strong></div><div className="is-total"><span>Wallet total</span><strong>{principal ? `${formatTokenAmount(totalRequired)} ${selectedAsset.symbol}` : 'Not set'}</strong></div></div>
        <div className="gift-summary__note"><Info size={18} /><p>The recipient receives the full gift principal. Givexa adds no claim fee.</p></div>
        {needsApproval && isConnected && <p className="approval-note"><Wallet size={17} /> One token approval is required before funding.</p>}
        {formError && <p className="form-error" role="alert">{formError}</p>}
        <TransactionStatus status={transaction.status} message={transaction.message} hash={transaction.hash} />
        <button className="app-primary-button app-primary-button--full" type="submit" disabled={busy || creationPaused || supported === false}>
          {!isConnected ? 'Connect wallet' : !onCorrectNetwork ? 'Switch to Robinhood Chain' : busy ? 'Transaction in progress' : needsApproval ? 'Approve and create gift' : 'Create Asset Gift'}
          {!busy && <ArrowRight size={19} weight="bold" />}
        </button>
        <div className="gift-summary__trust"><Check size={15} /> Exact-match verified contracts <Check size={15} /> Sender-controlled recovery</div>
      </aside>
    </form>
  )
}
