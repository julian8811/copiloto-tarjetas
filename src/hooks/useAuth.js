import { useState, useEffect } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase.js'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(!supabaseConfigured)

  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setReady(true)
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
    await supabase.auth.signOut()
  }

  return { user, ready, signIn, signUp, signOut, supabaseEnabled: supabaseConfigured }
}
