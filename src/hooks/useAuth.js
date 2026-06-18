import { useState, useEffect } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase.js'

function redirectUrl() {
  if (typeof window === 'undefined') return undefined
  return `${window.location.origin}${import.meta.env.BASE_URL}`.replace(/\/$/, '') || window.location.origin
}

export function useAuth() {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(!supabaseConfigured)
  const [recoveryMode, setRecoveryMode] = useState(false)

  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setReady(true)
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    if (!supabase) throw new Error('Supabase no configurado')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email, password) => {
    if (!supabase) throw new Error('Supabase no configurado')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    if (!supabase) return
    setRecoveryMode(false)
    await supabase.auth.signOut()
  }

  const resetPassword = async (email) => {
    if (!supabase) throw new Error('Supabase no configurado')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl(),
    })
    if (error) throw error
  }

  const updatePassword = async (password) => {
    if (!supabase) throw new Error('Supabase no configurado')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
    setRecoveryMode(false)
  }

  const clearRecoveryMode = () => setRecoveryMode(false)

  return {
    user,
    ready,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    recoveryMode,
    clearRecoveryMode,
    supabaseEnabled: supabaseConfigured,
  }
}
