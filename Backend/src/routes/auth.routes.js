/**
 * auth.routes.js
 * Imports: express, controllers/auth.controller.js, middlewares/*,
 *          validators/auth.validator.js
 * Imported by: src/app.js
 *
 * Middleware order per route matters — do NOT reorder.
 */

import { Router } from 'express'
import { register, checkEmail, login, logout, getMe, sendMagiclink, verifyMagiclink } from '../controllers/auth.controller.js'
import { verifyAccessToken } from '../middlewares/auth.middleware.js'
import { rateLimiter, loginRateLimiter } from '../middlewares/rateLimiter.js'
import { checkLoginAttempts } from '../middlewares/attemptLimiter.js'
import { validateInput } from '../middlewares/validateInput.js'
import { logAuditEvent } from '../middlewares/auditLogger.js'
import {
  registerSchema,
  loginSchema,
  checkEmailSchema,
  logoutSchema
} from '../validators/auth.validator.js'

const router = Router()

// POST /api/auth/register
router.post(
  '/register',
  rateLimiter,
  validateInput(registerSchema),
  logAuditEvent('REGISTER'),
  register
)

// POST /api/auth/check-email  (step 1 of two-step login)
router.post(
  '/check-email',
  rateLimiter,
  validateInput(checkEmailSchema),
  checkEmail
)

// POST /api/auth/login  (step 2 — password auth)
router.post(
  '/login',
  loginRateLimiter,
  checkLoginAttempts,
  validateInput(loginSchema),
  logAuditEvent('LOGIN'),
  login
)

// POST /api/auth/logout
router.post(
  '/logout',
  verifyAccessToken,
  validateInput(logoutSchema),
  logAuditEvent('LOGOUT'),
  logout
)

// GET /api/auth/me
router.get(
  '/me',
  verifyAccessToken,
  getMe
)

// POST /api/auth/send-magiclink
router.post(
  '/send-magiclink',
  rateLimiter,
  validateInput(checkEmailSchema),
  logAuditEvent('SEND_MAGICLINK'),
  sendMagiclink
)

// POST /api/auth/verify-magiclink
router.post(
  '/verify-magiclink',
  loginRateLimiter,
  logAuditEvent('VERIFY_MAGICLINK'),
  verifyMagiclink
)



export default router
