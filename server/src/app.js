import cors from 'cors'
import express from 'express'
import { auditRouter } from './routes/audit.js'
import { authRouter } from './routes/auth.js'
import { chatRouter } from './routes/chat.js'
import { codeRouter } from './routes/code.js'
import { githubRouter } from './routes/github.js'
import { memoryRouter } from './routes/memory.js'
import { organizationRouter } from './routes/organizations.js'
import { repositoryRouter } from './routes/repositories.js'
import { settingsRouter } from './routes/settings.js'
import { webhookRouter } from './routes/webhooks.js'
import { requireSession } from './security/sessions.js'

export function createApp(app) {
  app.use(cors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173', credentials: true }))
  app.use(express.json({
    limit: '2mb',
    verify: (request, _response, buffer) => {
      request.rawBody = buffer
    },
  }))

  app.get('/api/health', (_request, response) => {
    response.json({
      ok: true,
      database: process.env.DATABASE_URL ? 'configured' : 'missing',
      redis: process.env.REDIS_URL ? 'configured' : 'missing',
      llm: process.env.FREE_LLM_API_KEY || process.env.GROQ_API_KEY ? 'configured' : 'missing',
      githubApp: process.env.GITHUB_APP_ID ? 'configured' : 'missing',
    })
  })

  app.use('/api/auth', authRouter)
  app.use('/api/github', githubRouter)
  app.use('/api/webhooks', webhookRouter)
  app.use('/api/chat', chatRouter)
  app.use('/api/organizations', requireSession, organizationRouter)
  app.use('/api/repositories', requireSession, repositoryRouter)
  app.use('/api/memory', requireSession, memoryRouter)
  app.use('/api/code', requireSession, codeRouter)
  app.use('/api/settings', requireSession, settingsRouter)
  app.use('/api/audit', requireSession, auditRouter)
}
