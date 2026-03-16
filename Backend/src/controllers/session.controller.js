/**
 * session.controller.js
 * Imports: services/session.service.js, utils/apiResponse.js
 * Imported by: routes/session.routes.js
 */

import { getUserSessions, getAllProjectSessions, revokeSession } from '../services/session.service.js'
import { successResponse, errorResponse } from '../utils/apiResponse.js'

export const listSessions = async (req, res, next) => {
  try {
    const { userId } = req.user
    const projectId = req.project.id
    const sessions = await getUserSessions(userId, projectId)
    return successResponse(res, 'Sessions fetched', { sessions }, 200)
  } catch (err) {
    next(err)
  }
}

// Added for ADMIN DASHBOARD (Task 4)
export const listAllSessions = async (req, res, next) => {
  try {
    const projectId = req.project.id // from API KEY
    const sessions = await getAllProjectSessions(projectId)
    return successResponse(res, 'All active sessions fetched', { sessions }, 200)
  } catch (err) {
    next(err)
  }
}

export const deleteSession = async (req, res, next) => {
  try {
    const { userId } = req.user
    const { sessionId } = req.params
    const projectId = req.project.id

    // Check if it's admin/API key revocation without an access token
    // In our architecture, both access token (user) or just API key (admin) can hit this if we set routes up this way.
    // Assuming user is trying to delete:
    await revokeSession({ sessionId, userId, projectId })

    res.locals.userId = userId
    res.locals.auditMetadata = { sessionId, projectId }

    return successResponse(res, 'Session revoked', {}, 200)
  } catch (err) {
    if (err.message === 'Session not found') {
      return errorResponse(res, 'Session not found', 404)
    }
    if (err.message === 'Unauthorized session revocation') {
      return errorResponse(res, 'You do not own this session', 403)
    }
    if (err.message === 'Session does not belong to project') {
      return errorResponse(res, 'Session does not belong to your project', 403)
    }
    next(err)
  }
}

// Added for ADMIN DASHBOARD (Task 4) - Delete any session by ID
export const adminDeleteSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params
    const projectId = req.project.id

    await revokeSession({ sessionId, userId: null, projectId }) // pass null for userId to bypass user check

    res.locals.userId = 'admin'
    res.locals.auditMetadata = { sessionId, projectId, action: 'ADMIN_REVOKE' }

    return successResponse(res, 'Session forcefully revoked', {}, 200)
  } catch (err) {
    if (err.message === 'Session not found') {
      return errorResponse(res, 'Session not found', 404)
    }
    if (err.message === 'Session does not belong to project') {
      return errorResponse(res, 'Session does not belong to your project', 403)
    }
    next(err)
  }
}
