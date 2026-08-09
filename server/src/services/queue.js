import { Queue } from 'bullmq'
import IORedis from 'ioredis'

const jobs = []
const connection = process.env.REDIS_URL ? new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null }) : null
const queue = connection ? new Queue('projectmind', { connection }) : null

export async function enqueueJob(type, payload) {
  if (queue) {
    const queued = await queue.add(type, payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 100,
    })
    return {
      id: queued.id,
      type,
      payload,
      status: 'queued',
      backend: 'redis',
      createdAt: new Date().toISOString(),
    }
  }

  const job = {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    payload,
    status: 'queued',
    createdAt: new Date().toISOString(),
  }
  jobs.unshift(job)
  return job
}

export async function listJobs() {
  if (queue) {
    const queued = await queue.getJobs(['waiting', 'active', 'completed', 'failed'], 0, 99)
    return queued.map((job) => ({
      id: job.id,
      type: job.name,
      status: job.finishedOn ? 'complete' : job.processedOn ? 'running' : 'queued',
      backend: 'redis',
      createdAt: job.timestamp ? new Date(job.timestamp).toISOString() : null,
    }))
  }
  return jobs.slice(0, 100)
}

export function claimJob() {
  const job = jobs.find((item) => item.status === 'queued')
  if (job) job.status = 'running'
  return job
}

export function completeJob(job, result) {
  job.status = 'complete'
  job.result = result
  job.completedAt = new Date().toISOString()
}

export function redisConnection() {
  return connection
}
