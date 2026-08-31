import assert from 'node:assert/strict'
import test from 'node:test'
import {
  GIFT_VAULT_DEPLOYMENT_BLOCK,
  dedupeAndSortGiftEvents,
  fetchWalletGiftHistory,
  giftLifecycleEvents,
  queryLogsInChunks,
} from '../src/web3/giftEvents.js'

const account = '0x1111111111111111111111111111111111111111'
const other = '0x2222222222222222222222222222222222222222'
const asset = '0x3333333333333333333333333333333333333333'

function lifecycleLog({
  eventName,
  giftId,
  blockNumber,
  logIndex = 0,
  args = {},
}) {
  return {
    eventName,
    args: { giftId, ...args },
    address: '0x82d477c00e1D8DC784aE87a71Ffa2C56Ad2626E9',
    blockNumber,
    blockHash: `0x${blockNumber.toString(16).padStart(64, '0')}`,
    transactionHash: `0x${(blockNumber + BigInt(logIndex)).toString(16).padStart(64, '0')}`,
    transactionIndex: 0,
    logIndex,
    removed: false,
  }
}

test('queries inclusive non-overlapping block chunks and ignores removed logs', async () => {
  const calls = []
  const client = {
    async getLogs(parameters) {
      calls.push([parameters.fromBlock, parameters.toBlock])
      return parameters.fromBlock === 100n
        ? [
            lifecycleLog({ eventName: 'GiftCreated', giftId: 1n, blockNumber: 101n }),
            { ...lifecycleLog({ eventName: 'GiftCreated', giftId: 2n, blockNumber: 102n }), removed: true },
          ]
        : []
    },
  }

  const logs = await queryLogsInChunks({
    client,
    event: giftLifecycleEvents.created,
    fromBlock: 100n,
    toBlock: 124n,
    chunkSize: 10n,
    retryDelayMs: 0,
  })

  assert.deepEqual(calls, [[100n, 109n], [110n, 119n], [120n, 124n]])
  assert.equal(logs.length, 1)
  assert.equal(logs[0].args.giftId, 1n)
})

test('deduplicates re-delivered logs and sorts by canonical log position', () => {
  const older = lifecycleLog({ eventName: 'GiftCreated', giftId: 1n, blockNumber: 10n })
  const newer = lifecycleLog({ eventName: 'GiftClaimed', giftId: 1n, blockNumber: 11n })
  assert.deepEqual(dedupeAndSortGiftEvents([older, newer, older]), [newer, older])
  assert.deepEqual(dedupeAndSortGiftEvents([newer, older], 'asc'), [older, newer])
})

test('builds sent, received, and imported records from direct chain reads', async () => {
  const created = lifecycleLog({
    eventName: 'GiftCreated',
    giftId: 7n,
    blockNumber: GIFT_VAULT_DEPLOYMENT_BLOCK + 1n,
    args: {
      sender: account,
      asset,
      principal: 5n,
      fee: 1n,
      unlockAt: 100,
      expiresAt: 500,
      secretHash: `0x${'11'.repeat(32)}`,
      claimCodeRequired: false,
    },
  })
  const claimed = lifecycleLog({
    eventName: 'GiftClaimed',
    giftId: 8n,
    blockNumber: GIFT_VAULT_DEPLOYMENT_BLOCK + 3n,
    args: { recipient: account, principal: 9n },
  })
  const importedCreated = lifecycleLog({
    eventName: 'GiftCreated',
    giftId: 9n,
    blockNumber: GIFT_VAULT_DEPLOYMENT_BLOCK + 2n,
    args: {
      sender: other,
      asset,
      principal: 3n,
      fee: 1n,
      unlockAt: 100,
      expiresAt: 500,
      secretHash: `0x${'22'.repeat(32)}`,
      claimCodeRequired: true,
    },
  })
  const allLogs = [created, claimed, importedCreated]

  const client = {
    async getBlockNumber() {
      return GIFT_VAULT_DEPLOYMENT_BLOCK + 10n
    },
    async getLogs({ event, args }) {
      return allLogs.filter((log) => {
        if (log.eventName !== event.name) return false
        if (args.sender) return log.args.sender?.toLowerCase() === args.sender.toLowerCase()
        if (args.recipient) return log.args.recipient?.toLowerCase() === args.recipient.toLowerCase()
        if (args.giftId) return args.giftId.includes(log.args.giftId)
        return true
      })
    },
    async multicall({ contracts }) {
      return contracts.map(({ args: [giftId] }) => ({
        status: 'success',
        result: {
          sender: giftId === 7n ? account : other,
          asset,
          principal: giftId,
          createdAt: 100,
          unlockAt: 100,
          expiresAt: 500,
          status: giftId === 8n ? 2 : 1,
          secretHash: `0x${'11'.repeat(32)}`,
          claimCodeHash: `0x${'00'.repeat(32)}`,
        },
      }))
    },
  }

  const history = await fetchWalletGiftHistory({
    client,
    walletAddress: account,
    knownGiftIds: [9n, 9n],
    nowSeconds: 200,
    chunkSize: 100n,
    retryDelayMs: 0,
  })

  assert.deepEqual(history.records.map(({ giftId }) => giftId), [8n, 9n, 7n])
  assert.deepEqual(history.sent.map(({ giftId }) => giftId), [7n])
  assert.deepEqual(history.received.map(({ giftId }) => giftId), [8n])
  assert.deepEqual(history.imported.map(({ giftId }) => giftId), [9n])
  assert.equal(history.records.find(({ giftId }) => giftId === 8n).displayStatusKey, 'claimed')
  assert.equal(history.indexedFromBlock, GIFT_VAULT_DEPLOYMENT_BLOCK)
})
