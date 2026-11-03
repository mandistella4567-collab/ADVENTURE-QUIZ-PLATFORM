import { createServer } from 'node:http'

const port = Number(process.env.PORT ?? process.env.API_PORT ?? 8787)
const host = process.env.API_HOST ?? (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1')
const apiKey = process.env.OPENAI_API_KEY
const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()).filter(Boolean)
const localOrigins = new Set(['http://localhost:5173', 'http://127.0.0.1:5173'])
const requestCounts = new Map()
const WINDOW_MS = 60_000
const MAX_REQUESTS = 12
const MAX_BODY_BYTES = 16_000

function send(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  })
  response.end(JSON.stringify(body))
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = ''
    let tooLarge = false
    request.on('data', (chunk) => {
      if (tooLarge) return
      body += chunk
      if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
        tooLarge = true
        body = ''
      }
    })
    request.on('end', () => {
      if (tooLarge) {
        reject(new Error('Request body is too large.'))
        return
      }
      try {
        resolve(JSON.parse(body))
      } catch {
        reject(new Error('Request body must be valid JSON.'))
      }
    })
    request.on('error', reject)
  })
}

function isValidPayload(payload) {
  return payload
    && typeof payload === 'object'
    && typeof payload.profile === 'string'
    && payload.profile.length <= 100
    && typeof payload.ending === 'string'
    && payload.ending.length <= 100
    && Array.isArray(payload.answers)
    && payload.answers.length >= 1
    && payload.answers.length <= 20
    && payload.answers.every((answer) => answer
      && typeof answer.question === 'string'
      && answer.question.length <= 500
      && typeof answer.choice === 'string'
      && answer.choice.length <= 250)
}

function takeRateLimit(request) {
  const key = request.socket.remoteAddress ?? 'unknown'
  const now = Date.now()
  const record = requestCounts.get(key)
  if (!record || now - record.startedAt >= WINDOW_MS) {
    requestCounts.set(key, { startedAt: now, count: 1 })
    return true
  }
  if (record.count >= MAX_REQUESTS) return false
  record.count += 1
  return true
}

const server = createServer(async (request, response) => {
  const origin = request.headers.origin
  const isAllowedOrigin = !origin || (allowedOrigins ? allowedOrigins.includes(origin) : localOrigins.has(origin))
  if (!isAllowedOrigin) {
    send(response, 403, { error: 'This origin is not allowed to use the personalization service.' })
    return
  }
  if (origin) {
    response.setHeader('Access-Control-Allow-Origin', origin)
    response.setHeader('Vary', 'Origin')
  }
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    })
    response.end()
    return
  }
  if (request.url === '/api/health' && request.method === 'GET') {
    send(response, 200, { ok: true, aiConfigured: Boolean(apiKey) })
    return
  }
  if (request.url !== '/api/personalize' || request.method !== 'POST') {
    send(response, 404, { error: 'Endpoint not found.' })
    return
  }
  if (!takeRateLimit(request)) {
    send(response, 429, { error: 'Too many reflections requested. Please try again in a minute.' })
    return
  }
  if (!apiKey) {
    send(response, 503, { error: 'AI reflections are not configured yet. Add OPENAI_API_KEY to the server environment.' })
    return
  }
  try {
    const payload = await readBody(request)
    if (!isValidPayload(payload)) {
      send(response, 400, { error: 'Include a profile, ending, and between 1 and 20 valid answers.' })
      return
    }

    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.65,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are a warm, thoughtful narrator for a fictional choose-your-own-adventure. Based only on the supplied fictional choices, write a grounded reflection (2-3 sentences) and one short memorable insight (one sentence). Do not diagnose, make sensitive personal inferences, or claim certainty about the user. Return only JSON with string fields "reflection" and "insight". Keep reflection under 550 characters and insight under 160 characters.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              profile: payload.profile,
              ending: payload.ending,
              choices: payload.answers.map((answer) => ({ moment: answer.question, choice: answer.choice })),
            }),
          },
        ],
      }),
      signal: AbortSignal.timeout(20_000),
    })
    if (!completion.ok) {
      const body = await completion.json().catch(() => null)
      const providerMessage = body?.error?.message
      console.error('OpenAI personalization request failed:', completion.status, providerMessage ?? 'No provider message')
      send(response, 502, { error: 'The AI reflection service could not complete your request. Please try again.' })
      return
    }

    const result = await completion.json()
    const content = result.choices?.[0]?.message?.content
    let parsed
    try {
      parsed = JSON.parse(content)
    } catch {
      send(response, 502, { error: 'The AI reflection service returned an invalid response. Please try again.' })
      return
    }
    if (typeof parsed.reflection !== 'string' || typeof parsed.insight !== 'string'
      || parsed.reflection.length > 550 || parsed.insight.length > 160) {
      send(response, 502, { error: 'The AI reflection service returned an invalid response. Please try again.' })
      return
    }
    send(response, 200, { reflection: parsed.reflection, insight: parsed.insight })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error'
    if (message === 'Request body is too large.' || message === 'Request body must be valid JSON.') {
      send(response, 400, { error: message })
      return
    }
    console.error('Personalization request failed:', message)
    send(response, 500, { error: 'The AI reflection service encountered an error. Please try again.' })
  }
})

server.listen(port, host, () => {
  console.log(`Mythos API listening on http://${host}:${port}`)
})
