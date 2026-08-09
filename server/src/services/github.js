import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'

export function githubAppInstallUrl() {
  const appSlug = process.env.GITHUB_APP_SLUG
  if (!appSlug) return null
  const state = crypto.randomBytes(16).toString('hex')
  return `https://github.com/apps/${appSlug}/installations/new?state=${state}`
}

export async function exchangeOAuthCode(provider, code) {
  if (!code) throw new Error('OAuth code is required.')
  if (provider === 'github') return exchangeGitHubOAuthCode(code)
  if (provider === 'google') return exchangeGoogleOAuthCode(code)
  throw new Error(`Unsupported OAuth provider: ${provider}`)
}

export async function exchangeGitHubOAuthCode(code) {
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('GitHub OAuth credentials are not configured.')

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  })
  const tokenPayload = await tokenResponse.json()
  if (!tokenResponse.ok || !tokenPayload.access_token) throw new Error(tokenPayload.error_description ?? 'GitHub OAuth token exchange failed.')

  const userResponse = await fetch('https://api.github.com/user', {
    headers: { authorization: `Bearer ${tokenPayload.access_token}`, accept: 'application/vnd.github+json' },
  })
  const githubUser = await userResponse.json()
  if (!userResponse.ok) throw new Error(githubUser.message ?? 'GitHub user lookup failed.')

  const emailResponse = await fetch('https://api.github.com/user/emails', {
    headers: { authorization: `Bearer ${tokenPayload.access_token}`, accept: 'application/vnd.github+json' },
  })
  const emails = emailResponse.ok ? await emailResponse.json() : []
  const primaryEmail = Array.isArray(emails) ? emails.find((item) => item.primary)?.email ?? emails[0]?.email : null

  return {
    provider: 'github',
    externalId: String(githubUser.id),
    email: primaryEmail ?? `${githubUser.login}@users.noreply.github.com`,
    name: githubUser.name ?? githubUser.login,
    role: 'owner',
    accessToken: tokenPayload.access_token,
  }
}

export async function exchangeGoogleOAuthCode(code) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? `${process.env.PUBLIC_API_URL ?? 'http://localhost:8787'}/api/auth/google/callback`
  if (!clientId || !clientSecret) throw new Error('Google OAuth credentials are not configured.')

  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  })
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: params,
  })
  const tokenPayload = await tokenResponse.json()
  if (!tokenResponse.ok || !tokenPayload.access_token) throw new Error(tokenPayload.error_description ?? 'Google OAuth token exchange failed.')

  const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { authorization: `Bearer ${tokenPayload.access_token}` },
  })
  const googleUser = await userResponse.json()
  if (!userResponse.ok) throw new Error(googleUser.error_description ?? 'Google user lookup failed.')

  return {
    provider: 'google',
    externalId: googleUser.sub,
    email: googleUser.email,
    name: googleUser.name ?? googleUser.email,
    role: 'owner',
    accessToken: tokenPayload.access_token,
  }
}

export function createGitHubAppJwt() {
  const appId = process.env.GITHUB_APP_ID
  const privateKey = normalizePrivateKey(process.env.GITHUB_APP_PRIVATE_KEY)
  if (!appId || !privateKey) throw new Error('GitHub App credentials are not configured.')
  const now = Math.floor(Date.now() / 1000)
  return jwt.sign(
    {
      iat: now - 60,
      exp: now + 9 * 60,
      iss: appId,
    },
    privateKey,
    { algorithm: 'RS256' },
  )
}

export async function createInstallationToken(installationId) {
  const appJwt = createGitHubAppJwt()
  const response = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${appJwt}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
    },
  })
  const payload = await response.json()
  if (!response.ok || !payload.token) throw new Error(payload.message ?? 'GitHub installation token creation failed.')
  return payload
}

export async function listInstallationRepositories(installationId) {
  const installationToken = await createInstallationToken(installationId)
  const response = await fetch('https://api.github.com/installation/repositories', {
    headers: {
      authorization: `Bearer ${installationToken.token}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
    },
  })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.message ?? 'GitHub repository listing failed.')
  return payload.repositories ?? []
}

export async function fetchRepositoryHistory(owner, repo, token) {
  const headers = {
    authorization: `Bearer ${token}`,
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
  }
  const [pullRequests, issues, commits] = await Promise.all([
    githubJson(`https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=50`, headers),
    githubJson(`https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=50`, headers),
    githubJson(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=50`, headers),
  ])
  return {
    pullRequests,
    issues: issues.filter((item) => !item.pull_request),
    commits,
  }
}

async function githubJson(url, headers) {
  const response = await fetch(url, { headers })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.message ?? `GitHub API failed for ${url}`)
  return payload
}

export function verifyGitHubWebhook(request) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET
  if (!secret) return { ok: false, reason: 'GITHUB_WEBHOOK_SECRET missing.' }
  const signature = request.headers['x-hub-signature-256']
  if (!signature) return { ok: false, reason: 'Missing signature.' }
  const body = request.rawBody ?? JSON.stringify(request.body)
  const expected = `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`
  try {
    const ok = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    return ok ? { ok: true } : { ok: false, reason: 'Invalid signature.' }
  } catch {
    return { ok: false, reason: 'Invalid signature length.' }
  }
}

function normalizePrivateKey(value) {
  if (!value) return ''
  return value.replace(/\\n/g, '\n')
}
