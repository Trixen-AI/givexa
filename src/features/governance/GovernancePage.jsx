import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowSquareOut,
  CheckCircle,
  ClockCountdown,
  Database,
  LockKey,
  PauseCircle,
  ShieldCheck,
  WarningCircle,
} from '@phosphor-icons/react'
import { usePublicClient } from 'wagmi'
import {
  BLOCK_EXPLORER_URL,
  CONTRACTS,
  ROBINHOOD_CHAIN_ID,
  SUPPORTED_ASSETS,
} from '../../config/deployment.js'
import {
  governanceFeeControllerAbi,
  governanceAssetRegistryAbi,
  governanceVaultAbi,
  ownableAbi,
  safeConfigurationAbi,
  timelockConfigurationAbi,
} from './governanceAbis.js'

const EXPECTED_SAFE_THRESHOLD = 2n
const EXPECTED_SAFE_OWNER_COUNT = 3
const EXPECTED_TIMELOCK_DELAY = 48n * 60n * 60n
const EMPTY_VALUES = Object.freeze({})
const EMPTY_FAILURES = Object.freeze([])

const GOVERNANCE_READS = Object.freeze([
  ['safeOwners', CONTRACTS.treasurySafe, safeConfigurationAbi, 'getOwners'],
  ['safeThreshold', CONTRACTS.treasurySafe, safeConfigurationAbi, 'getThreshold'],
  ['timelockDelay', CONTRACTS.timelock, timelockConfigurationAbi, 'getMinDelay'],
  ['vaultOwner', CONTRACTS.giftVault, governanceVaultAbi, 'owner'],
  ['vaultGuardian', CONTRACTS.giftVault, governanceVaultAbi, 'guardian'],
  ['creationPaused', CONTRACTS.giftVault, governanceVaultAbi, 'creationPaused'],
  ['vaultRegistry', CONTRACTS.giftVault, governanceVaultAbi, 'assetRegistry'],
  ['vaultFeeController', CONTRACTS.giftVault, governanceVaultAbi, 'feeController'],
  ['registryOwner', CONTRACTS.assetRegistry, ownableAbi, 'owner'],
  ['feeControllerOwner', CONTRACTS.feeController, governanceFeeControllerAbi, 'owner'],
  ['feeBps', CONTRACTS.feeController, governanceFeeControllerAbi, 'feeBps'],
  ['feeCapBps', CONTRACTS.feeController, governanceFeeControllerAbi, 'MAX_FEE_BPS'],
  ['treasury', CONTRACTS.feeController, governanceFeeControllerAbi, 'treasury'],
])

function sameAddress(first, second) {
  return Boolean(first && second && first.toLowerCase() === second.toLowerCase())
}

function shortAddress(address) {
  if (!address) return 'Unavailable'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function formatDelay(seconds) {
  if (seconds === null || seconds === undefined) return 'Unavailable'
  const hours = Number(seconds) / 3600
  return Number.isInteger(hours) ? `${hours} hours` : `${hours.toFixed(1)} hours`
}

function formatFee(basisPoints) {
  if (basisPoints === null || basisPoints === undefined) return 'Unavailable'
  return `${(Number(basisPoints) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}%`
}

async function readGovernanceState(publicClient) {
  const reads = [
    ...GOVERNANCE_READS.map(([key, address, abi, functionName]) => ({ key, address, abi, functionName })),
    ...SUPPORTED_ASSETS.map((asset) => ({
      key: `asset:${asset.address.toLowerCase()}`,
      address: CONTRACTS.assetRegistry,
      abi: governanceAssetRegistryAbi,
      functionName: 'isSupported',
      args: [asset.address],
    })),
  ]

  const settled = await Promise.allSettled(
    reads.map(({ address, abi, functionName, args }) => publicClient.readContract({ address, abi, functionName, args })),
  )

  return settled.reduce((result, item, index) => {
    const key = reads[index].key
    if (item.status === 'fulfilled') result.values[key] = item.value
    else result.failed.push(key)
    return result
  }, { values: {}, failed: [] })
}

function ExplorerLink({ address, children, className = '' }) {
  return (
    <a
      className={`inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-semibold text-givexa-700 underline decoration-givexa-300 underline-offset-4 transition-colors hover:text-givexa-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-givexa-500 focus-visible:ring-offset-2 ${className}`}
      href={`${BLOCK_EXPLORER_URL}/address/${address}`}
      target="_blank"
      rel="noreferrer"
      aria-label={`${children}. View on Blockscout`}
    >
      {children}<ArrowSquareOut size={17} aria-hidden="true" />
    </a>
  )
}

function StatusPill({ healthy, children }) {
  return (
    <span className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${healthy ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>
      {healthy ? <CheckCircle size={15} weight="fill" aria-hidden="true" /> : <WarningCircle size={15} weight="fill" aria-hidden="true" />}
      {children}
    </span>
  )
}

function PostureCard({ icon: Icon, title, value, detail, healthy }) {
  return (
    <article className="rounded-3xl border border-violet-100 bg-white p-5 shadow-[0_12px_40px_rgba(53,30,110,0.06)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-givexa-50 text-givexa-700">
          <Icon size={23} weight="duotone" aria-hidden="true" />
        </span>
        <StatusPill healthy={healthy}>{healthy ? 'Verified' : 'Review'}</StatusPill>
      </div>
      <h2 className="mt-6 text-sm font-semibold text-slate-600">{title}</h2>
      <p className="mt-1 text-2xl font-semibold tracking-[-0.025em] text-slate-950">{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>
    </article>
  )
}

function ContractCard({ name, role, address, state, healthy = true }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{name}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">{role}</p>
        </div>
        <StatusPill healthy={healthy}>{state}</StatusPill>
      </div>
      <ExplorerLink address={address} className="mt-5 font-mono text-xs">{shortAddress(address)}</ExplorerLink>
    </article>
  )
}

function LoadingState() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" role="status" aria-label="Loading governance status">
      {[0, 1, 2, 3].map((item) => (
        <div className="h-56 animate-pulse rounded-3xl border border-violet-100 bg-white p-6" key={item}>
          <div className="size-11 rounded-2xl bg-violet-100" />
          <div className="mt-7 h-4 w-24 rounded bg-slate-100" />
          <div className="mt-3 h-8 w-36 rounded bg-slate-100" />
          <div className="mt-5 h-4 w-full rounded bg-slate-100" />
        </div>
      ))}
      <span className="sr-only">Reading governance contracts from Robinhood Chain.</span>
    </div>
  )
}

