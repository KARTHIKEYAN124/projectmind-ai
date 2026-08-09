import express from 'express'
import { requirePermission } from '../security/rbac.js'
import { listAuditEvents } from '../services/audit.js'

export const auditRouter = express.Router()

auditRouter.get('/', requirePermission('audit:read'), (_request, response) => {
  response.json({ events: listAuditEvents() })
})
