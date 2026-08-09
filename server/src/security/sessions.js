import crypto from 'node:crypto'

const sessions = new Map()

export function createSession(user) {
  const token = crypto.randomBytes(32).toString('base64url')
  sessions.set(token, { user, createdAt: new Date().toISOString() })
  return token
}

export function requireSession(request, response, next) {
  const bearer = request.headers.authorization?.replace(/^Bearer\s+/i, '')
  const cookieToken = request.headers.cookie?.match(/pm_session=([^;]+)/)?.[1]
  const token = bearer || cookieToken
  const session = token ? sessions.get(token) : null
  if (!session) {
    response.status(401).json({ error: 'Authentication required.' })
    return
  }
  request.session = session
  next()
}

export function issueSessionResponse(response, user) {
  const token = createSession(user)
  response.cookie?.('pm_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  response.json({ token, user })
}

export function encryptSecret(value) {
  const key = crypto.createHash('sha256').update(process.env.SECRET_ENCRYPTION_KEY ?? 'dev-only-change-me').digest()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, ciphertext]).toString('base64url')
}
