/**
 * apiKeyAuth.js
 * Middleware that reads the x-api-key header, resolves the project,
 * and attaches req.project = { id, name } for downstream use.
 *
 * All routes EXCEPT /api/projects/register must go through this middleware.
 * This is the foundation of MaxAuth's multi-tenancy architecture.
 */

import { resolveProjectFromApiKey } from '../services/project.service.js'
import { errorResponse } from '../utils/apiResponse.js'

/**
 * Express middleware — validates x-api-key and injects req.project.
 */
export const apiKeyAuth = async (req, res, next) => {
  try {
    const rawApiKey = req.headers['x-api-key']

    if (!rawApiKey) {
      return errorResponse(res, 'Missing or invalid API key', 401)
    }

    if (!rawApiKey.startsWith('mxa_')) {
      return errorResponse(res, 'Missing or invalid API key', 401)
    }

    let project
    try {
      project = await resolveProjectFromApiKey(rawApiKey)
    } catch {
      return errorResponse(res, 'Missing or invalid API key', 401)
    }

    // Inject project into request — all downstream controllers can use req.project.id
    req.project = {
      id: project.id,
      name: project.name,
      ownerEmail: project.ownerEmail,
      mfaEnabled: project.mfaEnabled || false,
      mfaMethod: project.mfaMethod || null
    }

    next()
  } catch (err) {
    next(err)
  }
}
