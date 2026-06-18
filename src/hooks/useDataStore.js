import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase.js'
import { SEED } from '../data/seed.js'
import { mergeById, mergeDismissed, idsRemoved, snapshotIds } from '../lib/sync.js'

const ARRAY_KEYS = new Set(['cfv6_cards', 'cfv6_txns', 'cfv6_dis'])

function asArray(value, fallback = []) {
  return Array.isArray(value) ? value : fallback
}

function readLocalArray(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    return asArray(JSON.parse(raw))
  } catch {
    return []
  }
}

function useLocalStore(key, init) {
  const isArrayKey = ARRAY_KEYS.has(key)
  const [val, set] = useState(() => (isArrayKey ? asArray(init) : init))
  const valRef = useRef(val)
  const [rdy, setRdy] = useState(false)

  useEffect(() => {
    valRef.current = val
  }, [val])

  useEffect(() => {
    ;(async () => {
      try {
        const r = await window.storage.get(key)
        if (r?.value) {
          const parsed = JSON.parse(r.value)
          const next = isArrayKey ? asArray(parsed, []) : parsed
          valRef.current = next
          set(next)
        }
      } catch {}
      setRdy(true)
    })()
  }, [key, isArrayKey])

  const save = useCallback(async (v) => {
    const nvRaw = typeof v === 'function' ? v(valRef.current) : v
    const nv = isArrayKey ? asArray(nvRaw, []) : nvRaw
    valRef.current = nv
    set(nv)
    try {
      await window.storage.set(key, JSON.stringify(nv))
    } catch {}
    return nv
  }, [key, isArrayKey])

  return [val, save, rdy]
}

function cardToDb(c, userId) {
  return {
    id: c.id,
    user_id: userId,
    bank: c.bank,
    franchise: c.franchise,
    name: c.name || c.franchise,
    last4: c.last4,
    limit_amount: c.limit,
    theme: c.theme || 'teal',
    cut_day: c.cutDay,
    pay_day: c.payDay,
    holder: c.holder || '',
    updated_at: c.updatedAt || new Date().toISOString(),
  }
}

function cardFromDb(r) {
  return {
    id: r.id,
    bank: r.bank,
    franchise: r.franchise,
    name: r.name,
    last4: r.last4,
    limit: Number(r.limit_amount) || 0,
    theme: r.theme || 'teal',
    cutDay: r.cut_day ?? 22,
    payDay: r.pay_day ?? 7,
    holder: r.holder || '',
    updatedAt: r.updated_at,
  }
}

function txnToDb(t, userId) {
  return {
    id: t.id,
    user_id: userId,
    card_id: t.cardId,
    name: t.name,
    cat: t.cat,
    amount: t.amount,
    date: t.date,
    cuotas: t.cuotas || 1,
    cuota_num: t.cuotaNum || 1,
    note: t.note || '',
  }
}

function txnFromDb(r) {
  return {
    id: r.id,
    cardId: r.card_id,
    name: r.name,
    cat: r.cat,
    amount: Number(r.amount) || 0,
    date: r.date,
    cuotas: r.cuotas ?? 1,
    cuotaNum: r.cuota_num ?? 1,
    note: r.note || '',
    updatedAt: r.created_at,
  }
}

function stampCards(cards) {
  const now = new Date().toISOString()
  return cards.map(c => ({ ...c, updatedAt: c.updatedAt || now }))
}

async function syncIncrementalToSupabase(userId, cards, txns, disIds, prevIds) {
  if (!supabase) return

  const stampedCards = stampCards(cards)

  if (stampedCards.length) {
    const { error } = await supabase
      .from('cards')
      .upsert(stampedCards.map(c => cardToDb(c, userId)), { onConflict: 'id' })
    if (error) throw error
  }

  const removedCards = idsRemoved(prevIds?.cards || [], stampedCards.map(c => c.id))
  if (removedCards.length) {
    const { error } = await supabase.from('cards').delete().in('id', removedCards).eq('user_id', userId)
    if (error) throw error
  }

  if (txns.length) {
    const { error } = await supabase
      .from('transactions')
      .upsert(txns.map(t => txnToDb(t, userId)), { onConflict: 'id' })
    if (error) throw error
  }

  const removedTxns = idsRemoved(prevIds?.txns || [], txns.map(t => t.id))
  if (removedTxns.length) {
    const { error } = await supabase.from('transactions').delete().in('id', removedTxns).eq('user_id', userId)
    if (error) throw error
  }

  if (disIds.length) {
    const { error } = await supabase
      .from('dismissed_alerts')
      .upsert(disIds.map(alert_id => ({ user_id: userId, alert_id })), { onConflict: 'user_id,alert_id' })
    if (error) throw error
  }

  const removedDis = idsRemoved(prevIds?.disIds || [], disIds)
  if (removedDis.length) {
    const { error } = await supabase
      .from('dismissed_alerts')
      .delete()
      .eq('user_id', userId)
      .in('alert_id', removedDis)
    if (error) throw error
  }
}

async function loadFromSupabase(userId) {
  const [cardsRes, txnsRes, disRes] = await Promise.all([
    supabase.from('cards').select('*').eq('user_id', userId),
    supabase.from('transactions').select('*').eq('user_id', userId),
    supabase.from('dismissed_alerts').select('alert_id').eq('user_id', userId),
  ])

  if (cardsRes.error) throw cardsRes.error
  if (txnsRes.error) throw txnsRes.error
  if (disRes.error) throw disRes.error

  const cards = (cardsRes.data || []).map(cardFromDb)
  const txns = (txnsRes.data || []).map(txnFromDb)
  const disIds = (disRes.data || []).map(r => r.alert_id)

  return { cards, txns, disIds, remoteIds: snapshotIds(cards, txns, disIds) }
}

