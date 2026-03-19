/**
 * passkey.controller.js
 * Imports: services/passkey.service.js, services/token.service.js,
 *          services/session.service.js, utils/apiResponse.js
 * Imported by: routes/passkey.routes.js
 */

import {
  registerPasskeyStart,
  registerPasskeyFinish,
  loginPasskeyStart,
  loginPasskeyFinish
} from '../services/passkey.service.js'
import { generateTokens } from '../services/token.service.js'
import { generateMFAToken } from '../services/mfa.service.js'
import { createUserSession } from '../services/session.service.js'
import { successResponse, errorResponse } from '../utils/apiResponse.js'

// ─── Registration ─────────────────────────────────────────────────────────────

export const startPasskeyRegistration = async (req, res, next) => {
  try {
    const { userId } = req.user
    const projectId = req.project.id
    const options = await registerPasskeyStart({ userId, projectId })
    return successResponse(res, 'Registration options generated', { options }, 200)
  } catch (err) {
    next(err)
  }
}

export const finishPasskeyRegistration = async (req, res, next) => {
  try {
    const { userId } = req.user
    const response = req.body
    const projectId = req.project.id

    await registerPasskeyFinish({ userId, response, projectId })
    return successResponse(res, 'Passkey registered successfully', {}, 200)
  } catch (err) {
    if (err.message.includes('verification')) {
      return errorResponse(res, err.message, 400)
    }
    next(err)
  }
}

// ─── Authentication ───────────────────────────────────────────────────────────

export const startPasskeyLogin = async (req, res, next) => {
  try {
    const { userId } = req.body
    const projectId = req.project.id
    if (!userId) return errorResponse(res, 'userId is required', 422)

    const options = await loginPasskeyStart({ userId, projectId })
    return successResponse(res, 'Authentication options generated', { options }, 200)
  } catch (err) {
    next(err)
  }
}

export const finishPasskeyLogin = async (req, res, next) => {
  try {
    const { userId, response } = req.body
    const projectId = req.project.id
    if (!userId || !response) {
      return errorResponse(res, 'userId and response are required', 422)
    }

    const { verified, userId: verifiedUserId } = await loginPasskeyFinish({ userId, response, projectId })
    if (!verified) {
      return errorResponse(res, 'Passkey authentication failed', 401)
    }

    if (req.project.mfaEnabled) {
      const mfaToken = await generateMFAToken({ userId: verifiedUserId, projectId, method: 'passkey' })
      res.locals.userId = verifiedUserId
      res.locals.auditMetadata = { method: 'passkey', action: 'LOGIN_MFA_REQUIRED', projectId }
      return successResponse(res, 'MFA required', {
        mfaRequired: true,
        mfaToken,
        mfaMethod: req.project.mfaMethod || 'email_otp'
      })
    }

    const { accessToken, refreshToken } = await generateTokens({ userId: verifiedUserId, projectId })
    await createUserSession({
      userId: verifiedUserId,
      ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'] || '',
      projectId
    })

    res.locals.userId = verifiedUserId
    res.locals.auditMetadata = { method: 'passkey', action: 'LOGIN', projectId }

    return successResponse(res, 'Passkey login successful', { accessToken, refreshToken }, 200)
  } catch (err) {
    if (err.message.includes('authentication failed') || err.message.includes('not found') || err.message.includes('Invalid project')) {
      return errorResponse(res, err.message, 401)
    }
    next(err)
  }
}
