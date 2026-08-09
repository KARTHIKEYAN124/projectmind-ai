import 'dotenv/config'
import { claimJob, completeJob } from './src/services/queue.js'
import { planRepositoryIndex } from './src/services/indexer.js'

console.log('ProjectMind worker started. Configure REDIS_URL for distributed queues in production.')

setInterval(() => {
  const job = claimJob()
  if (!job) return

  if (job.type === 'repository.index') {
    completeJob(job, {
      plan: planRepositoryIndex(job.payload.repository),
      next: 'Clone repository, parse AST with Tree-sitter, persist symbols, create embeddings, extract memories.',
    })
    return
  }

  if (job.type === 'github.webhook_sync') {
    completeJob(job, {
      next: 'Fetch changed files, reparse incrementally, update graph, generate memories, invalidate stale memories.',
    })
    return
  }

  completeJob(job, { next: 'No worker handler registered yet.' })
}, 1500)
