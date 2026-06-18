const MCP_URL = 'https://stitch.googleapis.com/mcp'

async function stitchCall(apiKey, toolName, args = {}) {
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: { name: toolName, arguments: args },
    }),
  })
  const data = await res.json()
  if (data.result?.isError) {
    throw new Error(data.result.content?.[0]?.text || 'Stitch API error')
  }
  const text = data.result?.content?.[0]?.text
  return text ? JSON.parse(text) : data.result
}

export async function listStitchScreens(apiKey, projectId) {
  const data = await stitchCall(apiKey, 'list_screens', { projectId })
  return data.screens || []
}

export const STITCH_PROJECT_ID = '2255941894502327613'
