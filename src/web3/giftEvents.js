import { getAddress, parseAbi, parseAbiItem } from 'viem'
import { CONTRACTS, DEPLOYMENT_BLOCK } from '../config/deployment.js'
import { decorateGiftStatus } from './giftStatus.js'

// The GiftVault CREATE receipt is at block 50,224,086. Keeping this explicit
// prevents every browser session from scanning Robinhood Chain from genesis.
export const GIFT_VAULT_DEPLOYMENT_BLOCK = DEPLOYMENT_BLOCK
export const DEFAULT_LOG_CHUNK_SIZE = 10_000n
export const DEFAULT_GIFT_ID_BATCH_SIZE = 75

export const giftLifecycleEvents = Object.freeze({
  created: parseAbiItem(
    'event GiftCreated(uint256 indexed giftId,address indexed sender,address indexed asset,uint256 principal,uint256 fee,uint40 unlockAt,uint40 expiresAt,bytes32 secretHash,bool claimCodeRequired)',
  ),
  claimed: parseAbiItem(
    'event GiftClaimed(uint256 indexed giftId,address indexed recipient,uint256 principal)',
  ),
  cancelled: parseAbiItem(
    'event GiftCancelled(uint256 indexed giftId,address indexed sender,uint256 principal)',
  ),
  recovered: parseAbiItem(
    'event GiftRecovered(uint256 indexed giftId,address indexed caller,address indexed sender,uint256 principal)',
  ),
})

const giftHistoryReadAbi = parseAbi([
  'function gift(uint256 giftId) view returns ((address sender,address asset,uint128 principal,uint40 createdAt,uint40 unlockAt,uint40 expiresAt,uint8 status,bytes32 secretHash,bytes32 claimCodeHash))',
])

const EVENT_TYPE_BY_NAME = Object.freeze({
  GiftCreated: 'created',
  GiftClaimed: 'claimed',
  GiftCancelled: 'cancelled',
  GiftRecovered: 'recovered',
})

function assertBlock(value, name) {
  if (typeof value !== 'bigint' || value < 0n) throw new TypeError(`${name} must be a non-negative bigint`)
}

function assertPositiveBigInt(value, name) {
  if (typeof value !== 'bigint' || value <= 0n) throw new TypeError(`${name} must be a positive bigint`)
}

function abortIfRequested(signal) {
  if (!signal?.aborted) return
  const error = new Error('Gift history request was aborted')
  error.name = 'AbortError'
  throw error
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function getLogsWithRetry(client, parameters, { attempts, retryDelayMs, signal }) {
  let lastError
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    abortIfRequested(signal)
    try {
      return await client.getLogs(parameters)
    } catch (error) {
      lastError = error
      if (attempt + 1 < attempts && retryDelayMs > 0) await delay(retryDelayMs * 2 ** attempt)
    }
  }
  throw lastError
}

export function logIdentity(log) {
  const transactionHash = log.transactionHash ?? 'pending'
  const blockHash = log.blockHash ?? `block-${String(log.blockNumber ?? 'unknown')}`
  const logIndex = String(log.logIndex ?? 'unknown')
  return `${transactionHash}:${blockHash}:${logIndex}`
}

function compareLogPosition(left, right) {
  const leftBlock = left.blockNumber ?? 0n
  const rightBlock = right.blockNumber ?? 0n
  if (leftBlock !== rightBlock) return leftBlock < rightBlock ? -1 : 1

  const leftTransaction = left.transactionIndex ?? 0
  const rightTransaction = right.transactionIndex ?? 0
  if (leftTransaction !== rightTransaction) return leftTransaction - rightTransaction

  return Number(left.logIndex ?? 0) - Number(right.logIndex ?? 0)
}

export function dedupeAndSortGiftEvents(logs, direction = 'desc') {
  if (!Array.isArray(logs)) throw new TypeError('logs must be an array')
  if (direction !== 'asc' && direction !== 'desc') throw new TypeError('direction must be asc or desc')

  const uniqueLogs = new Map()
  for (const log of logs) uniqueLogs.set(logIdentity(log), log)
  const multiplier = direction === 'asc' ? 1 : -1
  return [...uniqueLogs.values()].sort((left, right) => compareLogPosition(left, right) * multiplier)
}

export function normalizeGiftEvent(log) {
  const type = EVENT_TYPE_BY_NAME[log.eventName]
  if (!type || log.args?.giftId === undefined) throw new TypeError('log is not a supported gift lifecycle event')

  return {
    id: logIdentity(log),
    type,
    giftId: BigInt(log.args.giftId),
    args: log.args,
    address: log.address,
    blockNumber: log.blockNumber,
    blockHash: log.blockHash,
    transactionHash: log.transactionHash,
    transactionIndex: log.transactionIndex,
    logIndex: log.logIndex,
    removed: Boolean(log.removed),
  }
}

