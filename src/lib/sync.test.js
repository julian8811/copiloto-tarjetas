import { describe, it, expect } from 'vitest'
import { mergeById, mergeDismissed, idsRemoved, snapshotIds } from './sync.js'

describe('mergeById', () => {
  it('combines unique ids from both lists', () => {
    const remote = [{ id: 'a', updatedAt: '2026-01-01' }]
    const local = [{ id: 'b', updatedAt: '2026-01-02' }]
    expect(mergeById(remote, local).map(x => x.id).sort()).toEqual(['a', 'b'])
  })

  it('prefers newer updatedAt on conflict', () => {
    const remote = [{ id: 'a', limit: 100, updatedAt: '2026-01-01T00:00:00Z' }]
    const local = [{ id: 'a', limit: 200, updatedAt: '2026-06-01T00:00:00Z' }]
    expect(mergeById(remote, local)[0].limit).toBe(200)
  })
})

describe('mergeDismissed', () => {
  it('unions alert ids', () => {
    expect(mergeDismissed(['a', 'b'], ['b', 'c']).sort()).toEqual(['a', 'b', 'c'])
  })
})

describe('idsRemoved', () => {
  it('returns ids no longer present', () => {
    expect(idsRemoved(['a', 'b', 'c'], ['b'])).toEqual(['a', 'c'])
  })
})

describe('snapshotIds', () => {
  it('extracts id lists', () => {
    const snap = snapshotIds([{ id: 'c1' }], [{ id: 't1' }], ['al1'])
    expect(snap).toEqual({ cards: ['c1'], txns: ['t1'], disIds: ['al1'] })
  })
})
