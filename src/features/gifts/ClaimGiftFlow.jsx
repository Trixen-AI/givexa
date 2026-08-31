import { useMemo, useState } from 'react'
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react'
import { motion as Motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight, CalendarBlank, Check, CheckCircle, Clock, Copy, Gift, Info,
  LinkSimple, LockKey, ShieldCheck, Wallet, WarningCircle,
} from '@phosphor-icons/react'
import { stringToHex, zeroHash } from 'viem'
import { usePublicClient, useReadContract, useWriteContract } from 'wagmi'
import { TransactionStatus } from '../../components/app/TransactionStatus.jsx'
import { ASSET_BY_ADDRESS, CONTRACTS, ROBINHOOD_CHAIN_ID } from '../../config/deployment.js'
import { giftVaultAbi } from '../../web3/abis.js'
import { getTransactionErrorMessage } from '../../web3/errors.js'
import { formatDate, formatTokenAmount } from '../../web3/format.js'
import { readClaimPayload } from '../../web3/giftLink.js'
import { robinhoodChain } from '../../web3/network.js'

const DISPLAY_STATUS = ['Nonexistent', 'Scheduled', 'Active', 'Expired', 'Claimed', 'Cancelled', 'Returned']
const FINAL_STATUS_COPY = {
  Nonexistent: ['Gift not found', 'No funded Gift Vault matches this link. Ask the sender to check the original private link.'],
  Expired: ['This gift has expired', 'It can no longer be claimed. Its principal remains recoverable only to the original sender.'],
  Claimed: ['This gift was claimed', 'The Gift Vault has already transferred its principal to the claiming wallet.'],
  Cancelled: ['This gift was cancelled', 'The original sender cancelled this unclaimed gift and received the principal back.'],
  Returned: ['This gift was returned', 'The expired gift principal has been returned to the original sender.'],
}

function normalizeGift(value) {
  if (!value) return null
  return {
    sender: value.sender ?? value[0], asset: value.asset ?? value[1], principal: value.principal ?? value[2],
    createdAt: value.createdAt ?? value[3], unlockAt: value.unlockAt ?? value[4], expiresAt: value.expiresAt ?? value[5],
    storedStatus: value.status ?? value[6], secretHash: value.secretHash ?? value[7], claimCodeHash: value.claimCodeHash ?? value[8],
  }
}

function GiftLinkEntry() {
  const [link, setLink] = useState('')
  const [error, setError] = useState('')

  function openGift(event) {
    event.preventDefault()
    setError('')
    try {
      const url = new URL(link.trim())
      const match = url.pathname.match(/^\/claim\/(\d+)\/?$/u)
      const payload = readClaimPayload(url.hash)
      if (!match || !payload || payload.giftId !== BigInt(match[1])) {
        setError('Paste the complete private Givexa claim link shared by the sender.')
        return
      }
      window.location.assign(`${window.location.origin}/claim/${payload.giftId}${url.hash}`)
    } catch {
      setError('Paste a valid Givexa claim link, including its private #gvx fragment.')
    }
  }

  return (
    <section className="claim-entry app-card">
      <span className="claim-entry__icon"><LinkSimple size={34} weight="duotone" /></span>
      <p className="app-eyebrow">Open an existing gift</p>
      <h1>Reveal your Givexa gift.</h1>
      <p>Paste the complete private link you received. Givexa reads the bearer secret only in this browser and never sends it in the page request.</p>
      <form onSubmit={openGift} noValidate>
        <label htmlFor="claim-link">Private gift link</label>
        <div className="claim-entry__input">
          <input id="claim-link" type="url" value={link} onChange={(event) => setLink(event.target.value)} placeholder="https://givexa.xyz/claim/…#gvx=…" autoComplete="off" spellCheck="false" aria-invalid={Boolean(error)} aria-describedby={error ? 'claim-link-error' : undefined} />
          <button className="app-primary-button" type="submit">Open gift <ArrowRight size={18} weight="bold" /></button>
        </div>
        {error && <p className="form-error" id="claim-link-error" role="alert">{error}</p>}
      </form>
      <div className="claim-entry__notice"><ShieldCheck size={20} weight="duotone" /><span>Keep the link private. Anyone holding a valid unclaimed link can claim the gift.</span></div>
    </section>
  )
}

function GiftState({ status, title: suppliedTitle, copy: suppliedCopy }) {
  const [defaultTitle, defaultCopy] = FINAL_STATUS_COPY[status] || FINAL_STATUS_COPY.Nonexistent
  const title = suppliedTitle || defaultTitle
  const copy = suppliedCopy || defaultCopy
  return (
    <section className="claim-state app-card">
      <span className="claim-state__icon"><WarningCircle size={38} weight="duotone" /></span>
      <p className="app-eyebrow">Gift status: {status}</p><h1>{title}</h1><p>{copy}</p>
      <a className="app-secondary-button" href="/">Return to Givexa</a>
    </section>
  )
}

