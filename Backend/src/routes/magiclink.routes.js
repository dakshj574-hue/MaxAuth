/**
 * magiclink.routes.js
 * Imports: express, controllers/magiclink.controller.js,
 *          middlewares/rateLimiter.js, middlewares/auditLogger.js
 * Imported by: src/app.js
 *
 * Note: verify is a GET with ?token= query param — not a POST.
 */

import { Router } from 'express'
import { sendLink, verifyLink } from '../controllers/magiclink.controller.js'
import { rateLimiter } from '../middlewares/rateLimiter.js'
import { logAuditEvent } from '../middlewares/auditLogger.js'

const router = Router()

// POST /api/magic/send
router.post(
  '/send',
  rateLimiter,
  logAuditEvent('MAGIC_LINK_SEND'),
  sendLink
)

// GET /api/magic/verify?token=
router.get(
  '/verify',
  logAuditEvent('MAGIC_LINK_VERIFY'),
  verifyLink
)

export default router
