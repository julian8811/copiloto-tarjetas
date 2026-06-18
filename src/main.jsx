import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// localStorage-backed storage (persists across page reloads)
if (!window.storage) {
  window.storage = {
    get: async (key) => {
      try {
        const value = localStorage.getItem(key)
        return value !== null ? { key, value } : null
      } catch {
        return null
      }
    },
    set: async (key, value) => {
      localStorage.setItem(key, value)
      return { key, value }
    },
    delete: async (key) => {
      localStorage.removeItem(key)
      return { key, deleted: true }
    },
    list: async (prefix) => ({
      keys: Object.keys(localStorage).filter(k => !prefix || k.startsWith(prefix)),
    }),
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
