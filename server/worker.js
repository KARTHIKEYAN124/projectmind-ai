import 'dotenv/config'
import { Worker } from 'bullmq'
import { claimJob, completeJob, redisConnection } from './src/services/queue.js'
import { cloneAndIndexRepository, planRepositoryIndex } from './src/services/indexer.js'

console.log('ProjectMind worker started.')

const connection = redisConnection()

if (connection) {
  new Worker('projectmind', async (job) => runJob({ type: job.name, payload: job.data }), { connection })
  console.log('Redis worker connected.')
} else {
  console.log('REDIS_URL missing. Using local in-memory worker loop.')
  setInterval(() => {
  const job = claimJob()
  if (!job) return
    runJob(job).then((result) => completeJob(job, result)).catch((error) => completeJob(job, { error: error.message }))
  }, 1500)
}

async function runJob(job) {
  if (job.type === 'repository.index') {
    if (job.payload.repository?.cloneUrl || job.payload.repository?.url) {
      return cloneAndIndexRepository(job.payload.repository)
    }
    return {
      plan: planRepositoryIndex(job.payload.repository),
      next: 'Repository URL missing; cannot clone.',
    }
  }

  if (job.type === 'github.webhook_sync') {
    return {
      next: 'Fetch changed files, reparse incrementally, update graph, generate memories, invalidate stale memories.',
    }
  }

  return { next: 'No worker handler registered yet.' }
}
