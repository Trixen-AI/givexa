import assert from 'node:assert/strict'
import test from 'node:test'
import { encodeEventTopics } from 'viem'
import { buildBlockscoutLogsUrl, createBlockscoutEventClient } from '../src/web3/blockscoutEvents.js'
import { giftLifecycleEvents } from '../src/web3/giftEvents.js'

const vault = '0x82d477c00e1D8DC784aE87a71Ffa2C56Ad2626E9'
const sender = '0x1111111111111111111111111111111111111111'

test('builds an indexed Blockscout query for a GiftCreated sender', () => {
  const event = giftLifecycleEvents.created
  const url = buildBlockscoutLogsUrl({
    apiUrl: 'https://example.com/api',
    address: vault,
    event,
    args: { sender },
    fromBlock: 100n,
    toBlock: 200n,
  })
  const topics = encodeEventTopics({ abi: [event], eventName: event.name, args: { sender } })
  assert.equal(url.searchParams.get('fromBlock'), '100')
  assert.equal(url.searchParams.get('toBlock'), '200')
  assert.equal(url.searchParams.get('topic0'), topics[0])
  assert.equal(url.searchParams.get('topic2'), topics[2])
  assert.equal(url.searchParams.get('topic0_2_opr'), 'and')
})

test('treats the canonical Blockscout empty response as an empty log set', async () => {
  const requestedUrls = []
  const client = createBlockscoutEventClient({
    apiUrl: 'https://example.com/api',
    fetchImpl: async (url) => {
      requestedUrls.push(url.toString())
      return { ok: true, async json() { return { status: '0', message: 'No logs found', result: [] } } }
    },
  })
  const logs = await client.getLogs({
    address: vault,
    event: giftLifecycleEvents.claimed,
    args: { recipient: sender },
    fromBlock: 100n,
    toBlock: 200n,
  })
  assert.deepEqual(logs, [])
  assert.equal(requestedUrls.length, 1)
})

test('expands arrays of indexed gift ids into independent safe queries', async () => {
  const requestedUrls = []
  const client = createBlockscoutEventClient({
    apiUrl: 'https://example.com/api',
    fetchImpl: async (url) => {
      requestedUrls.push(url.toString())
      return { ok: true, async json() { return { status: '0', message: 'No logs found', result: [] } } }
    },
  })
  await client.getLogs({
    address: vault,
    event: giftLifecycleEvents.cancelled,
    args: { giftId: [1n, 2n, 3n] },
    fromBlock: 100n,
    toBlock: 200n,
  })
  assert.equal(requestedUrls.length, 3)
  assert.equal(new Set(requestedUrls).size, 3)
})
