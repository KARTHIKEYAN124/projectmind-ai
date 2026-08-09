const baseUrl = process.env.FREE_LLM_BASE_URL ?? 'https://api.groq.com/openai/v1'
const model = process.env.FREE_LLM_MODEL ?? 'llama-3.3-70b-versatile'
const apiKey = process.env.FREE_LLM_API_KEY ?? process.env.GROQ_API_KEY

export function hybridRetrieve(question, evidence = []) {
  const terms = question.toLowerCase().split(/\W+/).filter((term) => term.length > 2)
  return evidence
    .map((item) => {
      const haystack = `${item.title ?? ''} ${item.kind ?? ''} ${item.detail ?? ''}`.toLowerCase()
      const keyword = terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0)
      const graph = /related|dependency|impact|calls|imports/i.test(item.kind ?? '') ? 2 : 0
      const vector = Number.parseFloat(item.confidence) || 60
      return { ...item, score: keyword * 0.2 + graph * 0.25 + vector * 0.4 + 0.15 }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
}

export async function generateRagAnswer({ question, evidence, repo }) {
  if (!apiKey) return null
  const rankedEvidence = hybridRetrieve(question, evidence)
  const evidencePack = rankedEvidence
    .map((item, index) => `${index + 1}. ${item.title ?? 'Unknown source'} [${item.kind ?? 'source'}]\n${item.detail ?? ''}`)
    .join('\n\n')

  const llmResponse = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are ProjectMind. Use hybrid repository evidence, memory state, graph relationships, and history. Cite source titles and state confidence.',
        },
        {
          role: 'user',
          content: `Repository: ${repo?.owner ?? 'unknown'}/${repo?.repo ?? 'unknown'}\nQuestion: ${question}\nEvidence:\n${evidencePack || 'none'}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 900,
    }),
  })
  const payload = await llmResponse.json().catch(() => ({}))
  if (!llmResponse.ok) throw new Error(payload?.error?.message ?? `LLM HTTP ${llmResponse.status}`)
  return {
    answer: payload?.choices?.[0]?.message?.content ?? 'The provider returned no answer.',
    model,
    provider: baseUrl,
    evidence: rankedEvidence,
  }
}
