import express from 'express'
import { exchangeOAuthCode } from '../services/github.js'
import { recordAudit } from '../services/audit.js'
import { issueSessionResponse } from '../security/sessions.js'

export const authRouter = express.Router()

authRouter.post('/email', (request, response) => {
  const { email, name } = request.body ?? {}
  if (!email) {
    response.status(400).json({ error: 'Email is required.' })
    return
  }
  const user = { id: `user-${Date.now()}`, email, name: name ?? email, role: 'owner' }
  recordAudit(user.email, 'auth.email_session_created')
  issueSessionResponse(response, user)
})

authRouter.get('/github/callback', async (request, response) => {
  try {
    const user = await exchangeOAuthCode('github', String(request.query.code ?? ''))
    recordAudit(user.email, 'auth.github_callback')
    issueSessionResponse(response, user)
  } catch (error) {
    response.status(400).json({ error: error instanceof Error ? error.message : 'GitHub OAuth failed.' })
  }
})

authRouter.get('/google/callback', async (request, response) => {
  try {
    const user = await exchangeOAuthCode('google', String(request.query.code ?? ''))
    recordAudit(user.email, 'auth.google_callback')
    issueSessionResponse(response, user)
  } catch (error) {
    response.status(400).json({ error: error instanceof Error ? error.message : 'Google OAuth failed.' })
  }
})
