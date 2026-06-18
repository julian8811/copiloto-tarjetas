import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase.js'
import { SEED } from '../data/seed.js'
import { mergeById, mergeDismissed, idsRemoved, snapshotIds } from '../lib/sync.js'

function useLocalStore(key, init) {
  const [val, set] = useState(init)
  const [rdy, setRdy] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const r = await window.storage.get(key)
        if (r?.value) set(JSON.parse(r.value))
      } catch {}
      setRdy(true)
    })()
  }, [key])

  const save = useCallback(async (v) => {
    const nv = typeof v === 'function' ? v(val) : v
    set(nv)
    try {
      await window.storage.set(key, JSON.stringify(nv))
    } catch {}
    return nv
  }, [key, val])

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
    limit: Number(r.limit_amount),
    theme: r.theme,
    cutDay: r.cut_day,
    payDay: r.pay_day,
    holder: r.holder,
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
    amount: Number(r.amount),
    date: r.date,
    cuotas: r.cuotas,
    cuotaNum: r.cuota_num,
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

  const ready = cardsReady && txnsReady && disReady && cloudReady

  useEffect(() => {
    if (!user || !supabase) {
      setCloudReady(true)
      setSyncStatus('idle')
      return
    }

    let cancelled = false
    setSyncStatus('syncing')
    setSyncError(null)

    ;(async () => {
      try {
        const remote = await loadFromSupabase(user.id)
        if (cancelled) return

        const localCards = JSON.parse(localStorage.getItem('cfv6_cards') || '[]')
        const localTxns = JSON.parse(localStorage.getItem('cfv6_txns') || '[]')
        const localDis = JSON.parse(localStorage.getItem('cfv6_dis') || '[]')
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

        remoteIdsRef.current = snapshotIds(mergedCards, mergedTxns, mergedDis)
        await syncIncrementalToSupabase(user.id, mergedCards, mergedTxns, mergedDis, remote.remoteIds)

        if (!cancelled) {
          setSyncStatus('synced')
          setSyncError(null)
        }
      } catch (err) {
        console.error('Error cargando datos de Supabase:', err)
        if (!cancelled) {
          setSyncStatus('error')
          setSyncError(err.message || 'Error de sincronización')
        }
      } finally {
        if (!cancelled) setCloudReady(true)
        skipSyncRef.current = false
      }
    })()

    return () => { cancelled = true }
  }, [user?.id, setCardsLocal, setTxnsLocal, setDisIdsLocal])

  const syncToCloud = useCallback(async (nextCards, nextTxns, nextDis) => {
    if (!user || !supabase || skipSyncRef.current || syncingRef.current) return

    syncingRef.current = true
    setSyncStatus('syncing')
    setSyncError(null)

    const prevIds = remoteIdsRef.current
    try {
      await syncIncrementalToSupabase(user.id, nextCards, nextTxns, nextDis, prevIds)
      remoteIdsRef.current = snapshotIds(nextCards, nextTxns, nextDis)
      setSyncStatus('synced')
    } catch (err) {
      console.error('Error sincronizando con Supabase:', err)
      setSyncStatus('error')
      setSyncError(err.message || 'Error de sincronización')
    } finally {
      syncingRef.current = false
    }
  }, [user])

  const setCards = useCallback(async (v) => {
    const next = await setCardsLocal(v)
    const currentTxns = JSON.parse(localStorage.getItem('cfv6_txns') || '[]')
    const currentDis = JSON.parse(localStorage.getItem('cfv6_dis') || '[]')
    await syncToCloud(next, currentTxns, currentDis)
    return next
  }, [setCardsLocal, syncToCloud])

  const setTxns = useCallback(async (v) => {
    const next = await setTxnsLocal(v)
    const currentCards = JSON.parse(localStorage.getItem('cfv6_cards') || '[]')
    const currentDis = JSON.parse(localStorage.getItem('cfv6_dis') || '[]')
    await syncToCloud(currentCards, next, currentDis)
    return next
  }, [setTxnsLocal, syncToCloud])

  const setDisIds = useCallback(async (v) => {
    const next = await setDisIdsLocal(v)
    const currentCards = JSON.parse(localStorage.getItem('cfv6_cards') || '[]')
    const currentTxns = JSON.parse(localStorage.getItem('cfv6_txns') || '[]')
    await syncToCloud(currentCards, currentTxns, next)
    return next
  }, [setDisIdsLocal, syncToCloud])

  const loadDemo = useCallback(async () => {
    skipSyncRef.current = true
    const demoCards = stampCards(SEED.cards)
    await setCardsLocal(demoCards)
    await setTxnsLocal(SEED.txns)
    skipSyncRef.current = false
    if (user && supabase) {
      await syncToCloud(demoCards, SEED.txns, disIds)
    }
  }, [setCardsLocal, setTxnsLocal, user, disIds, syncToCloud])

  return {
    cards, setCards, txns, setTxns, disIds, setDisIds,
    ready, loadDemo, syncStatus, syncError,
  }
}
