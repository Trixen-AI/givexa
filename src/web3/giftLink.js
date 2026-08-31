import { isHex, size } from 'viem'

const CLAIM_FRAGMENT_KEY = 'gvx'
const CLAIM_LINK_VERSION = 1
const CLAIM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const MAX_FRAGMENT_LENGTH = 4096

function bytesToBase64Url(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '')
}

function base64UrlToBytes(value) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

export function generateSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`
}

export function generateClaimCode(length = 8) {
  const output = []
  while (output.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length))
    for (const byte of bytes) {
      if (byte >= 224) continue
      output.push(CLAIM_CODE_ALPHABET[byte % CLAIM_CODE_ALPHABET.length])
      if (output.length === length) break
    }
  }
  return output.join('')
}

export function buildClaimUrl({ giftId, secret, senderName = '', message = '', protectedGift = false, baseUrl: suppliedBaseUrl = '' }) {
  if (!isHex(secret) || size(secret) !== 32) throw new Error('A valid 32-byte gift secret is required.')
  const runtimeOrigin = typeof window === 'undefined' ? '' : window.location.origin
  const baseUrl = (suppliedBaseUrl || import.meta.env?.VITE_PUBLIC_APP_URL || runtimeOrigin).replace(/\/$/u, '')
  if (!baseUrl) throw new Error('A public application URL is required.')
  const payload = {
    v: CLAIM_LINK_VERSION,
    id: String(giftId),
    s: secret,
    n: senderName.trim().slice(0, 60),
    m: message.trim().slice(0, 240),
    p: Boolean(protectedGift),
  }
  const encoded = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)))
  return `${baseUrl}/claim/${giftId}#${CLAIM_FRAGMENT_KEY}=${encoded}`
}

export function readClaimPayload(hash = typeof window === 'undefined' ? '' : window.location.hash) {
  if (!hash || hash.length > MAX_FRAGMENT_LENGTH) return null
  try {
    const params = new URLSearchParams(hash.slice(1))
    const encoded = params.get(CLAIM_FRAGMENT_KEY)
    if (!encoded) return null
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(encoded)))
    if (
      payload?.v !== CLAIM_LINK_VERSION ||
      !/^\d+$/u.test(payload.id) ||
      !isHex(payload.s) ||
      size(payload.s) !== 32
    ) return null
    return {
      giftId: BigInt(payload.id),
      secret: payload.s,
      senderName: typeof payload.n === 'string' ? payload.n.slice(0, 60) : '',
      message: typeof payload.m === 'string' ? payload.m.slice(0, 240) : '',
      protectedGift: Boolean(payload.p),
    }
  } catch {
    return null
  }
}
