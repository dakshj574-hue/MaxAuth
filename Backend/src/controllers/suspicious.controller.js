/**
 * suspicious.controller.js
 */

import { getProjectSuspiciousEvents } from '../services/suspicious.service.js'
import { successResponse, errorResponse } from '../utils/apiResponse.js'

export const listSuspiciousEvents = async (req, res, next) => {
  try {
    const projectId = req.project.id
    const events = await getProjectSuspiciousEvents(projectId)
    return successResponse(res, 'Suspicious events fetched', { events }, 200)
  } catch (err) {
    next(err)
  }
}
