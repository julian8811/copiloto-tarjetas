import { describe, it, expect } from 'vitest'
import { genAlerts } from './alerts.js'

describe('genAlerts', () => {
  it('returns success alert when finances are healthy', () => {
    const cards = [{ id: 'c1', bank: 'Test', franchise: 'Visa', last4: '1234', limit: 10000000, cutDay: 25, payDay: 28 }]
    const txns = [{ id: 't1', cardId: 'c1', amount: 100000, cat: 'Otros', date: '2026-06-01' }]
    const alerts = genAlerts(cards, txns)
    expect(alerts.some(a => a.id === 'ok')).toBe(true)
  })

  it('generates high utilization alert', () => {
    const cards = [{ id: 'c1', bank: 'Test', franchise: 'Visa', last4: '1234', limit: 1000000, cutDay: 25, payDay: 20 }]
    const txns = [{ id: 't1', cardId: 'c1', amount: 900000, cat: 'Otros', date: '2026-06-01' }]
    const alerts = genAlerts(cards, txns)
    expect(alerts.some(a => a.id.startsWith('u3-') || a.id.startsWith('u2-'))).toBe(true)
  })

  it('returns empty-state friendly alert for no cards', () => {
    const alerts = genAlerts([], [])
    expect(alerts.length).toBeGreaterThan(0)
    expect(alerts[0].id).toBe('ok')
  })
})
