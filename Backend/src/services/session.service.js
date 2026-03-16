/**
 * session.service.js
 * Imports: models/session.model.js, utils/deviceInfo.js
 * Imported by: controllers/session.controller.js, controllers/auth.controller.js
 */

import {
  createSession,
  findSessionsByUserId,
  findSessionById,
  deactivateSession,
  deactivateAllUserSessions,
  updateSessionLastUsed,
  findAllActiveSessions
} from '../models/session.model.js'
import { parseDeviceInfo } from '../utils/deviceInfo.js'

export const createUserSession = async ({ userId, ip, userAgent, projectId }) => {
  try {
    const deviceInfo = parseDeviceInfo(userAgent)

    const session = await createSession({
      userId,
      projectId,
      deviceInfo: {
        ...deviceInfo,
        ip: ip || 'unknown'
      }
    })

    return session
  } catch (err) {
    throw new Error(`Failed to create session: ${err.message}`)
  }
}

export const getUserSessions = async (userId, projectId) => {
  try {
    const sessions = await findSessionsByUserId(userId, projectId)
    return sessions
  } catch (err) {
    throw new Error(`Failed to fetch sessions: ${err.message}`)
  }
}

export const getAllProjectSessions = async (projectId) => {
  try {
    return await findAllActiveSessions(projectId)
  } catch (err) {
    throw new Error(`Failed to fetch all sessions: ${err.message}`)
  }
}

export const revokeSession = async ({ sessionId, userId, projectId }) => {
  try {
    const session = await findSessionById(sessionId)
    if (!session) throw new Error('Session not found')
    // Provide an option to bypass userId check if it's admin/project revocation
    if (userId && session.userId !== userId) throw new Error('Unauthorized session revocation')
    if (projectId && session.projectId !== projectId) throw new Error('Session does not belong to project')

    await deactivateSession(sessionId)
    return true
  } catch (err) {
    throw new Error(`Failed to revoke session: ${err.message}`)
  }
}

export const revokeAllSessions = async (userId, projectId) => {
  try {
    await deactivateAllUserSessions(userId, projectId)
    return true
  } catch (err) {
    throw new Error(`Failed to revoke all sessions: ${err.message}`)
  }
}

export const refreshSessionActivity = async (sessionId) => {
  try {
    await updateSessionLastUsed(sessionId)
    return true
  } catch (err) {
    throw new Error(`Failed to update session activity: ${err.message}`)
  }
}
