import assert from 'node:assert/strict'
import test from 'node:test'
import {
  belongsToDashboardView,
  dashboardAssetMatches,
  dashboardStatusMatches,
  summarizeGiftHistory,
} from '../src/features/dashboard/dashboardModel.js'

const asset = '0x1111111111111111111111111111111111111111'
const sentActive = { roles: { sent: true, received: false, imported: false }, displayStatusKey: 'active', gift: { asset } }
const sentScheduled = { roles: { sent: true, received: false, imported: false }, displayStatusKey: 'scheduled', gift: { asset } }
const receivedClaimed = { roles: { sent: false, received: true, imported: false }, displayStatusKey: 'claimed', gift: { asset } }
const importedExpired = { roles: { sent: false, received: false, imported: true }, displayStatusKey: 'expired', gift: { asset } }

test('filters dashboard records by relationship without inventing pending recipients', () => {
  assert.equal(belongsToDashboardView(sentActive, 'sent'), true)
  assert.equal(belongsToDashboardView(sentActive, 'received'), false)
  assert.equal(belongsToDashboardView(receivedClaimed, 'received'), true)
  assert.equal(belongsToDashboardView(importedExpired, 'all'), true)
  assert.throws(() => belongsToDashboardView(sentActive, 'unknown'), /not recognized/u)
})

test('filters pending and terminal lifecycle states', () => {
  assert.equal(dashboardStatusMatches(sentActive, 'pending'), true)
  assert.equal(dashboardStatusMatches(sentScheduled, 'pending'), true)
  assert.equal(dashboardStatusMatches(receivedClaimed, 'pending'), false)
  assert.equal(dashboardStatusMatches(receivedClaimed, 'complete'), true)
  assert.equal(dashboardStatusMatches(importedExpired, 'expired'), true)
})

test('matches assets case-insensitively and summarizes wallet history', () => {
  assert.equal(dashboardAssetMatches(sentActive, asset.toUpperCase()), true)
  assert.equal(dashboardAssetMatches(sentActive, 'all'), true)
  assert.deepEqual(summarizeGiftHistory({
    sent: [sentActive, sentScheduled],
    received: [receivedClaimed],
    records: [sentActive, sentScheduled, receivedClaimed, importedExpired],
  }), { sent: 2, received: 1, pending: 2, scheduled: 1, completed: 1 })
})

