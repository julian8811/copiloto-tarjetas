import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { groqChat } from './api/lib/groq.js'

function copilotDevApi() {
  return {
    name: 'copilot-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/copilot', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
          res.statusCode = 204
          res.end()
          return
        }
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          try {
            const payload = JSON.parse(body)
            const { reply } = await groqChat(payload)
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ reply }))
          } catch (err) {
            res.statusCode = err.status || 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }))
          }
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Expose GROQ_API_KEY to the dev middleware (not bundled into client)
  if (env.GROQ_API_KEY) process.env.GROQ_API_KEY = env.GROQ_API_KEY

  return {
    plugins: [react(), copilotDevApi()],
    base: env.VITE_BASE_PATH || '/',
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  }
})
