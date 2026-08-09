import express from 'express'
import { exchangeOAuthCode } from '../services/github.js'
import { recordAudit } from '../services/audit.js'
import { createSession, issueSessionResponse } from '../security/sessions.js'
import { upsertUser } from '../services/db.js'

export const authRouter = express.Router()

authRouter.post('/email', (request, response) => {
  const { email, name } = request.body ?? {}
  if (!email) {
    response.status(400).json({ error: 'Email is required.' })
    return
  }
  const user = { id: `user-${Date.now()}`, email, name: name ?? email, role: 'owner', provider: 'email', externalId: email }
  recordAudit(user.email, 'auth.email_session_created')
  issueSessionResponse(response, user)
})

authRouter.get('/github/callback', async (request, response) => {
  try {
    const user = await upsertUser(await exchangeOAuthCode('github', String(request.query.code ?? '')))
    recordAudit(user.email, 'auth.github_callback')
    issueOAuthCallbackResponse(request, response, { ...user, role: 'owner' }, 'github')
  } catch (error) {
    response.status(400).json({ error: error instanceof Error ? error.message : 'GitHub OAuth failed.' })
  }
})

authRouter.get('/google/callback', async (request, response) => {
  try {
    const user = await upsertUser(await exchangeOAuthCode('google', String(request.query.code ?? '')))
    recordAudit(user.email, 'auth.google_callback')
    issueOAuthCallbackResponse(request, response, { ...user, role: 'owner' }, 'google')
  } catch (error) {
    response.status(400).json({ error: error instanceof Error ? error.message : 'Google OAuth failed.' })
  }
})

function issueOAuthCallbackResponse(request, response, user, provider) {
  const token = createSession(user)
  const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:5173'
  response.cookie?.('pm_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  if (request.accepts('html')) {
    response.redirect(`${webOrigin}/#app?auth=${provider}`)
    return
  }
  response.json({ token, user })
}
