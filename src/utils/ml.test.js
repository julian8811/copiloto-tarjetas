import { describe, it, expect } from 'vitest'
import { ML } from './ml.js'

const sampleCards = [
  { id: 'c1', limit: 10000000, cutDay: 22, payDay: 7 },
  { id: 'c2', limit: 5000000, cutDay: 15, payDay: 28 },
]

const sampleTxns = [
  { id: 't1', cardId: 'c1', amount: 3000000, cat: 'Restaurantes', date: '2026-06-01' },
  { id: 't2', cardId: 'c2', amount: 1000000, cat: 'Supermercado', date: '2026-06-05' },
]

describe('ML.linReg', () => {
  it('calculates slope for increasing values', () => {
    const { slope } = ML.linReg([100, 200, 300])
    expect(slope).toBeGreaterThan(0)
  })

  it('handles single point', () => {
    const { slope, intercept } = ML.linReg([500])
    expect(slope).toBe(0)
    expect(intercept).toBe(500)
  })
})

describe('ML.health', () => {
  it('returns 50 for empty cards', () => {
    expect(ML.health([], [])).toBe(50)
  })

  it('returns score between 0 and 100', () => {
    const score = ML.health(sampleCards, sampleTxns)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })
})

describe('ML.riskMin', () => {
  it('returns 0 for no cards', () => {
    expect(ML.riskMin([], [])).toBe(0)
  })

  it('increases with utilization', () => {
    const low = ML.riskMin(sampleCards, [{ cardId: 'c1', amount: 500000 }])
    const high = ML.riskMin(sampleCards, [{ cardId: 'c1', amount: 8000000 }])
    expect(high).toBeGreaterThan(low)
  })
})

describe('ML.predictEnd', () => {
  it('returns a non-negative number', () => {
    expect(ML.predictEnd(sampleTxns)).toBeGreaterThanOrEqual(0)
  })
})

describe('ML.monthlyData', () => {
  it('returns month labels without throwing', () => {
    const data = ML.monthlyData(sampleTxns, 3)
    expect(data).toHaveLength(3)
    expect(data[0]).toHaveProperty('mes')
    expect(typeof data[0].mes).toBe('string')
  })
})
