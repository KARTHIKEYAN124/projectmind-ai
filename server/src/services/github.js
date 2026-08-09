import crypto from 'node:crypto'

export function githubAppInstallUrl() {
  const appSlug = process.env.GITHUB_APP_SLUG
  if (!appSlug) return null
  const state = crypto.randomBytes(16).toString('hex')
  return `https://github.com/apps/${appSlug}/installations/new?state=${state}`
}

export async function exchangeOAuthCode(provider, code) {
  if (!code) throw new Error('OAuth code is required.')
  return {
    provider,
    externalId: `${provider}-${code.slice(0, 8)}`,
    email: `${provider}-user@example.com`,
    name: `${provider[0].toUpperCase()}${provider.slice(1)} User`,
    role: 'owner',
  }
}

export function verifyGitHubWebhook(request) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET
  if (!secret) return { ok: false, reason: 'GITHUB_WEBHOOK_SECRET missing.' }
  const signature = request.headers['x-hub-signature-256']
  if (!signature) return { ok: false, reason: 'Missing signature.' }
  const body = JSON.stringify(request.body)
  const expected = `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`
  try {
    const ok = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    return ok ? { ok: true } : { ok: false, reason: 'Invalid signature.' }
  } catch {
    return { ok: false, reason: 'Invalid signature length.' }
  }
}
