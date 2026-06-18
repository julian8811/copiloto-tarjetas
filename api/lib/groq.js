export async function groqChat({ system, messages, model, max_tokens }) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    const err = new Error('Copiloto no configurado. Define GROQ_API_KEY.')
    err.status = 503
    throw err
  }

  const groqMessages = []
  if (system) groqMessages.push({ role: 'system', content: system })
  groqMessages.push(...(messages || []))

  const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'openai/gpt-oss-120b',
      max_tokens: max_tokens || 1000,
      messages: groqMessages,
    }),
  })

  const data = await upstream.json()
  if (!upstream.ok) {
    const err = new Error(data.error?.message || 'Error de Groq')
    err.status = upstream.status
    throw err
  }

  return {
    reply: data.choices?.[0]?.message?.content || '',
  }
}
