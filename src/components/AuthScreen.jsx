import { useState } from 'react'

export function AuthScreen({
  signIn,
  signUp,
  resetPassword,
  updatePassword,
  recoveryMode,
  clearRecoveryMode,
  supabaseEnabled,
  onSkip,
}) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const switchMode = (next) => {
    setMode(next)
    setError('')
    setMessage('')
    setPassword('')
    setPassword2('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (mode === 'forgot') {
      if (!email) {
        setError('Ingresa tu email')
        return
      }
      setLoading(true)
      try {
        await resetPassword(email)
        setMessage('Revisa tu correo. Te enviamos un enlace para restablecer la contraseña.')
      } catch (err) {
        setError(err.message || 'No se pudo enviar el enlace')
      }
      setLoading(false)
      return
    }

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
        setMessage('Cuenta creada. Ya puedes iniciar sesión.')
      }
    } catch (err) {
      setError(err.message || 'Error de autenticación')
    }
    setLoading(false)
  }

  const submitNewPassword = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== password2) {
      setError('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    try {
      await updatePassword(password)
      setMessage('Contraseña actualizada correctamente.')
      setPassword('')
      setPassword2('')
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la contraseña')
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

  if (recoveryMode) {
    return (
      <div className="scr fadeIn auth-inner" style={{ padding: '0 20px' }}>
        <div style={{ paddingTop: 40, marginBottom: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
          <h1 className="h1" style={{ marginBottom: 6 }}>Nueva contraseña</h1>
          <p style={{ fontSize: 12, color: 'var(--m)' }}>Elige una contraseña segura para tu cuenta</p>
        </div>

        <form onSubmit={submitNewPassword} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div>
            <label className="ilbl">NUEVA CONTRASEÑA</label>
            <input className="inp" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
          </div>
          <div>
            <label className="ilbl">CONFIRMAR CONTRASEÑA</label>
            <input className="inp" type="password" value={password2} onChange={e => setPassword2(e.target.value)} placeholder="Repite la contraseña" autoComplete="new-password" />
          </div>
          {error && <p style={{ fontSize: 12, color: 'var(--rd)', fontWeight: 600 }}>{error}</p>}
          {message && <p style={{ fontSize: 12, color: 'var(--gn)', fontWeight: 600 }}>{message}</p>}
          <button className="btn bp" type="submit" disabled={loading}>
            {loading ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>

        {message && (
          <button className="btn bs" style={{ width: '100%', marginTop: 12 }} onClick={clearRecoveryMode}>
            Ir al inicio
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="scr fadeIn auth-inner" style={{ padding: '0 20px' }}>
      <div style={{ paddingTop: 40, marginBottom: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>💳</div>
        <h1 className="h1" style={{ marginBottom: 6 }}>Copiloto Tarjetas</h1>
        <p style={{ fontSize: 12, color: 'var(--m)' }}>
          {mode === 'login' && 'Inicia sesión para sincronizar tus datos'}
          {mode === 'register' && 'Crea tu cuenta'}
          {mode === 'forgot' && 'Recuperar contraseña'}
        </p>
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        <div>
          <label className="ilbl">EMAIL</label>
          <input className="inp" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" autoComplete="email" />
        </div>
        {mode !== 'forgot' && (
          <div>
            <label className="ilbl">CONTRASEÑA</label>
            <input className="inp" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </div>
        )}
        {mode === 'login' && (
          <button type="button" className="btn bg" style={{ alignSelf: 'flex-start', fontSize: 10, padding: '5px 10px' }} onClick={() => switchMode('forgot')}>
            ¿Olvidaste tu contraseña?
          </button>
        )}
        {error && <p style={{ fontSize: 12, color: 'var(--rd)', fontWeight: 600 }}>{error}</p>}
        {message && <p style={{ fontSize: 12, color: 'var(--gn)', fontWeight: 600 }}>{message}</p>}
        <button className="btn bp" type="submit" disabled={loading}>
          {loading ? 'Procesando…' : mode === 'login' ? 'Iniciar sesión' : mode === 'register' ? 'Crear cuenta' : 'Enviar enlace'}
        </button>
      </form>

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {mode === 'forgot' ? (
          <button className="btn bs" style={{ width: '100%' }} onClick={() => switchMode('login')}>
            Volver al inicio de sesión
          </button>
        ) : (
          <button className="btn bs" style={{ width: '100%' }} onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        )}
        <button className="btn bg" style={{ width: '100%' }} onClick={onSkip}>
          Continuar sin cuenta (solo local)
        </button>
      </div>
    </div>
  )
}
