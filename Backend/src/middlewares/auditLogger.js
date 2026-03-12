/**
 * auditLogger.js
 * Imports: models/auditLog.model.js
 * Imported by: routes/auth.routes.js, routes/session.routes.js, etc.
 *
 * Usage in routes:
 *   router.post('/login', ..., logAuditEvent('LOGIN_ATTEMPT'), authController.login)
 *
 * The controller should set res.locals.auditMeta = { userId, status, metadata }
 * before calling next() so the after-response hook can enrich the log.
 *
 * As a before-controller middleware it records the attempt;
 * enriched data (userId, result) are set by the controller via res.locals.
 */

import { createAuditLog } from '../models/auditLog.model.js'

/**
 * Factory — returns middleware tagged with an action name.
 * @param {string} action  e.g. 'REGISTER', 'LOGIN', 'LOGOUT'
 */
export const logAuditEvent = (action) => async (req, res, next) => {
  // Hook into response to log after controller runs
  const originalJson = res.json.bind(res)

  res.json = async (body) => {
    try {
      const userId = res.locals.userId || req.user?.userId || null
      const status = body?.success ? 'SUCCESS' : 'FAILURE'
      const metadata = res.locals.auditMetadata || {}

      await createAuditLog({
        userId,
        action,
        ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        status,
        metadata
      })
    } catch {
      // Audit logging must never crash the response
    }

    return originalJson(body)
  }

  next()
}
