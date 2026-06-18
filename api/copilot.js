export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(503).json({ error: 'Copiloto no configurado. Define ANTHROPIC_API_KEY en Vercel.' })
  }

  try {
    const { system, messages, model, max_tokens } = req.body || {}
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-5',
        max_tokens: max_tokens || 1000,
        system,
        messages,
      }),
    })

    const data = await upstream.json()
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: data.error?.message || 'Error de Anthropic' })
    }
    return res.status(200).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Error interno del servidor' })
  }
}