export function ClaimGiftFlow({ routeGiftId }) {
  const payload = useMemo(() => readClaimPayload(), [])
  const validRoute = /^\d+$/u.test(routeGiftId || '') && payload?.giftId === BigInt(routeGiftId)
  const giftId = validRoute ? payload.giftId : null
  const reduceMotion = useReducedMotion()
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount({ namespace: 'eip155' })
  const { chainId, switchNetwork } = useAppKitNetwork()
  const publicClient = usePublicClient({ chainId: ROBINHOOD_CHAIN_ID })
  const { writeContractAsync } = useWriteContract()
  const [claimCode, setClaimCode] = useState('')
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [jurisdictionConfirmed, setJurisdictionConfirmed] = useState(false)
  const [formError, setFormError] = useState('')
  const [copied, setCopied] = useState(false)
  const [transaction, setTransaction] = useState({ status: 'idle', message: '', hash: '' })
  const [claimed, setClaimed] = useState(false)

  const { data: giftResult, isLoading: giftLoading, error: giftError, refetch: refetchGift } = useReadContract({
    address: CONTRACTS.giftVault, abi: giftVaultAbi, functionName: 'gift', args: giftId ? [giftId] : undefined,
    chainId: ROBINHOOD_CHAIN_ID, query: { enabled: Boolean(giftId), retry: false },
  })
  const { data: statusResult, isLoading: statusLoading, error: statusError, refetch: refetchStatus } = useReadContract({
    address: CONTRACTS.giftVault, abi: giftVaultAbi, functionName: 'displayStatus', args: giftId ? [giftId] : undefined,
    chainId: ROBINHOOD_CHAIN_ID, query: { enabled: Boolean(giftId) },
  })

  if (!validRoute) return <GiftLinkEntry />
  if (giftLoading || statusLoading) return <div className="claim-loading app-card" role="status"><span className="app-spinner" /><strong>Reading Gift Vault #{routeGiftId}</strong><p>Checking the verified contract on Robinhood Chain.</p></div>
  if (statusError) return <GiftState status="Unavailable" title="Robinhood Chain is unavailable" copy="Givexa could not verify the current Gift Vault status. Check the RPC connection and try again before using the private link." />

  const gift = normalizeGift(giftResult)
  const status = DISPLAY_STATUS[Number(statusResult ?? 0)] || 'Nonexistent'
  const selectedAsset = gift?.asset ? ASSET_BY_ADDRESS.get(gift.asset.toLowerCase()) : null
  const protectedGift = gift?.claimCodeHash && gift.claimCodeHash !== zeroHash
  const onCorrectNetwork = Number(chainId) === ROBINHOOD_CHAIN_ID
  const busy = transaction.status === 'pending'
  const claimable = status === 'Active'

  if (giftError || !gift || !selectedAsset || FINAL_STATUS_COPY[status]) return <GiftState status={giftError ? 'Nonexistent' : status} />

  async function copyGiftId() {
    await navigator.clipboard.writeText(String(giftId)); setCopied(true); window.setTimeout(() => setCopied(false), 2000)
  }

  function validateClaim() {
    if (!claimable) return 'This gift is not currently claimable.'
    if (protectedGift && !/^[A-Z2-9]{8}$/u.test(claimCode.trim().toUpperCase())) return 'Enter the 8-character Claim Code shared separately by the sender.'
    if (!ageConfirmed) return 'Confirm that you are at least 18 years old.'
    if (!jurisdictionConfirmed) return 'Confirm that you are eligible to receive this Stock Token in your jurisdiction.'
    return ''
  }

  async function handleClaim(event) {
    event.preventDefault(); setFormError('')
    if (!isConnected) { open({ view: 'Connect', namespace: 'eip155' }); return }
    if (!onCorrectNetwork) { await switchNetwork(robinhoodChain); return }
    const validationError = validateClaim()
    if (validationError) { setFormError(validationError); return }
    if (!publicClient) { setFormError('Robinhood Chain is unavailable. Check your RPC connection and try again.'); return }

    try {
      setTransaction({ status: 'pending', message: 'Confirm the claim transaction in your wallet.', hash: '' })
      const codeBytes = protectedGift ? stringToHex(claimCode.trim().toUpperCase()) : '0x'
      const { request } = await publicClient.simulateContract({ account: address, address: CONTRACTS.giftVault, abi: giftVaultAbi, functionName: 'claim', args: [giftId, payload.secret, codeBytes] })
      const hash = await writeContractAsync(request)
      setTransaction({ status: 'pending', message: 'Claim submitted. Waiting for Robinhood Chain confirmation.', hash })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      if (receipt.status !== 'success') throw new Error('Gift claim reverted.')
      await Promise.all([refetchGift(), refetchStatus()])
      setClaimed(true)
      setTransaction({ status: 'success', message: `${formatTokenAmount(gift.principal)} ${selectedAsset.symbol} was transferred to ${address}.`, hash })
    } catch (error) {
      setTransaction({ status: 'error', message: getTransactionErrorMessage(error), hash: '' })
    }
  }

  if (claimed) {
    return (
      <Motion.section className="gift-success" initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <span className="gift-success__icon"><CheckCircle size={42} weight="duotone" /></span><p className="app-eyebrow">Gift #{giftId} claimed</p>
        <h1>The gift is now in your wallet.</h1><p>{formatTokenAmount(gift.principal)} {selectedAsset.symbol} was transferred directly from the Givexa Gift Vault to your connected address.</p>
        <TransactionStatus {...transaction} /><div className="gift-success__actions"><a className="app-primary-button" href="/">Explore Givexa</a><a className="app-secondary-button" href="/app">Create a gift</a></div>
      </Motion.section>
    )
  }

  return (
    <form className="claim-gift-layout" onSubmit={handleClaim} noValidate>
      <section className="claim-reveal">
        <div className="claim-reveal__halo" aria-hidden="true" />
        <Motion.div className="claim-reveal__asset" initial={reduceMotion ? false : { opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}><img src={`/stocks/${selectedAsset.symbol}.webp`} alt={`${selectedAsset.name} logo`} width="92" height="92" /></Motion.div>
        <p className="app-eyebrow">{payload.senderName ? `A gift from ${payload.senderName}` : 'A Givexa gift for you'}</p><h1>{formatTokenAmount(gift.principal)} <span>{selectedAsset.symbol}</span></h1>
        <p className="claim-reveal__asset-name">{selectedAsset.name} Stock Token</p>{payload.message && <blockquote>“{payload.message}”</blockquote>}
        <div className="claim-reveal__badges"><span><ShieldCheck size={17} /> Funded onchain</span>{protectedGift && <span><LockKey size={17} /> Claim Code protected</span>}</div>
        <div className="claim-reveal__id"><span>Gift Vault #{giftId}</span><button type="button" onClick={copyGiftId} aria-label="Copy gift ID">{copied ? <Check /> : <Copy />}</button></div>
      </section>

      <aside className="claim-panel app-card">
        <div><p className="app-eyebrow">Claim to your wallet</p><h2>Receive your gift</h2><p>The connected wallet becomes the permanent destination for this asset.</p></div>
        <dl className="claim-details"><div><dt><Gift size={18} /> Asset</dt><dd>{selectedAsset.symbol}</dd></div><div><dt><CalendarBlank size={18} /> Claimable</dt><dd>{formatDate(gift.unlockAt)}</dd></div><div><dt><Clock size={18} /> Expires</dt><dd>{formatDate(gift.expiresAt)}</dd></div><div><dt><Wallet size={18} /> Network fee</dt><dd>Paid in ETH</dd></div></dl>
        {status === 'Scheduled' && <div className="claim-scheduled"><Clock size={20} /><div><strong>Scheduled gift</strong><p>This gift unlocks on {formatDate(gift.unlockAt)}.</p></div></div>}
        {protectedGift && <div className="app-field"><label htmlFor="claim-code">Claim Code</label><input id="claim-code" value={claimCode} onChange={(event) => setClaimCode(event.target.value.toUpperCase().replace(/[^A-Z2-9]/gu, '').slice(0, 8))} placeholder="8 characters" autoComplete="one-time-code" spellCheck="false" maxLength="8" aria-describedby="claim-code-help" /><small id="claim-code-help">Ask the sender for the code shared separately from this link.</small></div>}
        <fieldset className="eligibility-fieldset"><legend>Eligibility declaration</legend><label><input type="checkbox" checked={ageConfirmed} onChange={(event) => setAgeConfirmed(event.target.checked)} /><span><Check size={14} /></span><p>I confirm that I am at least 18 years old.</p></label><label><input type="checkbox" checked={jurisdictionConfirmed} onChange={(event) => setJurisdictionConfirmed(event.target.checked)} /><span><Check size={14} /></span><p>I am not in, resident in, or a person of the United States, Canada, United Kingdom, Switzerland, UAE, or a sanctioned or otherwise restricted jurisdiction.</p></label></fieldset>
        <div className="claim-disclosure"><Info size={19} /><p>Stock Tokens are tokenised debt securities providing economic exposure. They do not grant ownership of the underlying security. Eligibility and issuer terms apply.</p></div>
        {formError && <p className="form-error" role="alert">{formError}</p>}<TransactionStatus {...transaction} />
        <button className="app-primary-button app-primary-button--full" type="submit" disabled={busy || !claimable}>{status === 'Scheduled' ? 'Gift not unlocked yet' : !isConnected ? 'Connect wallet to claim' : !onCorrectNetwork ? 'Switch to Robinhood Chain' : busy ? 'Claim in progress' : `Claim ${selectedAsset.symbol}`}{!busy && <ArrowRight size={19} weight="bold" />}</button>
        <p className="claim-panel__bearer"><LockKey size={15} /> Never share this page or its private URL while the gift is unclaimed.</p>
      </aside>
    </form>
  )
}
