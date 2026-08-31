import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import { motion as Motion, useReducedMotion } from 'framer-motion'
import {
  ArrowClockwise,
  ArrowRight,
  ArrowSquareOut,
  CalendarBlank,
  CheckCircle,
  Clock,
  Funnel,
  Gift,
  PaperPlaneTilt,
  ShieldCheck,
  Wallet,
  WarningCircle,
} from '@phosphor-icons/react'
import { usePublicClient } from 'wagmi'
import { ASSET_BY_ADDRESS, ROBINHOOD_CHAIN_ID, SUPPORTED_ASSETS } from '../../config/deployment.js'
import { fetchWalletGiftHistory } from '../../web3/giftEvents.js'
import { createBlockscoutEventClient } from '../../web3/blockscoutEvents.js'
import { formatDate, formatTokenAmount, transactionUrl } from '../../web3/format.js'
import {
  belongsToDashboardView,
  dashboardAssetMatches,
  dashboardStatusMatches,
  summarizeGiftHistory,
} from './dashboardModel.js'

const EMPTY_HISTORY = Object.freeze({ records: [], sent: [], received: [], timeline: [] })
const blockscoutEventClient = createBlockscoutEventClient()
const STATUS_LABELS = Object.freeze({
  scheduled: 'Scheduled',
  active: 'Ready to claim',
  expired: 'Expired',
  claimed: 'Claimed',
  cancelled: 'Cancelled',
  recovered: 'Returned',
  unavailable: 'Unavailable',
})

function SummaryCard({ icon: Icon, label, value, copy, tone = 'purple' }) {
  return (
    <article className={`dashboard-summary-card dashboard-summary-card--${tone}`}>
      <div><span><Icon size={20} weight="duotone" /></span><strong>{value}</strong></div>
      <h2>{label}</h2><p>{copy}</p>
    </article>
  )
}

function DashboardEmpty({ filtered, onReset }) {
  return (
    <section className="dashboard-empty app-card">
      <span><Gift size={34} weight="duotone" /></span>
      <h2>{filtered ? 'No gifts match these filters.' : 'Your gift history starts here.'}</h2>
      <p>{filtered ? 'Reset the filters or choose another asset and status.' : 'Create a funded gift and its lifecycle will appear here directly from Robinhood Chain.'}</p>
      {filtered
        ? <button className="app-secondary-button" type="button" onClick={onReset}>Reset filters</button>
        : <a className="app-primary-button" href="/app">Create a gift <ArrowRight size={17} weight="bold" /></a>}
    </section>
  )
}

function GiftRecord({ record }) {
  const asset = record.gift?.asset ? ASSET_BY_ADDRESS.get(record.gift.asset.toLowerCase()) : null
  const statusKey = record.displayStatusKey
  const relationship = record.roles.sent && record.roles.received ? 'Sent and received' : record.roles.sent ? 'Sent' : record.roles.received ? 'Received' : 'Imported'
  const transactionHash = record.latestEvent?.transactionHash

  return (
    <article className="dashboard-gift-row">
      <div className="dashboard-gift-row__asset">
        {asset ? <img src={`/stocks/${asset.symbol}.webp`} alt="" width="42" height="42" /> : <span><Gift size={22} weight="duotone" /></span>}
        <div><strong>{formatTokenAmount(record.gift?.principal)} {asset?.symbol || 'Token'}</strong><small>Gift Vault #{record.giftId}</small></div>
      </div>
      <div className="dashboard-gift-row__meta"><small>Relationship</small><strong>{relationship}</strong></div>
      <div className="dashboard-gift-row__meta"><small>Created</small><strong>{record.gift ? formatDate(record.gift.createdAt) : 'Unavailable'}</strong></div>
      <div><span className={`gift-status-badge gift-status-badge--${statusKey}`}><span />{STATUS_LABELS[statusKey] || 'Unavailable'}</span></div>
      <div className="dashboard-gift-row__actions">
        {transactionHash && <a href={transactionUrl(transactionHash)} target="_blank" rel="noreferrer" aria-label={`View latest Gift Vault ${record.giftId} transaction on Blockscout`}><ArrowSquareOut size={17} /></a>}
        <a className="app-secondary-button" href={`/gift/${record.giftId}`}>Details <ArrowRight size={16} weight="bold" /></a>
      </div>
    </article>
  )
}

function ConnectDashboard() {
  const { open } = useAppKit()
  return (
    <section className="dashboard-connect app-card">
      <span><Wallet size={38} weight="duotone" /></span><p className="app-eyebrow">Private wallet view</p>
      <h1>Connect to read your gift history.</h1>
      <p>Givexa queries public Robinhood Chain events for the connected address. No backend profile or custody account is created.</p>
      <button className="app-primary-button" type="button" onClick={() => open({ view: 'Connect', namespace: 'eip155' })}>Connect wallet <ArrowRight size={18} weight="bold" /></button>
    </section>
  )
}

