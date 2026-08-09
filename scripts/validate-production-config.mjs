import fs from 'node:fs'
import path from 'node:path'

const required = [
  'PUBLIC_WEB_URL',
  'PUBLIC_API_URL',
  'DATABASE_URL',
  'REDIS_URL',
  'SECRET_ENCRYPTION_KEY',
  'GITHUB_APP_ID',
  'GITHUB_APP_SLUG',
  'GITHUB_APP_PRIVATE_KEY',
  'GITHUB_WEBHOOK_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'FREE_LLM_API_KEY',
  'FREE_LLM_BASE_URL',
  'FREE_LLM_MODEL',
  'EMBEDDING_API_KEY',
  'EMBEDDING_BASE_URL',
  'EMBEDDING_MODEL',
]

const optionalFrontend = ['VITE_GITHUB_CLIENT_ID', 'VITE_GOOGLE_CLIENT_ID', 'VITE_API_BASE_URL', 'WEB_ORIGIN']
const env = { ...readEnv(path.resolve(process.cwd(), '.env.local')), ...process.env }
const missing = required.filter((key) => !env[key] || /replace-with|PROJECTMIND_API_HOST/.test(env[key]))
const frontendMissing = optionalFrontend.filter((key) => !env[key])

if (missing.length) {
  console.error(`Missing production config: ${missing.join(', ')}`)
  if (frontendMissing.length) console.error(`Frontend config still blank: ${frontendMissing.join(', ')}`)
  process.exit(1)
}

console.log('Production config has all required keys.')
if (frontendMissing.length) console.log(`Optional frontend keys still blank: ${frontendMissing.join(', ')}`)

function readEnv(file) {
  if (!fs.existsSync(file)) return {}
  return Object.fromEntries(
    fs.readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=')
        return [line.slice(0, index), unquote(line.slice(index + 1))]
      }),
  )
}

function unquote(value) {
  const trimmed = value.trim()
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    try {
      return JSON.parse(trimmed)
    } catch {
      return trimmed.slice(1, -1)
    }
  }
  return trimmed
}
