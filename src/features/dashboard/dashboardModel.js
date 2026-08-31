export const TERMINAL_GIFT_STATUSES = new Set(['claimed', 'cancelled', 'recovered'])

export function belongsToDashboardView(record, view) {
  if (view === 'sent') return Boolean(record.roles.sent)
  if (view === 'received') return Boolean(record.roles.received)
  if (view !== 'all') throw new RangeError('view is not recognized')
  return Boolean(record.roles.sent || record.roles.received || record.roles.imported)
}

export function dashboardStatusMatches(record, filter) {
  if (filter === 'all') return true
  if (filter === 'pending') return Boolean(record.roles.sent) && ['scheduled', 'active'].includes(record.displayStatusKey)
  if (filter === 'complete') return TERMINAL_GIFT_STATUSES.has(record.displayStatusKey)
  return record.displayStatusKey === filter
}

export function dashboardAssetMatches(record, filter) {
  if (filter === 'all') return true
  return record.gift?.asset?.toLowerCase() === filter.toLowerCase()
}

export function summarizeGiftHistory(history) {
  return {
    sent: history.sent.length,
    received: history.received.length,
    pending: history.sent.filter(({ displayStatusKey }) => ['scheduled', 'active'].includes(displayStatusKey)).length,
    scheduled: history.sent.filter(({ displayStatusKey }) => displayStatusKey === 'scheduled').length,
    completed: history.records.filter(({ displayStatusKey }) => TERMINAL_GIFT_STATUSES.has(displayStatusKey)).length,
  }
}