export async function queryLogsInChunks({
  client,
  address = CONTRACTS.giftVault,
  event,
  args,
  fromBlock = GIFT_VAULT_DEPLOYMENT_BLOCK,
  toBlock,
  chunkSize = DEFAULT_LOG_CHUNK_SIZE,
  attempts = 3,
  retryDelayMs = 250,
  signal,
}) {
  if (!client || typeof client.getLogs !== 'function') throw new TypeError('client.getLogs is required')
  if (!event) throw new TypeError('event is required')
  assertBlock(fromBlock, 'fromBlock')
  assertBlock(toBlock, 'toBlock')
  assertPositiveBigInt(chunkSize, 'chunkSize')
  if (!Number.isSafeInteger(attempts) || attempts < 1 || attempts > 5) {
    throw new TypeError('attempts must be an integer from 1 to 5')
  }
  if (toBlock < fromBlock) return []

  const logs = []
  let cursor = fromBlock
  while (cursor <= toBlock) {
    abortIfRequested(signal)
    const chunkEnd = cursor + chunkSize - 1n < toBlock ? cursor + chunkSize - 1n : toBlock
    const chunk = await getLogsWithRetry(
      client,
      { address, event, args, fromBlock: cursor, toBlock: chunkEnd, strict: true },
      { attempts, retryDelayMs, signal },
    )
    logs.push(...chunk.filter((log) => !log.removed))
    cursor = chunkEnd + 1n
  }

  return dedupeAndSortGiftEvents(logs, 'asc')
}

function chunkArray(values, chunkSize) {
  const chunks = []
  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize))
  }
  return chunks
}

function normalizeGiftIds(giftIds) {
  if (!Array.isArray(giftIds)) throw new TypeError('giftIds must be an array')
  const unique = new Set()
  for (const giftId of giftIds) {
    const parsed = BigInt(giftId)
    if (parsed <= 0n) throw new TypeError('giftIds must contain positive integers')
    unique.add(parsed.toString())
  }
  return [...unique].map(BigInt)
}

export async function queryGiftCreatedBySender(options) {
  return queryLogsInChunks({
    ...options,
    event: giftLifecycleEvents.created,
    args: { sender: getAddress(options.sender) },
  })
}

export async function queryGiftClaimedByRecipient(options) {
  return queryLogsInChunks({
    ...options,
    event: giftLifecycleEvents.claimed,
    args: { recipient: getAddress(options.recipient) },
  })
}

export async function queryGiftLifecycleByIds({
  giftIds,
  giftIdBatchSize = DEFAULT_GIFT_ID_BATCH_SIZE,
  ...options
}) {
  const normalizedIds = normalizeGiftIds(giftIds)
  if (normalizedIds.length === 0) return []
  if (!Number.isSafeInteger(giftIdBatchSize) || giftIdBatchSize < 1 || giftIdBatchSize > 250) {
    throw new TypeError('giftIdBatchSize must be an integer from 1 to 250')
  }

  const logs = []
  for (const giftIdBatch of chunkArray(normalizedIds, giftIdBatchSize)) {
    for (const event of Object.values(giftLifecycleEvents)) {
      const eventLogs = await queryLogsInChunks({
        ...options,
        event,
        args: { giftId: giftIdBatch },
      })
      logs.push(...eventLogs)
    }
  }
  return dedupeAndSortGiftEvents(logs, 'desc').map(normalizeGiftEvent)
}

function normalizeGiftTuple(value) {
  return {
    sender: value.sender,
    asset: value.asset,
    principal: BigInt(value.principal),
    createdAt: Number(value.createdAt),
    unlockAt: Number(value.unlockAt),
    expiresAt: Number(value.expiresAt),
    status: Number(value.status),
    secretHash: value.secretHash,
    claimCodeHash: value.claimCodeHash,
  }
}

export async function fetchGiftSnapshots({
  client,
  giftIds,
  address = CONTRACTS.giftVault,
  blockNumber,
  batchSize = 100,
  nowSeconds,
}) {
  if (!client || typeof client.multicall !== 'function') throw new TypeError('client.multicall is required')
  const normalizedIds = normalizeGiftIds(giftIds)
  if (!Number.isSafeInteger(batchSize) || batchSize < 1 || batchSize > 250) {
    throw new TypeError('batchSize must be an integer from 1 to 250')
  }

  const snapshots = new Map()
  for (const giftIdBatch of chunkArray(normalizedIds, batchSize)) {
    const contracts = giftIdBatch.map((giftId) => ({
      address,
      abi: giftHistoryReadAbi,
      functionName: 'gift',
      args: [giftId],
    }))
    let results
    try {
      results = await client.multicall({
        contracts,
        allowFailure: true,
        ...(blockNumber === undefined ? {} : { blockNumber }),
      })
    } catch (multicallError) {
      if (typeof client.readContract !== 'function') throw multicallError
      const settled = await Promise.allSettled(contracts.map((contract) => client.readContract({
        ...contract,
        ...(blockNumber === undefined ? {} : { blockNumber }),
      })))
      results = settled.map((result) => result.status === 'fulfilled'
        ? { status: 'success', result: result.value }
        : { status: 'failure', error: result.reason })
    }

    results.forEach((result, index) => {
      if (result.status !== 'success') return
      const giftId = giftIdBatch[index]
      snapshots.set(giftId.toString(), decorateGiftStatus(normalizeGiftTuple(result.result), nowSeconds))
    })
  }
  return snapshots
}