export function GovernancePage() {
  const publicClient = usePublicClient({ chainId: ROBINHOOD_CHAIN_ID })
  const governanceQuery = useQuery({
    queryKey: ['governance-status', ROBINHOOD_CHAIN_ID],
    queryFn: () => readGovernanceState(publicClient),
    enabled: Boolean(publicClient),
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  })

  const values = governanceQuery.data?.values || EMPTY_VALUES
  const failedReads = governanceQuery.data?.failed || EMPTY_FAILURES
  const posture = useMemo(() => {
    const safeHealthy = values.safeThreshold === EXPECTED_SAFE_THRESHOLD
      && values.safeOwners?.length === EXPECTED_SAFE_OWNER_COUNT
    const timelockHealthy = values.timelockDelay === EXPECTED_TIMELOCK_DELAY
    const ownershipHealthy = sameAddress(values.vaultOwner, CONTRACTS.timelock)
      && sameAddress(values.registryOwner, CONTRACTS.timelock)
      && sameAddress(values.feeControllerOwner, CONTRACTS.timelock)
    const routesHealthy = sameAddress(values.vaultRegistry, CONTRACTS.assetRegistry)
      && sameAddress(values.vaultFeeController, CONTRACTS.feeController)
      && sameAddress(values.vaultGuardian, CONTRACTS.treasurySafe)
      && sameAddress(values.treasury, CONTRACTS.treasurySafe)
    const feeHealthy = values.feeBps !== undefined
      && values.feeCapBps !== undefined
      && values.feeBps <= values.feeCapBps
    const supportedAssets = SUPPORTED_ASSETS.filter(
      ({ address }) => values[`asset:${address.toLowerCase()}`] === true,
    ).length

    return { safeHealthy, timelockHealthy, ownershipHealthy, routesHealthy, feeHealthy, supportedAssets }
  }, [values])

  const refreshedAt = governanceQuery.dataUpdatedAt
    ? new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(governanceQuery.dataUpdatedAt)
    : null

  return (
    <section className="mx-auto w-full max-w-[1184px]" aria-labelledby="governance-title">
      <div className="overflow-hidden rounded-[30px] border border-violet-100 bg-[radial-gradient(circle_at_80%_0%,rgba(183,164,255,0.32),transparent_34%),linear-gradient(135deg,#fbfaff_0%,#ffffff_60%)] px-5 py-10 sm:px-10 sm:py-14 lg:px-14">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-givexa-600">Onchain governance</p>
            <h1 id="governance-title" className="mt-4 max-w-2xl text-4xl font-medium tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl">
              Protocol controls, visible to everyone.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              This page reads the deployed Safe, Timelock, fee settings, ownership, and asset allowlist directly from Robinhood Chain. It cannot submit governance actions.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-violet-200 bg-white px-4 text-sm font-semibold text-slate-800">
              <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" /> Chain ID {ROBINHOOD_CHAIN_ID}
            </span>
            <button
              className="min-h-11 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-givexa-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-givexa-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
              type="button"
              onClick={() => governanceQuery.refetch()}
              disabled={governanceQuery.isFetching}
            >
              {governanceQuery.isFetching ? 'Refreshing' : 'Refresh status'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-10" aria-live="polite">
        {governanceQuery.isPending && <LoadingState />}
        {governanceQuery.isError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900" role="alert">
            <div className="flex items-start gap-3">
              <WarningCircle className="mt-0.5 shrink-0" size={22} weight="fill" aria-hidden="true" />
              <div><h2 className="font-semibold">Governance status is unavailable</h2><p className="mt-1 text-sm leading-6">The Robinhood Chain provider did not return the contract state. Check the RPC connection and retry.</p></div>
            </div>
          </div>
        )}
        {governanceQuery.isSuccess && (
          <>
            {failedReads.length > 0 && (
              <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950" role="status">
                <strong>Partial onchain response.</strong> {failedReads.length} of {GOVERNANCE_READS.length + SUPPORTED_ASSETS.length} checks could not be read. Unavailable values are marked for review.
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <PostureCard
                icon={ShieldCheck}
                title="Safe approvals"
                value={values.safeThreshold !== undefined && values.safeOwners ? `${values.safeThreshold}-of-${values.safeOwners.length}` : 'Unavailable'}
                detail="The governance Safe should require two approvals from three independent owners."
                healthy={posture.safeHealthy}
              />
              <PostureCard
                icon={ClockCountdown}
                title="Timelock delay"
                value={formatDelay(values.timelockDelay)}
                detail="Configuration changes remain queued before permissionless execution."
                healthy={posture.timelockHealthy}
              />
              <PostureCard
                icon={PauseCircle}
                title="Gift creation"
                value={values.creationPaused === undefined ? 'Unavailable' : values.creationPaused ? 'Paused' : 'Operational'}
                detail="Pause affects new gifts only. Existing claims, cancellations, and recovery stay available."
                healthy={values.creationPaused === false}
              />
              <PostureCard
                icon={Database}
                title="Supported assets"
                value={`${posture.supportedAssets} of ${SUPPORTED_ASSETS.length}`}
                detail="Configured Stock Tokens currently returning supported from the Asset Registry."
                healthy={posture.supportedAssets === SUPPORTED_ASSETS.length}
              />
            </div>
          </>
        )}
      </div>

      {governanceQuery.isSuccess && (
        <>
          <section className="mt-14" aria-labelledby="governance-controls-title">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-givexa-600">Control plane</p><h2 id="governance-controls-title" className="mt-2 text-3xl font-medium tracking-[-0.035em] text-slate-950">Verified contract relationships</h2></div>
              {refreshedAt && <p className="text-xs text-slate-500">Last refreshed at {refreshedAt}</p>}
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <ContractCard name="Governance Safe" role="Proposes timelocked changes and acts as emergency guardian." address={CONTRACTS.treasurySafe} state={posture.safeHealthy ? '2-of-3' : 'Review'} healthy={posture.safeHealthy} />
              <ContractCard name="Timelock" role="Owns every configurable Givexa protocol contract." address={CONTRACTS.timelock} state={posture.ownershipHealthy ? 'Owner' : 'Review'} healthy={posture.ownershipHealthy} />
              <ContractCard name="Gift Vault" role="Escrows principal and enforces the gift lifecycle." address={CONTRACTS.giftVault} state={posture.routesHealthy ? 'Connected' : 'Review'} healthy={posture.routesHealthy} />
              <ContractCard name="Asset Registry" role={`${posture.supportedAssets} supported assets read directly onchain.`} address={CONTRACTS.assetRegistry} state={sameAddress(values.registryOwner, CONTRACTS.timelock) ? 'Timelocked' : 'Review'} healthy={sameAddress(values.registryOwner, CONTRACTS.timelock)} />
              <ContractCard name="Fee Controller" role={`Current creation fee ${formatFee(values.feeBps)} with a ${formatFee(values.feeCapBps)} contract cap.`} address={CONTRACTS.feeController} state={posture.feeHealthy ? 'Within cap' : 'Review'} healthy={posture.feeHealthy} />
            </div>
          </section>

          <section className="mt-14 rounded-[28px] bg-slate-950 p-6 text-white sm:p-9" aria-labelledby="governance-boundaries-title">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div><span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-violet-200"><LockKey size={24} weight="duotone" aria-hidden="true" /></span><h2 id="governance-boundaries-title" className="mt-5 text-3xl font-medium tracking-[-0.035em]">Read-only by design.</h2><p className="mt-3 max-w-md text-sm leading-6 text-slate-300">Wallets connected to the user application cannot change fees, ownership, the allowlist, treasury, or guardian from this page.</p></div>
              <dl className="grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2">
                <div className="bg-slate-900 p-5"><dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Guardian</dt><dd className="mt-3 font-mono text-sm text-white">{shortAddress(values.vaultGuardian)}</dd></div>
                <div className="bg-slate-900 p-5"><dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Treasury</dt><dd className="mt-3 font-mono text-sm text-white">{shortAddress(values.treasury)}</dd></div>
                <div className="bg-slate-900 p-5"><dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Protocol ownership</dt><dd className="mt-3 text-sm text-white">{posture.ownershipHealthy ? 'Timelock verified' : 'Review required'}</dd></div>
                <div className="bg-slate-900 p-5"><dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Vault dependencies</dt><dd className="mt-3 text-sm text-white">{posture.routesHealthy ? 'Registry and fees verified' : 'Review required'}</dd></div>
              </dl>
            </div>
          </section>
        </>
      )}
    </section>
  )
}
