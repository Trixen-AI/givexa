import assert from 'node:assert/strict'
import test from 'node:test'
import { isAddress, isHex, size } from 'viem'
import { SUPPORTED_ASSETS } from '../src/config/deployment.js'
import { buildClaimUrl, generateClaimCode, generateSecret, readClaimPayload } from '../src/web3/giftLink.js'

test('generates a cryptographically sized bearer secret', () => {
  const secret = generateSecret()
  assert.equal(isHex(secret), true)
  assert.equal(size(secret), 32)
  assert.notEqual(secret, generateSecret())
})

test('generates unambiguous claim codes', () => {
  for (let index = 0; index < 100; index += 1) {
    assert.match(generateClaimCode(), /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/u)
  }
})

test('round trips private claim metadata through the URL fragment', () => {
  const secret = generateSecret()
  const url = new URL(buildClaimUrl({
    giftId: 42n,
    secret,
    senderName: 'Arman',
    message: 'For your next milestone',
    protectedGift: true,
    baseUrl: 'https://givexa.xyz/',
  }))
  assert.equal(url.pathname, '/claim/42')
  assert.equal(url.search, '')
  const payload = readClaimPayload(url.hash)
  assert.deepEqual(payload, {
    giftId: 42n,
    secret,
    senderName: 'Arman',
    message: 'For your next milestone',
    protectedGift: true,
  })
})

test('rejects malformed and oversized fragments', () => {
  assert.equal(readClaimPayload('#gvx=not-json'), null)
  assert.equal(readClaimPayload(`#gvx=${'a'.repeat(5000)}`), null)
  assert.equal(readClaimPayload(''), null)
})

test('ships ten unique valid canonical asset addresses', () => {
  assert.equal(SUPPORTED_ASSETS.length, 10)
  assert.equal(new Set(SUPPORTED_ASSETS.map(({ address }) => address.toLowerCase())).size, 10)
  for (const { address } of SUPPORTED_ASSETS) assert.equal(isAddress(address), true)
})
