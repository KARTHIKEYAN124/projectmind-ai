import express from 'express'
import { requirePermission } from '../security/rbac.js'
import { createMemory, detectContradictions, listMemories, transitionMemory } from '../services/memory.js'
import { recordAudit } from '../services/audit.js'

export const memoryRouter = express.Router()

memoryRouter.get('/', (_request, response) => {
  response.json({ memories: listMemories() })
})

memoryRouter.post('/', requirePermission('memory:write'), (request, response) => {
  const contradictions = detectContradictions(request.body ?? {})
  const memory = createMemory({
    ...request.body,
    status: contradictions.length ? 'questionable' : request.body?.status,
  })
  recordAudit(request.session.user.email, 'memory.created', { memoryId: memory.id, contradictions })
  response.status(201).json({ memory, contradictions })
})

memoryRouter.post('/:id/transition', requirePermission('memory:write'), (request, response) => {
  const allowed = ['active', 'questionable', 'superseded', 'deprecated', 'invalid']
  const status = request.body?.status
  if (!allowed.includes(status)) {
    response.status(400).json({ error: `Status must be one of ${allowed.join(', ')}.` })
    return
  }
  const memory = transitionMemory(request.params.id, status, request.body?.supersededBy ?? null)
  if (!memory) {
    response.status(404).json({ error: 'Memory not found.' })
    return
  }
  recordAudit(request.session.user.email, 'memory.transitioned', { memoryId: memory.id, status })
  response.json({ memory })
})
