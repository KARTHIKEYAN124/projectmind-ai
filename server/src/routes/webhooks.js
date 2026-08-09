import express from 'express'
import { verifyGitHubWebhook } from '../services/github.js'
import { enqueueJob } from '../services/queue.js'
import { recordAudit } from '../services/audit.js'

export const webhookRouter = express.Router()

webhookRouter.post('/github', async (request, response) => {
  const verification = verifyGitHubWebhook(request)
  if (!verification.ok) {
    response.status(401).json({ error: verification.reason })
    return
  }
  const event = request.headers['x-github-event'] ?? 'unknown'
  const job = await enqueueJob('github.webhook_sync', {
    event,
    action: request.body?.action,
    repository: request.body?.repository?.full_name,
  })
  recordAudit('github', 'webhook.received', { event, jobId: job.id })
  response.status(202).json({ job })
})
