/**
 * magiclink.controller.js
 * Imports: services/magiclink.service.js, services/token.service.js,
 *          services/session.service.js, utils/apiResponse.js
 * Imported by: routes/magiclink.routes.js
 */

import { sendMagicLink, verifyMagicLink } from '../services/magiclink.service.js'
import { generateTokens } from '../services/token.service.js'
import { createUserSession } from '../services/session.service.js'
import { successResponse, errorResponse } from '../utils/apiResponse.js'

export const sendLink = async (req, res, next) => {
  try {
    const { email } = req.body
    const projectId = req.project.id
    if (!email) return errorResponse(res, 'Email is required', 422)

    await sendMagicLink({ email, projectId })

    return successResponse(res, 'Magic link sent. Check your inbox.', { email })
  } catch (err) {
    next(err)
  }
}

export const verifyLink = async (req, res, next) => {
  try {
    const { token } = req.query
    if (!token) return errorResponse(res, 'Token is required', 422)

    const { userId, email, projectId } = await verifyMagicLink({ token })

    const { accessToken, refreshToken } = await generateTokens({ userId, email, projectId })
    await createUserSession({
      userId,
      ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'] || '',
      projectId
    })

    res.locals.userId = userId
    res.locals.auditMetadata = { method: 'magic', projectId }

    return successResponse(res, 'Magic link verified. Logged in.', { accessToken, refreshToken })
  } catch (err) {
    if (
      err.message.includes('Invalid') ||
      err.message.includes('expired') ||
      err.message.includes('locked')
    ) {
      return errorResponse(res, err.message, 401)
    }
    next(err)
  }
}