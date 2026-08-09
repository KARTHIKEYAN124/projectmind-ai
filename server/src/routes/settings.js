import express from 'express'
import { databaseStatus } from '../services/database.js'

export const settingsRouter = express.Router()

settingsRouter.get('/', (_request, response) => {
  response.json({
    repository: { sync: 'manual_or_webhook' },
    ai: {
      provider: process.env.FREE_LLM_BASE_URL ?? 'https://api.groq.com/openai/v1',
      model: process.env.FREE_LLM_MODEL ?? 'llama-3.3-70b-versatile',
      configured: Boolean(process.env.FREE_LLM_API_KEY || process.env.GROQ_API_KEY),
    },
    database: databaseStatus(),
    security: {
      rbac: true,
      auditLogs: true,
      tokenRotation: 'requires production secret store',
      encryptionAtRest: 'schema-ready; configure Postgres/S3 provider encryption',
    },
  })
})