export function DashboardFlow() {
  const reduceMotion = useReducedMotion()
  const { address, isConnected } = useAppKitAccount({ namespace: 'eip155' })
  const publicClient = usePublicClient({ chainId: ROBINHOOD_CHAIN_ID })
  const [view, setView] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [assetFilter, setAssetFilter] = useState('all')

  const historyQuery = useQuery({
    queryKey: ['wallet-gift-history', ROBINHOOD_CHAIN_ID, address?.toLowerCase()],
    queryFn: ({ signal }) => fetchWalletGiftHistory({
      client: publicClient,
      eventClient: blockscoutEventClient,
      walletAddress: address,
      confirmationBlocks: 2n,
      chunkSize: 1_000_000_000n,
      signal,
    }),
    enabled: Boolean(isConnected && address && publicClient),
    staleTime: 20_000,
    refetchInterval: 45_000,
    retry: 1,
  })

  const history = historyQuery.data || EMPTY_HISTORY
  const summary = summarizeGiftHistory(history)
  const filteredRecords = useMemo(() => history.records.filter((record) => (
    belongsToDashboardView(record, view)
      && dashboardStatusMatches(record, statusFilter)
      && dashboardAssetMatches(record, assetFilter)
  )), [assetFilter, history.records, statusFilter, view])
  const hasFilters = view !== 'all' || statusFilter !== 'all' || assetFilter !== 'all'

  function resetFilters() {
    setView('all'); setStatusFilter('all'); setAssetFilter('all')
  }

  if (!isConnected) return <ConnectDashboard />

  return (
    <div className="dashboard-page">
      <section className="dashboard-heading">
        <div><p className="app-eyebrow">Your onchain activity</p><h1>Gift dashboard</h1><p>Track sent and received Gift Vaults without a Givexa backend. Events come from Blockscout and current state is verified from the Gift Vault contract.</p></div>
        <div className="dashboard-heading__actions"><button className="app-secondary-button" type="button" onClick={() => historyQuery.refetch()} disabled={historyQuery.isFetching}><ArrowClockwise className={historyQuery.isFetching ? 'animate-spin' : ''} size={17} /> {historyQuery.isFetching ? 'Refreshing' : 'Refresh'}</button><a className="app-primary-button" href="/app">Create gift <ArrowRight size={17} weight="bold" /></a></div>
      </section>

      {historyQuery.isPending && <section className="dashboard-loading" role="status" aria-label="Loading gift dashboard">{[0, 1, 2, 3].map((item) => <span key={item} />)}<p className="sr-only">Reading confirmed gift events.</p></section>}
      {historyQuery.isError && <section className="dashboard-error app-card" role="alert"><WarningCircle size={23} weight="fill" /><div><h2>Gift history is unavailable</h2><p>Blockscout or the configured Robinhood Chain provider did not return a complete verified history. No partial result is shown.</p><button className="app-secondary-button" type="button" onClick={() => historyQuery.refetch()}>Try again</button></div></section>}

      {historyQuery.isSuccess && (
        <>
          <Motion.section className="dashboard-summary-grid" initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <SummaryCard icon={PaperPlaneTilt} label="Gifts sent" value={summary.sent} copy="Created by this wallet" />
            <SummaryCard icon={Wallet} label="Gifts received" value={summary.received} copy="Claimed by this wallet" tone="blue" />
            <SummaryCard icon={Clock} label="Pending claims" value={summary.pending} copy="Sent and awaiting claim" tone="amber" />
            <SummaryCard icon={CheckCircle} label="Final states" value={summary.completed} copy="Claimed, cancelled, or returned" tone="green" />
          </Motion.section>

          <div className="dashboard-privacy-note"><ShieldCheck size={19} weight="duotone" /><p>Bearer gifts have no recipient address before claim. Pending incoming gifts stay private in their claim links and cannot be discovered from a wallet address.</p></div>

          <section className="dashboard-history app-card" aria-labelledby="gift-history-title">
            <div className="dashboard-history__heading"><div><p className="app-eyebrow">Confirmed activity</p><h2 id="gift-history-title">Gift Vaults</h2></div><p>{summary.scheduled} scheduled gift{summary.scheduled === 1 ? '' : 's'}</p></div>
            <div className="dashboard-view-tabs" role="tablist" aria-label="Gift relationship">
              {[['all', 'All gifts'], ['sent', 'Sent'], ['received', 'Received']].map(([key, label]) => <button className={view === key ? 'is-active' : ''} type="button" role="tab" aria-selected={view === key} onClick={() => setView(key)} key={key}>{label}</button>)}
            </div>
            <div className="dashboard-filters">
              <div><Funnel size={18} /><strong>Filter</strong></div>
              <label><span>Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option><option value="pending">Pending claims</option><option value="scheduled">Scheduled</option><option value="active">Ready to claim</option><option value="expired">Expired</option><option value="complete">Final states</option><option value="claimed">Claimed</option><option value="cancelled">Cancelled</option><option value="recovered">Returned</option></select></label>
              <label><span>Asset</span><select value={assetFilter} onChange={(event) => setAssetFilter(event.target.value)}><option value="all">All assets</option>{SUPPORTED_ASSETS.map((asset) => <option value={asset.address.toLowerCase()} key={asset.address}>{asset.symbol}</option>)}</select></label>
              {hasFilters && <button type="button" onClick={resetFilters}>Clear filters</button>}
            </div>
            {filteredRecords.length > 0
              ? <div className="dashboard-gift-list">{filteredRecords.map((record) => <GiftRecord record={record} key={record.giftId.toString()} />)}</div>
              : <DashboardEmpty filtered={hasFilters} onReset={resetFilters} />}
          </section>

          <section className="dashboard-explainer">
            <CalendarBlank size={20} weight="duotone" /><div><strong>Verified event history</strong><p>Givexa reads public lifecycle events from Blockscout, waits for two confirmations, removes duplicate logs, and refreshes every Gift Vault state directly from the contract.</p></div>
          </section>
        </>
      )}
    </div>
  )
}
