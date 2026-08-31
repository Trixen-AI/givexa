import { decodeEventLog, encodeEventTopics, getAddress } from 'viem'
import { BLOCKSCOUT_API_URL } from '../config/deployment.js'

const BLOCKSCOUT_RESULT_LIMIT = 1_000
const MAX_SPLIT_DEPTH = 24

function toSafeQuantity(value) {
  if (!value || value === '0x') return 0
  return Number(BigInt(value))
}

function expandArgs(args = {}) {
  let combinations = [{}]
  for (const [name, rawValue] of Object.entries(args)) {
    const values = Array.isArray(rawValue) ? rawValue : [rawValue]
    combinations = combinations.flatMap((combination) => values.map((value) => ({ ...combination, [name]: value })))
  }
  return combinations
}

export function buildBlockscoutLogsUrl({
  apiUrl = BLOCKSCOUT_API_URL,
  address,
  event,
  args,
  fromBlock,
  toBlock,
}) {
  const encodedTopics = encodeEventTopics({ abi: [event], eventName: event.name, args })
  const url = new URL(apiUrl)
  url.searchParams.set('module', 'logs')
  url.searchParams.set('action', 'getLogs')
  url.searchParams.set('fromBlock', fromBlock.toString())
  url.searchParams.set('toBlock', toBlock.toString())
  url.searchParams.set('address', getAddress(address))
  encodedTopics.forEach((topic, index) => {
    if (!topic) return
    url.searchParams.set(`topic${index}`, topic)
    if (index > 0) url.searchParams.set(`topic0_${index}_opr`, 'and')
  })
  return url
}

export function normalizeBlockscoutLog(rawLog, event) {
  const decoded = decodeEventLog({
    abi: [event],
    data: rawLog.data,
    topics: rawLog.topics,
    strict: true,
  })
  return {
    eventName: decoded.eventName,
    args: decoded.args,
    address: getAddress(rawLog.address),
    blockNumber: BigInt(rawLog.blockNumber),
    blockHash: rawLog.blockHash || rawLog.block_hash || undefined,
    transactionHash: rawLog.transactionHash,
    transactionIndex: toSafeQuantity(rawLog.transactionIndex),
    logIndex: toSafeQuantity(rawLog.logIndex),
    removed: false,
  }
}

async function requestRange({ fetchImpl, request, fromBlock, toBlock, depth, signal }) {
  const url = buildBlockscoutLogsUrl({ ...request, fromBlock, toBlock })
  const response = await fetchImpl(url, { headers: { accept: 'application/json' }, signal })
  if (!response.ok) throw new Error(`Blockscout log request failed with HTTP ${response.status}`)

  const payload = await response.json()
  if (payload.status === '0' && /no logs found/iu.test(payload.message || '')) return []
  if (payload.status !== '1' || !Array.isArray(payload.result)) throw new Error('Blockscout returned an invalid log response')

  if (payload.result.length < BLOCKSCOUT_RESULT_LIMIT) {
    return payload.result.map((log) => normalizeBlockscoutLog(log, request.event))
  }
  if (fromBlock === toBlock || depth >= MAX_SPLIT_DEPTH) {
    throw new Error('Blockscout log result exceeded the safe pagination limit')
  }

  const midpoint = fromBlock + ((toBlock - fromBlock) / 2n)
  const [left, right] = await Promise.all([
    requestRange({ fetchImpl, request, fromBlock, toBlock: midpoint, depth: depth + 1, signal }),
    requestRange({ fetchImpl, request, fromBlock: midpoint + 1n, toBlock, depth: depth + 1, signal }),
  ])
  return [...left, ...right]
}

export function createBlockscoutEventClient({ fetchImpl = fetch, apiUrl = BLOCKSCOUT_API_URL } = {}) {
  if (typeof fetchImpl !== 'function') throw new TypeError('fetchImpl must be a function')
  return Object.freeze({
    async getLogs({ address, event, args = {}, fromBlock, toBlock, signal }) {
      if (!event) throw new TypeError('event is required')
      const variants = expandArgs(args)
      const results = await Promise.all(variants.map((variantArgs) => requestRange({
        fetchImpl,
        request: { apiUrl, address, event, args: variantArgs },
        fromBlock,
        toBlock,
        depth: 0,
        signal,
      })))
      return results.flat()
    },
  })
}
