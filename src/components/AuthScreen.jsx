import { useState } from 'react'

export function AuthScreen({ signIn, signUp, supabaseEnabled, onSkip }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    if (!email || !password) {
      setError('Completa email y contraseña')
      return
    }
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
        setMessage('Cuenta creada. Revisa tu email si se requiere confirmación.')
      }
    } catch (err) {
      setError(err.message || 'Error de autenticación')
    }
    setLoading(false)
  }

  if (!supabaseEnabled) {
    return (
      <div className="scr fadeIn" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💳</div>
        <h1 className="h1" style={{ marginBottom: 8 }}>Copiloto Tarjetas</h1>
        <p style={{ fontSize: 13, color: 'var(--m)', marginBottom: 24, lineHeight: 1.5 }}>
          Gestiona tus tarjetas de crédito con analítica e IA. Los datos se guardan en este dispositivo.
        </p>
        <button className="btn bp" onClick={onSkip}>Comenzar</button>
      </div>
    )
  }

  return (
    <div className="scr fadeIn" style={{ padding: '0 20px' }}>
      <div style={{ paddingTop: 40, marginBottom: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>💳</div>
        <h1 className="h1" style={{ marginBottom: 6 }}>Copiloto Tarjetas</h1>
        <p style={{ fontSize: 12, color: 'var(--m)' }}>
          {mode === 'login' ? 'Inicia sesión para sincronizar tus datos' : 'Crea tu cuenta'}
        </p>
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        <div>
          <label className="ilbl">EMAIL</label>
          <input className="inp" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" autoComplete="email" />
        </div>
        <div>
          <label className="ilbl">CONTRASEÑA</label>
          <input className="inp" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
        </div>
        {error && <p style={{ fontSize: 12, color: 'var(--rd)', fontWeight: 600 }}>{error}</p>}
        {message && <p style={{ fontSize: 12, color: 'var(--gn)', fontWeight: 600 }}>{message}</p>}
        <button className="btn bp" type="submit" disabled={loading}>
          {loading ? 'Procesando…' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </button>
      </form>

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button className="btn bs" style={{ width: '100%' }} onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError('') }}>
          {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
        <button className="btn bg" style={{ width: '100%' }} onClick={onSkip}>
          Continuar sin cuenta (solo local)
        </button>
      </div>
    </div>
  )
}
