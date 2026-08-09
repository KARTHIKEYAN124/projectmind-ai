import pg from 'pg'

const { Pool } = pg
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    })
  : null

export function hasDatabase() {
  return Boolean(pool)
}

export async function query(text, params = []) {
  if (!pool) return { rows: [], rowCount: 0 }
  return pool.query(text, params)
}

export async function upsertUser(user) {
  if (!pool) return { id: user.id ?? `user-${Date.now()}`, ...user }
  const result = await query(
    `insert into users (email, name, provider, provider_subject)
     values ($1, $2, $3, $4)
     on conflict (email) do update set name = excluded.name, provider = excluded.provider, provider_subject = excluded.provider_subject
     returning *`,
    [user.email, user.name, user.provider, user.externalId],
  )
  return result.rows[0]
}

export async function insertAudit(action, metadata = {}, actorUserId = null, organizationId = null) {
  if (!pool) return null
  await query(
    'insert into audit_logs (organization_id, actor_user_id, action, metadata) values ($1, $2, $3, $4)',
    [organizationId, actorUserId, action, metadata],
  )
}

export async function saveRepositoryConnection(repository) {
  if (!pool) return repository
  const result = await query(
    `insert into repository_connections (project_id, provider, owner, name, clone_url, default_branch, private, installation_id)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     returning *`,
    [
      repository.projectId ?? null,
      repository.provider ?? 'github',
      repository.owner,
      repository.name,
      repository.cloneUrl,
      repository.defaultBranch ?? 'main',
      Boolean(repository.private),
      repository.installationId ?? null,
    ],
  )
  return result.rows[0]
}

export async function saveIndexedFiles(repositoryId, files) {
  if (!pool) return []
  const saved = []
  for (const file of files) {
    const result = await query(
      `insert into files (repository_id, path, language, size_bytes, content_hash, indexed_at)
       values ($1, $2, $3, $4, $5, now())
       on conflict (repository_id, path) do update
       set language = excluded.language, size_bytes = excluded.size_bytes, content_hash = excluded.content_hash, indexed_at = now()
       returning *`,
      [repositoryId, file.path, file.language, file.size, file.hash],
    )
    saved.push(result.rows[0])
  }
  return saved
}

export async function saveSymbols(fileRows, symbols) {
  if (!pool) return []
  const byPath = new Map(fileRows.map((file) => [file.path, file.id]))
  const saved = []
  for (const symbol of symbols) {
    const fileId = byPath.get(symbol.file)
    if (!fileId) continue
    const result = await query(
      `insert into symbols (file_id, name, kind, signature, start_line, end_line, metadata)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning *`,
      [fileId, symbol.name, symbol.kind, symbol.signature ?? null, symbol.startLine ?? null, symbol.endLine ?? null, symbol],
    )
    saved.push(result.rows[0])
  }
  return saved
}

export async function saveRepositoryHistory(repositoryId, history) {
  if (!pool) return { pullRequests: 0, issues: 0, commits: 0 }
  for (const commit of history.commits ?? []) {
    await query(
      `insert into commits (repository_id, sha, message, author_name, author_email, committed_at)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (repository_id, sha) do update set message = excluded.message`,
      [
        repositoryId,
        commit.sha,
        commit.commit?.message ?? '',
        commit.commit?.author?.name ?? null,
        commit.commit?.author?.email ?? null,
        commit.commit?.author?.date ?? null,
      ],
    )
  }
  for (const pr of history.pullRequests ?? []) {
    await query(
      `insert into pull_requests (repository_id, number, title, body, state, merged_at, author, metadata)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict (repository_id, number) do update set title = excluded.title, body = excluded.body, state = excluded.state, merged_at = excluded.merged_at, metadata = excluded.metadata`,
      [repositoryId, pr.number, pr.title, pr.body, pr.state, pr.merged_at, pr.user?.login ?? null, pr],
    )
  }
  for (const issue of history.issues ?? []) {
    await query(
      `insert into issues (repository_id, number, title, body, state, author, metadata)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (repository_id, number) do update set title = excluded.title, body = excluded.body, state = excluded.state, metadata = excluded.metadata`,
      [repositoryId, issue.number, issue.title, issue.body, issue.state, issue.user?.login ?? null, issue],
    )
  }
  return {
    pullRequests: history.pullRequests?.length ?? 0,
    issues: history.issues?.length ?? 0,
    commits: history.commits?.length ?? 0,
  }
}

export async function saveEmbedding(entityType, entityId, text, metadata, embedding) {
  if (!pool || !embedding?.length) return null
  const result = await query(
    `insert into embeddings (project_id, entity_type, entity_id, text, metadata, embedding)
     values ($1, $2, $3, $4, $5, $6)
     returning id`,
    [metadata.projectId ?? null, entityType, entityId ?? null, text, metadata, `[${embedding.join(',')}]`],
  )
  return result.rows[0]
}
