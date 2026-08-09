import express from 'express'
import { requirePermission } from '../security/rbac.js'
import { planRepositoryIndex } from '../services/indexer.js'
import { enqueueJob, listJobs } from '../services/queue.js'
import { recordAudit } from '../services/audit.js'
import { createInstallationToken, listInstallationRepositories } from '../services/github.js'
import { saveRepositoryConnection } from '../services/db.js'

export const repositoryRouter = express.Router()

repositoryRouter.get('/', (_request, response) => {
  response.json({ repositories: [], source: 'Postgres repository_connections table when DATABASE_URL is configured.' })
})

repositoryRouter.get('/installation/:installationId', async (request, response) => {
  try {
    const repositories = await listInstallationRepositories(request.params.installationId)
    response.json({ repositories })
  } catch (error) {
    response.status(502).json({ error: error instanceof Error ? error.message : 'GitHub installation lookup failed.' })
  }
})

repositoryRouter.post('/', requirePermission('repositories:write'), async (request, response) => {
  const owner = request.body?.owner ?? parseOwner(request.body?.url)
  const name = request.body?.name ?? parseName(request.body?.url)
  const repository = {
    id: `repo-${Date.now()}`,
    provider: request.body?.provider ?? 'github',
    url: request.body?.url,
    cloneUrl: request.body?.cloneUrl ?? request.body?.url,
    owner,
    name,
    defaultBranch: request.body?.defaultBranch ?? 'main',
    private: Boolean(request.body?.private),
    installationId: request.body?.installationId ?? null,
  }
  if (repository.private && repository.installationId) {
    const token = await createInstallationToken(repository.installationId)
    repository.token = token.token
  }
  const savedRepository = await saveRepositoryConnection(repository)
  const job = await enqueueJob('repository.index', { repository: { ...repository, id: savedRepository.id ?? repository.id }, plan: planRepositoryIndex(repository) })
  recordAudit(request.session.user.email, 'repository.connected', { repository })
  response.status(202).json({ repository: savedRepository, job })
})

repositoryRouter.post('/:id/sync', requirePermission('repositories:write'), async (request, response) => {
  const job = await enqueueJob('repository.incremental_sync', {
    repositoryId: request.params.id,
    reason: request.body?.reason ?? 'manual',
  })
  recordAudit(request.session.user.email, 'repository.sync_requested', { repositoryId: request.params.id })
  response.status(202).json({ job })
})

repositoryRouter.get('/jobs', (_request, response) => {
  listJobs().then((jobs) => response.json({ jobs }))
})

function parseOwner(url = '') {
  return url.match(/github\.com[:/]([^/\s]+)/i)?.[1] ?? 'unknown'
}

function parseName(url = '') {
  return url.match(/github\.com[:/][^/\s]+\/([^/\s#.]+)/i)?.[1]?.replace(/\.git$/i, '') ?? 'unknown'
}
