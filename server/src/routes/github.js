import express from 'express'
import { githubAppInstallUrl } from '../services/github.js'

export const githubRouter = express.Router()

githubRouter.get('/app/install', (_request, response) => {
  const url = githubAppInstallUrl()
  if (!url) {
    response.status(501).json({
      error: 'GITHUB_APP_SLUG is not configured.',
      required: ['GITHUB_APP_ID', 'GITHUB_APP_SLUG', 'GITHUB_APP_PRIVATE_KEY', 'GITHUB_WEBHOOK_SECRET'],
    })
    return
  }
  response.json({ url })
})

githubRouter.get('/app/callback', (request, response) => {
  response.json({
    installationId: request.query.installation_id ?? null,
    setupAction: request.query.setup_action ?? null,
    next: 'Store installation, list repositories, enqueue private repo sync.',
  })
})
