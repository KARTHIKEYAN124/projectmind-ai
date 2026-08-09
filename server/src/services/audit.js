const auditEvents = []

export function recordAudit(actor, action, metadata = {}) {
  const event = {
    id: cryptoRandomId(),
    actor: actor ?? 'system',
    action,
    metadata,
    createdAt: new Date().toISOString(),
  }
  auditEvents.unshift(event)
  return event
}

export function listAuditEvents() {
  return auditEvents.slice(0, 200)
}

function cryptoRandomId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}
