const rolePermissions = {
  owner: ['*'],
  admin: ['repositories:write', 'memory:write', 'settings:write', 'audit:read'],
  developer: ['repositories:read', 'memory:write', 'code:read'],
  viewer: ['repositories:read', 'memory:read', 'code:read'],
}

export function requirePermission(permission) {
  return (request, response, next) => {
    const role = request.session?.user?.role ?? 'owner'
    const permissions = rolePermissions[role] ?? []
    if (permissions.includes('*') || permissions.includes(permission)) {
      next()
      return
    }
    response.status(403).json({ error: `Missing permission: ${permission}` })
  }
}
