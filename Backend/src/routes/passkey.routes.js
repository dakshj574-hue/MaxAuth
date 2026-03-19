/**
 * passkey.routes.js
 * Imports: express, controllers/passkey.controller.js,
 *          middlewares/auth.middleware.js, middlewares/auditLogger.js
 * Imported by: src/app.js
 *
 * Registration routes require a valid access token (user must be logged in to add a passkey).
 * Login routes are public (user is not yet authenticated).
 */

import { Router } from 'express'
import {
  startPasskeyRegistration,
  finishPasskeyRegistration,
  startPasskeyLogin,
  finishPasskeyLogin
} from '../controllers/passkey.controller.js'
import { verifyAccessToken } from '../middlewares/auth.middleware.js'
import { logAuditEvent } from '../middlewares/auditLogger.js'

const router = Router()

// POST /api/passkey/register/start  (requires auth — user must be signed in)
router.post(
  '/register/start',
  verifyAccessToken,
  startPasskeyRegistration
)

// POST /api/passkey/register/finish  (requires auth)
router.post(
  '/register/finish',
  verifyAccessToken,
  logAuditEvent('PASSKEY_REGISTER'),
  finishPasskeyRegistration
)

// POST /api/passkey/login/start  (public — user is not yet authenticated)
router.post(
  '/login/start',
  startPasskeyLogin
)

// POST /api/passkey/login/finish  (public)
router.post(
  '/login/finish',
  logAuditEvent('PASSKEY_LOGIN'),
  finishPasskeyLogin
)

export default router
