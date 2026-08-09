import express from 'express'

export const organizationRouter = express.Router()

organizationRouter.get('/', (_request, response) => {
  response.json({
    organizations: [
      {
        id: 'org-local',
        name: 'Local Workspace',
        plan: 'development',
        members: [],
      },
    ],
  })
})

organizationRouter.post('/', (request, response) => {
  response.status(201).json({
    organization: {
      id: `org-${Date.now()}`,
      name: request.body?.name ?? 'New Organization',
      createdAt: new Date().toISOString(),
    },
  })
})
