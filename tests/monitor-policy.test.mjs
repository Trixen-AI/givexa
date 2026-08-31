import assert from 'node:assert/strict'
import test from 'node:test'
import {
  MonitorReport,
  expectedProvenanceHash,
  hasRuntimeCode,
  isTwoOfThreeSafe,
  sameAddress,
  toJsonSafe,
} from '../scripts/lib/monitor-policy.mjs'

const ownerOne = '0x1111111111111111111111111111111111111111'
const ownerTwo = '0x2222222222222222222222222222222222222222'
const ownerThree = '0x3333333333333333333333333333333333333333'

test('validates exact 2-of-3 Safe posture with unique owners', () => {
  assert.equal(isTwoOfThreeSafe(2n, [ownerOne, ownerTwo, ownerThree]), true)
  assert.equal(isTwoOfThreeSafe(1n, [ownerOne, ownerTwo, ownerThree]), false)
  assert.equal(isTwoOfThreeSafe(2n, [ownerOne, ownerOne, ownerThree]), false)
  assert.equal(isTwoOfThreeSafe(2n, [ownerOne, ownerTwo]), false)
})

test('compares checksummed addresses and rejects missing runtime code', () => {
  assert.equal(sameAddress(ownerOne, ownerOne.toUpperCase().replace('0X', '0x')), true)
  assert.equal(sameAddress(ownerOne, ownerTwo), false)
  assert.equal(hasRuntimeCode('0x6001600055'), true)
  assert.equal(hasRuntimeCode('0x'), false)
  assert.equal(hasRuntimeCode(undefined), false)
})

test('derives deterministic provenance and JSON-safe monitor output', () => {
  const parameters = {
    manifestHash: `0x${'ab'.repeat(32)}`,
    chainId: 4663,
    asset: ownerOne,
    symbol: 'NVDA',
  }
  const first = expectedProvenanceHash(parameters)
  assert.match(first, /^0x[0-9a-f]{64}$/u)
  assert.equal(expectedProvenanceHash(parameters), first)
  assert.deepEqual(toJsonSafe({ block: 50_224_086n, nested: [2n] }), { block: '50224086', nested: ['2'] })
})

test('monitor report fails closed and summarizes every check', () => {
  const report = new MonitorReport()
  report.check('safe.threshold', true, { expected: 2, actual: 2 })
  report.check('vault.owner', false, { expected: ownerOne, actual: ownerTwo })
  report.info('network.block', 50_224_086n)
  assert.deepEqual(report.summary(), { passed: 1, failed: 1, informational: 1, total: 3 })
  assert.equal(report.failed[0].id, 'vault.owner')
})

