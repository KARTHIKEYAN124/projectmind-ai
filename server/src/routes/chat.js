import express from 'express'
import { generateRagAnswer } from '../services/rag.js'

export const chatRouter = express.Router()

chatRouter.post('/', async (request, response) => {
  const question = String(request.body?.question ?? '').trim()
  const evidence = Array.isArray(request.body?.evidence) ? request.body.evidence : []
  const repo = request.body?.repo
  if (!question) {
    response.status(400).json({ error: 'Question is required.' })
    return
  }
  try {
    const result = await generateRagAnswer({ question, evidence, repo })
    if (!result) {
      response.status(503).json({ error: 'FREE_LLM_API_KEY is not configured.' })
      return
    }
    response.json(result)
  } catch (error) {
    response.status(502).json({ error: error instanceof Error ? error.message : 'RAG request failed.' })
  }
})
