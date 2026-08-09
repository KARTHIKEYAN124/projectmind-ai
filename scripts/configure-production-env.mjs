import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const target = path.resolve(process.cwd(), '.env.local')

const defaults = {
  VITE_GITHUB_CLIENT_ID: '',
  VITE_GOOGLE_CLIENT_ID: '',
  VITE_API_BASE_URL: 'http://localhost:8787',
  PUBLIC_WEB_URL: 'http://localhost:5173',
  PUBLIC_API_URL: 'http://localhost:8787',
  FREE_LLM_API_KEY: '',
  FREE_LLM_BASE_URL: 'https://api.groq.com/openai/v1',
  FREE_LLM_MODEL: 'llama-3.3-70b-versatile',
  DATABASE_URL: 'postgres://projectmind:projectmind@localhost:5432/projectmind',
  REDIS_URL: 'redis://localhost:6379',
  SECRET_ENCRYPTION_KEY: randomSecret(48),
  GITHUB_APP_ID: '',
  GITHUB_APP_SLUG: '',
  GITHUB_APP_PRIVATE_KEY: '',
  GITHUB_WEBHOOK_SECRET: randomSecret(32),
  GITHUB_CLIENT_ID: '',
  GITHUB_CLIENT_SECRET: '',
  GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: '',
  PORT: '8787',
  WEB_ORIGIN: 'http://localhost:5173',
}

const existing = readEnv(target)
const merged = { ...defaults, ...existing }
const body = Object.entries(merged)
  .map(([key, value]) => `${key}=${formatEnvValue(value)}`)
  .join('\n')

fs.writeFileSync(target, `${body}\n`, { encoding: 'utf8', mode: 0o600 })

const generated = [
  existing.SECRET_ENCRYPTION_KEY ? null : 'SECRET_ENCRYPTION_KEY',
  existing.GITHUB_WEBHOOK_SECRET ? null : 'GITHUB_WEBHOOK_SECRET',
].filter(Boolean)

console.log(`Updated ${path.relative(process.cwd(), target)}.`)
console.log(generated.length ? `Generated local secrets: ${generated.join(', ')}.` : 'No new local secrets were generated.')
console.log('Provider credentials were left blank for GitHub, Google, and the LLM provider.')

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

function randomSecret(bytes) {
  return crypto.randomBytes(bytes).toString('base64url')
}

function formatEnvValue(value) {
  if (/[\n\r#"' ]/.test(value)) return JSON.stringify(value)
  return value
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
