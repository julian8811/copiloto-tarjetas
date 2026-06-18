/** @typedef {'idle'|'syncing'|'synced'|'error'} SyncStatus */

export function itemTimestamp(item) {
  const t = item?.updatedAt || item?.date || item?.createdAt
  return t ? new Date(t).getTime() : 0
}

/** Merge two lists by id; newer updatedAt wins. */
export function mergeById(remote = [], local = []) {
  const map = new Map()
  for (const item of remote) map.set(item.id, item)
  for (const item of local) {
    const existing = map.get(item.id)
    if (!existing || itemTimestamp(item) >= itemTimestamp(existing)) {
      map.set(item.id, item)
    }
  }
  return [...map.values()]
}

/** Union of dismissed alert ids. */
export function mergeDismissed(remote = [], local = []) {
  return [...new Set([...remote, ...local])]
}

export function idsRemoved(previousIds = [], currentIds = []) {
  const current = new Set(currentIds)
  return previousIds.filter(id => !current.has(id))
}

export function snapshotIds(cards = [], txns = [], disIds = []) {
  return {
    cards: cards.map(c => c.id),
    txns: txns.map(t => t.id),
    disIds: [...disIds],
  }
}
