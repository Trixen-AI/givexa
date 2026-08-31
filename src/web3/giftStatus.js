export const STORED_GIFT_STATUS = Object.freeze({
  NONE: 0,
  ACTIVE: 1,
  CLAIMED: 2,
  CANCELLED: 3,
  RECOVERED: 4,
})

export const DISPLAY_GIFT_STATUS = Object.freeze({
  NONEXISTENT: 0,
  SCHEDULED: 1,
  ACTIVE: 2,
  EXPIRED: 3,
  CLAIMED: 4,
  CANCELLED: 5,
  RECOVERED: 6,
})

export const DISPLAY_GIFT_STATUS_KEYS = Object.freeze([
  'nonexistent',
  'scheduled',
  'active',
  'expired',
  'claimed',
  'cancelled',
  'recovered',
])

function toSafeNumber(value, fieldName) {
  const parsed = typeof value === 'bigint' ? Number(value) : Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new TypeError(`${fieldName} must be a non-negative safe integer`)
  }
  return parsed
}

export function giftStatusKey(displayStatus) {
  const status = toSafeNumber(displayStatus, 'displayStatus')
  return DISPLAY_GIFT_STATUS_KEYS[status] ?? 'unknown'
}

export function deriveGiftDisplayStatus(gift, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!gift || typeof gift !== 'object') throw new TypeError('gift is required')

  const storedStatus = toSafeNumber(gift.status, 'gift.status')
  if (storedStatus === STORED_GIFT_STATUS.NONE) return DISPLAY_GIFT_STATUS.NONEXISTENT
  if (storedStatus === STORED_GIFT_STATUS.CLAIMED) return DISPLAY_GIFT_STATUS.CLAIMED
  if (storedStatus === STORED_GIFT_STATUS.CANCELLED) return DISPLAY_GIFT_STATUS.CANCELLED
  if (storedStatus === STORED_GIFT_STATUS.RECOVERED) return DISPLAY_GIFT_STATUS.RECOVERED
  if (storedStatus !== STORED_GIFT_STATUS.ACTIVE) throw new RangeError('gift.status is not recognized')

  const now = toSafeNumber(nowSeconds, 'nowSeconds')
  const unlockAt = toSafeNumber(gift.unlockAt, 'gift.unlockAt')
  const expiresAt = toSafeNumber(gift.expiresAt, 'gift.expiresAt')

  if (now < unlockAt) return DISPLAY_GIFT_STATUS.SCHEDULED
  if (now >= expiresAt) return DISPLAY_GIFT_STATUS.EXPIRED
  return DISPLAY_GIFT_STATUS.ACTIVE
}

export function decorateGiftStatus(gift, nowSeconds) {
  const displayStatus = deriveGiftDisplayStatus(gift, nowSeconds)
  return {
    ...gift,
    displayStatus,
    displayStatusKey: giftStatusKey(displayStatus),
  }
}
