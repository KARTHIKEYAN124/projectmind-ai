const jobs = []

export function enqueueJob(type, payload) {
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

export function listJobs() {
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
