import { Component } from 'react'

export class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Error de aplicación:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0b141d', color: '#F0F4FC', fontFamily: 'system-ui, sans-serif', padding: 24,
        }}>
          <div style={{ maxWidth: 420, textAlign: 'center' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>⚠️</p>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Algo salió mal</h1>
            <p style={{ fontSize: 13, color: '#8A99AF', marginBottom: 16, lineHeight: 1.5 }}>
              {this.state.error.message || 'Error inesperado en la aplicación'}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                background: '#00e0b7', color: '#002019', border: 'none', borderRadius: 12,
                padding: '12px 20px', fontWeight: 700, cursor: 'pointer',
              }}
            >
              Recargar aplicación
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
