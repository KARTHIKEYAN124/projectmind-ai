import express from 'express'
import { requirePermission } from '../security/rbac.js'
import { planRepositoryIndex } from '../services/indexer.js'
import { enqueueJob, listJobs } from '../services/queue.js'
import { recordAudit } from '../services/audit.js'

export const repositoryRouter = express.Router()

repositoryRouter.get('/', (_request, response) => {
  response.json({ repositories: [], source: 'Postgres repository_connections table when DATABASE_URL is configured.' })
})

repositoryRouter.post('/', requirePermission('repositories:write'), (request, response) => {
  const repository = {
    id: `repo-${Date.now()}`,
    provider: request.body?.provider ?? 'github',
    url: request.body?.url,
    private: Boolean(request.body?.private),
    installationId: request.body?.installationId ?? null,
  }
  const job = enqueueJob('repository.index', { repository, plan: planRepositoryIndex(repository) })
  recordAudit(request.session.user.email, 'repository.connected', { repository })
  response.status(202).json({ repository, job })
})

repositoryRouter.post('/:id/sync', requirePermission('repositories:write'), (request, response) => {
  const job = enqueueJob('repository.incremental_sync', {
    repositoryId: request.params.id,
    reason: request.body?.reason ?? 'manual',
  })
  recordAudit(request.session.user.email, 'repository.sync_requested', { repositoryId: request.params.id })
  response.status(202).json({ job })
})

repositoryRouter.get('/jobs', (_request, response) => {
  response.json({ jobs: listJobs() })
})