function eventMatchesAddress(event, field, address) {
  const candidate = event.args?.[field]
  return typeof candidate === 'string' && candidate.toLowerCase() === address.toLowerCase()
}

function newestEventBlock(events) {
  return events.reduce((highest, event) => {
    const blockNumber = event.blockNumber ?? 0n
    return blockNumber > highest ? blockNumber : highest
  }, 0n)
}

export async function fetchWalletGiftHistory({
  client,
  eventClient = client,
  walletAddress,
  knownGiftIds = [],
  address = CONTRACTS.giftVault,
  fromBlock = GIFT_VAULT_DEPLOYMENT_BLOCK,
  toBlock,
  confirmationBlocks = 0n,
  nowSeconds,
  signal,
  ...queryOptions
}) {
  if (!client || typeof client.getBlockNumber !== 'function') throw new TypeError('client.getBlockNumber is required')
  if (!eventClient || typeof eventClient.getLogs !== 'function') throw new TypeError('eventClient.getLogs is required')
  const account = getAddress(walletAddress)
  assertBlock(confirmationBlocks, 'confirmationBlocks')
  const latestBlock = toBlock ?? await client.getBlockNumber()
  assertBlock(latestBlock, 'toBlock')
  const indexedToBlock = latestBlock > confirmationBlocks ? latestBlock - confirmationBlocks : 0n

  if (indexedToBlock < fromBlock) {
    return {
      records: [],
      sent: [],
      received: [],
      imported: [],
      timeline: [],
      indexedFromBlock: fromBlock,
      indexedToBlock,
    }
  }

  const commonOptions = { client: eventClient, address, fromBlock, toBlock: indexedToBlock, signal, ...queryOptions }
  const [createdLogs, recipientClaimLogs] = await Promise.all([
    queryGiftCreatedBySender({ ...commonOptions, sender: account }),
    queryGiftClaimedByRecipient({ ...commonOptions, recipient: account }),
  ])

  const importedIds = normalizeGiftIds(knownGiftIds)
  const discoveredIds = normalizeGiftIds([
    ...createdLogs.map((log) => log.args.giftId),
    ...recipientClaimLogs.map((log) => log.args.giftId),
    ...importedIds,
  ])

  const [timeline, snapshots] = await Promise.all([
    queryGiftLifecycleByIds({ giftIds: discoveredIds, ...commonOptions }),
    fetchGiftSnapshots({
      client,
      giftIds: discoveredIds,
      address,
      blockNumber: indexedToBlock,
      nowSeconds,
    }),
  ])

  const importedSet = new Set(importedIds.map(String))
  const records = discoveredIds.map((giftId) => {
    const events = timeline.filter((event) => event.giftId === giftId)
    const createdEvent = events.find((event) => event.type === 'created') ?? null
    const claimedEvent = events.find((event) => event.type === 'claimed') ?? null
    const snapshot = snapshots.get(giftId.toString()) ?? null
    return {
      giftId,
      gift: snapshot,
      displayStatus: snapshot?.displayStatus ?? null,
      displayStatusKey: snapshot?.displayStatusKey ?? 'unavailable',
      roles: {
        sent: Boolean(createdEvent && eventMatchesAddress(createdEvent, 'sender', account)),
        received: Boolean(claimedEvent && eventMatchesAddress(claimedEvent, 'recipient', account)),
        imported: importedSet.has(giftId.toString()),
      },
      createdEvent,
      claimedEvent,
      latestEvent: events[0] ?? null,
      events,
    }
  }).sort((left, right) => {
    const blockDifference = newestEventBlock(right.events) - newestEventBlock(left.events)
    if (blockDifference !== 0n) return blockDifference > 0n ? 1 : -1
    return left.giftId === right.giftId ? 0 : left.giftId > right.giftId ? -1 : 1
  })

  return {
    records,
    sent: records.filter((record) => record.roles.sent),
    received: records.filter((record) => record.roles.received),
    imported: records.filter((record) => record.roles.imported),
    timeline,
    indexedFromBlock: fromBlock,
    indexedToBlock,
  }
}