export function useDataStore(user) {
  const [cards, setCardsLocal, cardsReady] = useLocalStore('cfv6_cards', [])
  const [txns, setTxnsLocal, txnsReady] = useLocalStore('cfv6_txns', [])
  const [disIds, setDisIdsLocal, disReady] = useLocalStore('cfv6_dis', [])
  const [cloudReady, setCloudReady] = useState(!user)
  const [syncStatus, setSyncStatus] = useState(user ? 'syncing' : 'idle')
  const [syncError, setSyncError] = useState(null)

  const syncingRef = useRef(false)
  const skipSyncRef = useRef(false)
  const remoteIdsRef = useRef({ cards: [], txns: [], disIds: [] })
  const userIdRef = useRef(user?.id)

  const ready = cardsReady && txnsReady && disReady && cloudReady

  useEffect(() => {
    userIdRef.current = user?.id
  }, [user?.id])

  useEffect(() => {
    if (!user?.id || !supabase) {
      setCloudReady(true)
      setSyncStatus('idle')
      setSyncError(null)
      return
    }

    let cancelled = false
    setCloudReady(false)
    setSyncStatus('syncing')
    setSyncError(null)

    ;(async () => {
      const userId = user.id
      try {
        const remote = await loadFromSupabase(userId)
        if (cancelled || userIdRef.current !== userId) return

        const localCards = readLocalArray('cfv6_cards')
        const localTxns = readLocalArray('cfv6_txns')
        const localDis = readLocalArray('cfv6_dis')
        const hasLocal = localCards.length > 0 || localTxns.length > 0
        const hasRemote = remote.cards.length > 0 || remote.txns.length > 0

        skipSyncRef.current = true

        let mergedCards = remote.cards
        let mergedTxns = remote.txns
        let mergedDis = remote.disIds

        if (hasLocal && hasRemote) {
          mergedCards = mergeById(remote.cards, localCards)
          mergedTxns = mergeById(remote.txns, localTxns)
          mergedDis = mergeDismissed(remote.disIds, localDis)
        } else if (hasLocal && !hasRemote) {
          mergedCards = localCards
          mergedTxns = localTxns
          mergedDis = localDis
        }

        await setCardsLocal(mergedCards)
        await setTxnsLocal(mergedTxns)
        await setDisIdsLocal(mergedDis)

        if (cancelled || userIdRef.current !== userId) return

        remoteIdsRef.current = snapshotIds(mergedCards, mergedTxns, mergedDis)
        await syncIncrementalToSupabase(userId, mergedCards, mergedTxns, mergedDis, remote.remoteIds)

        if (!cancelled && userIdRef.current === userId) {
          setSyncStatus('synced')
          setSyncError(null)
        }
      } catch (err) {
        console.error('Error cargando datos de Supabase:', err)
        if (!cancelled && userIdRef.current === userId) {
          setSyncStatus('error')
          setSyncError(err.message || 'Error de sincronización')
        }
      } finally {
        if (!cancelled && userIdRef.current === userId) {
          setCloudReady(true)
        }
        skipSyncRef.current = false
      }
    })()

    return () => { cancelled = true }
  }, [user?.id])

  const syncToCloud = useCallback(async (nextCards, nextTxns, nextDis) => {
    if (!user?.id || !supabase || skipSyncRef.current || syncingRef.current) return

    syncingRef.current = true
    setSyncStatus('syncing')
    setSyncError(null)

    const prevIds = remoteIdsRef.current
    const safeCards = asArray(nextCards)
    const safeTxns = asArray(nextTxns)
    const safeDis = asArray(nextDis)

    try {
      await syncIncrementalToSupabase(user.id, safeCards, safeTxns, safeDis, prevIds)
      remoteIdsRef.current = snapshotIds(safeCards, safeTxns, safeDis)
      setSyncStatus('synced')
    } catch (err) {
      console.error('Error sincronizando con Supabase:', err)
      setSyncStatus('error')
      setSyncError(err.message || 'Error de sincronización')
    } finally {
      syncingRef.current = false
    }
  }, [user?.id])

  const setCards = useCallback(async (v) => {
    const next = await setCardsLocal(v)
    await syncToCloud(next, readLocalArray('cfv6_txns'), readLocalArray('cfv6_dis'))
    return next
  }, [setCardsLocal, syncToCloud])

  const setTxns = useCallback(async (v) => {
    const next = await setTxnsLocal(v)
    await syncToCloud(readLocalArray('cfv6_cards'), next, readLocalArray('cfv6_dis'))
    return next
  }, [setTxnsLocal, syncToCloud])

  const setDisIds = useCallback(async (v) => {
    const next = await setDisIdsLocal(v)
    await syncToCloud(readLocalArray('cfv6_cards'), readLocalArray('cfv6_txns'), next)
    return next
  }, [setDisIdsLocal, syncToCloud])

  const loadDemo = useCallback(async () => {
    skipSyncRef.current = true
    const demoCards = stampCards(SEED.cards)
    await setCardsLocal(demoCards)
    await setTxnsLocal(SEED.txns)
    skipSyncRef.current = false
    if (user?.id && supabase) {
      await syncToCloud(demoCards, SEED.txns, readLocalArray('cfv6_dis'))
    }
  }, [setCardsLocal, setTxnsLocal, user?.id, syncToCloud])

  return {
    cards: asArray(cards),
    setCards,
    txns: asArray(txns),
    setTxns,
    disIds: asArray(disIds),
    setDisIds,
    ready,
    loadDemo,
    syncStatus,
    syncError,
  }
}
