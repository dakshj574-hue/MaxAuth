/**
 * session.routes.js
 */

import { Router } from 'express'
import { listSessions, listAllSessions, deleteSession, adminDeleteSession } from '../controllers/session.controller.js'
import { verifyAccessToken } from '../middlewares/auth.middleware.js'
import { logAuditEvent } from '../middlewares/auditLogger.js'

const router = Router()

// GET /api/sessions/admin — (Admin Dashboard) List all active sessions for project
router.get(
  '/admin',
  listAllSessions
)

// DELETE /api/sessions/admin/:sessionId — (Admin Dashboard) Delete any session for project
router.delete(
  '/admin/:sessionId',
  logAuditEvent('ADMIN_SESSION_REVOKE'),
  adminDeleteSession
)

// GET /api/sessions — (User) List current user's sessions
router.get(
  '/',
  verifyAccessToken,
  listSessions
)

// DELETE /api/sessions/:sessionId — (User) Revoke own session
router.delete(
  '/:sessionId',
  verifyAccessToken,
  logAuditEvent('SESSION_REVOKE'),
  deleteSession
)

export default router
