/**
 * suspicious.routes.js
 */

import { Router } from 'express'
import { listSuspiciousEvents } from '../controllers/suspicious.controller.js'
import { logAuditEvent } from '../middlewares/auditLogger.js'

const router = Router()

// GET /api/suspicious
router.get(
  '/',
  logAuditEvent('VIEW_SUSPICIOUS_EVENTS'),
  listSuspiciousEvents
)

export default router
