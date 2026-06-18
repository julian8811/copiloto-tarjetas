import { groqChat } from './lib/groq.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { system, messages, model, max_tokens } = req.body || {}
    const { reply } = await groqChat({ system, messages, model, max_tokens })
    return res.status(200).json({ reply })
  } catch (err) {
    const status = err.status || 500
    return res.status(status).json({ error: err.message || 'Error interno del servidor' })
  }
}
