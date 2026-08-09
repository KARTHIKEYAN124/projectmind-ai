import cors from 'cors'
import 'dotenv/config'
import express from 'express'

const app = express()
const port = Number(process.env.PORT ?? 8787)
const baseUrl = process.env.FREE_LLM_BASE_URL ?? 'https://api.groq.com/openai/v1'
const model = process.env.FREE_LLM_MODEL ?? 'llama-3.3-70b-versatile'
const apiKey = process.env.FREE_LLM_API_KEY ?? process.env.GROQ_API_KEY

app.use(cors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173' }))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    provider: baseUrl,
    model,
    configured: Boolean(apiKey),
  })
})

app.post('/api/chat', async (request, response) => {
  if (!apiKey) {
    response.status(503).json({
      error: 'FREE_LLM_API_KEY is not configured. Get a free provider key, then add it to .env.local.',
    })
    return
  }

  const question = String(request.body?.question ?? '').trim()
  const evidence = Array.isArray(request.body?.evidence) ? request.body.evidence.slice(0, 8) : []
  const repo = request.body?.repo

  if (!question) {
    response.status(400).json({ error: 'Question is required.' })
    return
  }

  const evidencePack = evidence
    .map((item, index) => `${index + 1}. ${item.title ?? 'Unknown source'} [${item.kind ?? 'source'}, confidence ${item.confidence ?? 'n/a'}]\n${item.detail ?? ''}`)
    .join('\n\n')

  const systemPrompt = [
    'You are ProjectMind, an engineering memory assistant.',
    'Answer from the provided repository evidence first.',
    'If evidence is weak, say what is missing and give the safest inference.',
    'Always cite source titles from the evidence pack.',
    'Prefer concise, technical, useful answers.',
  ].join(' ')

  const userPrompt = [
    repo?.owner && repo?.repo ? `Repository: ${repo.owner}/${repo.repo} (${repo.branch ?? 'unknown branch'})` : 'Repository: not connected',
    `Question: ${question}`,
    evidencePack ? `Evidence pack:\n${evidencePack}` : 'Evidence pack: none',
  ].join('\n\n')

  try {
    const llmResponse = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 900,
      }),
    })

    const payload = await llmResponse.json().catch(() => ({}))
    if (!llmResponse.ok) {
      response.status(llmResponse.status).json({
        error: payload?.error?.message ?? `LLM provider returned HTTP ${llmResponse.status}.`,
      })
      return
    }

    response.json({
      answer: payload?.choices?.[0]?.message?.content ?? 'The provider returned no answer.',
      model,
      provider: baseUrl,
    })
  } catch (error) {
    response.status(502).json({
      error: error instanceof Error ? error.message : 'LLM provider request failed.',
    })
  }
})

app.listen(port, () => {
  console.log(`ProjectMind API listening on http://localhost:${port}`)
})
