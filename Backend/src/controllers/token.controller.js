/**
 * token.controller.js
 * Handles req/res only — zero business logic
 */

import { refreshAccessToken } from '../services/token.service.js'
import { successResponse, errorResponse } from '../utils/apiResponse.js'

/**
 * POST /api/token/refresh
 */
export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    const projectId = req.project.id

    if (!refreshToken) {
      return res.status(422).json(errorResponse('Refresh token is required'))
    }

    const { accessToken } = await refreshAccessToken(refreshToken, projectId)

    return res.status(200).json(
      successResponse('Access token refreshed', { accessToken })
    )
  } catch (err) {
    const msg = err.message

    if (
      msg.includes('Invalid') ||
      msg.includes('expired') ||
      msg.includes('revoked') ||
      msg.includes('not found') ||
      msg.includes('mismatch')
    ) {
      return res.status(401).json(errorResponse(msg))
    }
    next(err)
  }
}
