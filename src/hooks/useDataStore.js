import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase.js'
import { SEED } from '../data/seed.js'

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
    updated_at: new Date().toISOString(),
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
  }
}

async function syncAllToSupabase(userId, cards, txns, disIds) {
  if (!supabase) return

  await supabase.from('cards').delete().eq('user_id', userId)
  await supabase.from('transactions').delete().eq('user_id', userId)
  await supabase.from('dismissed_alerts').delete().eq('user_id', userId)

  if (cards.length) {
    const { error } = await supabase.from('cards').insert(cards.map(c => cardToDb(c, userId)))
    if (error) throw error
  }
  if (txns.length) {
    const { error } = await supabase.from('transactions').insert(txns.map(t => txnToDb(t, userId)))
    if (error) throw error
  }
  if (disIds.length) {
    const { error } = await supabase.from('dismissed_alerts').insert(
      disIds.map(alert_id => ({ user_id: userId, alert_id }))
    )
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

  return {
    cards: (cardsRes.data || []).map(cardFromDb),
    txns: (txnsRes.data || []).map(txnFromDb),
    disIds: (disRes.data || []).map(r => r.alert_id),
  }
}

export function useDataStore(user) {
  const [cards, setCardsLocal, cardsReady] = useLocalStore('cfv6_cards', [])
  const [txns, setTxnsLocal, txnsReady] = useLocalStore('cfv6_txns', [])
  const [disIds, setDisIdsLocal, disReady] = useLocalStore('cfv6_dis', [])
  const [cloudReady, setCloudReady] = useState(!user)
  const syncingRef = useRef(false)
  const skipSyncRef = useRef(false)

  const ready = cardsReady && txnsReady && disReady && cloudReady

  useEffect(() => {
    if (!user || !supabase) {
      setCloudReady(true)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const remote = await loadFromSupabase(user.id)
        if (cancelled) return

        const localCards = JSON.parse(localStorage.getItem('cfv6_cards') || '[]')
        const localTxns = JSON.parse(localStorage.getItem('cfv6_txns') || '[]')
        const localDis = JSON.parse(localStorage.getItem('cfv6_dis') || '[]')
        const hasLocal = localCards.length > 0 || localTxns.length > 0

        skipSyncRef.current = true
        if (remote.cards.length || remote.txns.length) {
          await setCardsLocal(remote.cards)
          await setTxnsLocal(remote.txns)
          await setDisIdsLocal(remote.disIds)
        } else if (hasLocal) {
          await syncAllToSupabase(user.id, localCards, localTxns, localDis)
        }
      } catch (err) {
        console.error('Error cargando datos de Supabase:', err)
      } finally {
        if (!cancelled) setCloudReady(true)
        skipSyncRef.current = false
      }
    })()

    return () => { cancelled = true }
  }, [user?.id])

  const syncToCloud = useCallback(async (nextCards, nextTxns, nextDis) => {
    if (!user || !supabase || skipSyncRef.current || syncingRef.current) return
    syncingRef.current = true
    try {
      await syncAllToSupabase(user.id, nextCards, nextTxns, nextDis)
    } catch (err) {
      console.error('Error sincronizando con Supabase:', err)
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
    await setCardsLocal(SEED.cards)
    await setTxnsLocal(SEED.txns)
    skipSyncRef.current = false
    if (user && supabase) {
      await syncAllToSupabase(user.id, SEED.cards, SEED.txns, disIds)
    }
  }, [setCardsLocal, setTxnsLocal, user, disIds])

  return { cards, setCards, txns, setTxns, disIds, setDisIds, ready, loadDemo }
}
