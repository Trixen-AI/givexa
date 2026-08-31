import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DISPLAY_GIFT_STATUS,
  deriveGiftDisplayStatus,
  giftStatusKey,
} from '../src/web3/giftStatus.js'

const activeGift = {
  status: 1,
  unlockAt: 1_000,
  expiresAt: 2_000,
}

test('derives scheduled, active, and expired display states at exact boundaries', () => {
  assert.equal(deriveGiftDisplayStatus(activeGift, 999), DISPLAY_GIFT_STATUS.SCHEDULED)
  assert.equal(deriveGiftDisplayStatus(activeGift, 1_000), DISPLAY_GIFT_STATUS.ACTIVE)
  assert.equal(deriveGiftDisplayStatus(activeGift, 1_999), DISPLAY_GIFT_STATUS.ACTIVE)
  assert.equal(deriveGiftDisplayStatus(activeGift, 2_000), DISPLAY_GIFT_STATUS.EXPIRED)
})

test('terminal stored states take precedence over timestamps', () => {
  assert.equal(deriveGiftDisplayStatus({ ...activeGift, status: 2 }, 999), DISPLAY_GIFT_STATUS.CLAIMED)
  assert.equal(deriveGiftDisplayStatus({ ...activeGift, status: 3 }, 999), DISPLAY_GIFT_STATUS.CANCELLED)
  assert.equal(deriveGiftDisplayStatus({ ...activeGift, status: 4 }, 999), DISPLAY_GIFT_STATUS.RECOVERED)
  assert.equal(giftStatusKey(DISPLAY_GIFT_STATUS.RECOVERED), 'recovered')
})

test('rejects malformed gift status input', () => {
  assert.throws(() => deriveGiftDisplayStatus(null), /gift is required/u)
  assert.throws(() => deriveGiftDisplayStatus({ ...activeGift, status: 99 }), /not recognized/u)
  assert.throws(() => deriveGiftDisplayStatus({ ...activeGift, unlockAt: -1 }), /non-negative/u)
})
