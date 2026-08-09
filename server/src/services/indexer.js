import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import simpleGit from 'simple-git'
import { saveEmbedding, saveIndexedFiles, saveRepositoryHistory, saveSymbols } from './db.js'
import { fetchRepositoryHistory } from './github.js'

export function planRepositoryIndex(repository) {
  return [
    { name: 'clone_repository', detail: `Clone ${repository.url} using installation token for private access.` },
    { name: 'scan_repository', detail: 'Ignore node_modules, dist, build, .next, coverage, vendor, binaries, and generated files.' },
    { name: 'tree_sitter_parse', detail: 'Parse supported source files into syntax trees and symbol entities.' },
    { name: 'symbol_graph', detail: 'Extract CALLS, IMPORTS, DEPENDS_ON, TESTED_BY, and MODIFIED_BY relationships.' },
    { name: 'history_ingestion', detail: 'Analyze commits, PRs, issues, discussions, and linked docs.' },
    { name: 'embeddings', detail: 'Embed functions, classes, PR summaries, issue text, docs, and memories with pgvector.' },
    { name: 'memory_extraction', detail: 'Generate candidate architecture, decision, bug, constraint, and failed_attempt memories.' },
  ]
}

export async function cloneAndIndexRepository(repository) {
  const token = repository.token
  const cloneUrl = authenticatedCloneUrl(repository.cloneUrl ?? repository.url, token)
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'projectmind-'))
  await simpleGit().clone(cloneUrl, directory, ['--depth', '100'])
  const files = await scanRepositoryFiles(directory)
  const symbols = extractSymbols(files)
  const savedFiles = repository.id ? await saveIndexedFiles(repository.id, files) : []
  await saveSymbols(savedFiles, symbols)
  const embeddings = await generateEmbeddingsForIndex(repository, files, symbols)
  const history = repository.owner && repository.name && token
    ? await fetchRepositoryHistory(repository.owner, repository.name, token)
    : { pullRequests: [], issues: [], commits: [] }
  if (repository.id) await saveRepositoryHistory(repository.id, history)
  return {
    directory,
    files: files.length,
    symbols: symbols.length,
    embeddings: embeddings.length,
    pullRequests: history.pullRequests.length,
    issues: history.issues.length,
    commits: history.commits.length,
  }
}

export async function scanRepositoryFiles(root) {
  const files = []
  await walk(root, files, root)
  return files
}

export function extractSymbols(files = []) {
  return files.flatMap((file) => {
    const text = file.text ?? ''
    const symbols = [...text.matchAll(/\b(function|class|interface|type|const|def)\s+([A-Za-z0-9_]+)/g)]
    return symbols.map((match) => ({
      name: match[2],
      kind: match[1],
      file: file.path,
      signature: match[0],
      parser: 'tree-sitter-compatible-regex-fallback',
    }))
  })
}

async function walk(current, files, root) {
  const entries = await fs.readdir(current, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(current, entry.name)
    const relative = path.relative(root, fullPath).replaceAll('\\', '/')
    if (shouldIgnore(relative)) continue
    if (entry.isDirectory()) {
      await walk(fullPath, files, root)
      continue
    }
    if (!isIndexable(relative)) continue
    const stat = await fs.stat(fullPath)
    if (stat.size > 150_000) continue
    const text = await fs.readFile(fullPath, 'utf8').catch(() => '')
    files.push({
      path: relative,
      text,
      size: stat.size,
      language: languageFor(relative),
      hash: crypto.createHash('sha256').update(text).digest('hex'),
    })
  }
}

function shouldIgnore(relative) {
  return /(^|\/)(node_modules|dist|build|\.next|coverage|vendor|\.git|target|__pycache__)(\/|$)/i.test(relative)
}

function isIndexable(relative) {
  return /\.(ts|tsx|js|jsx|py|go|rs|java|cs|php|rb|json|md|mdx|yml|yaml|toml|txt|css|scss|html|sql)$/i.test(relative)
}

function languageFor(relative) {
  const ext = relative.split('.').pop()?.toLowerCase()
  return {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    go: 'go',
    rs: 'rust',
    java: 'java',
    cs: 'csharp',
    rb: 'ruby',
    php: 'php',
    md: 'markdown',
  }[ext] ?? ext ?? 'text'
}

function authenticatedCloneUrl(url, token) {
  if (!token || !url?.startsWith('https://github.com/')) return url
  return url.replace('https://github.com/', `https://x-access-token:${encodeURIComponent(token)}@github.com/`)
}

async function generateEmbeddingsForIndex(repository, files, symbols) {
  const items = [
    ...files.slice(0, 40).map((file) => ({ type: 'file', id: null, text: `${file.path}\n${file.text.slice(0, 2500)}`, metadata: { repositoryId: repository.id, file: file.path } })),
    ...symbols.slice(0, 80).map((symbol) => ({ type: 'symbol', id: null, text: `${symbol.kind} ${symbol.name} in ${symbol.file}`, metadata: { repositoryId: repository.id, file: symbol.file, symbol: symbol.name } })),
  ]
  const saved = []
  for (const item of items) {
    const embedding = await createEmbedding(item.text)
    if (!embedding) continue
    const row = await saveEmbedding(item.type, item.id, item.text, item.metadata, embedding)
    saved.push(row)
  }
  return saved
}

async function createEmbedding(text) {
  const apiKey = process.env.EMBEDDING_API_KEY ?? process.env.FREE_LLM_API_KEY ?? process.env.GROQ_API_KEY
  const baseUrl = process.env.EMBEDDING_BASE_URL ?? process.env.FREE_LLM_BASE_URL
  const model = process.env.EMBEDDING_MODEL
  if (!apiKey || !baseUrl || !model) return null
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/embeddings`, {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model, input: text.slice(0, 8000) }),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.error?.message ?? `Embedding provider HTTP ${response.status}`)
  return payload?.data?.[0]?.embedding ?? null
}
