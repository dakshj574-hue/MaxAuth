/**
 * project.controller.js
 * Handles req/res for project management endpoints.
 * Imported by: routes/project.routes.js
 */

import { registerProject, listOwnerProjects, removeProject, getProjectSettings, updateProjectSettings } from '../services/project.service.js'
import { successResponse, errorResponse } from '../utils/apiResponse.js'

/**
 * POST /api/projects/register
 * Body: { name, ownerEmail }
 * Returns: { project, apiKey } — apiKey shown only once!
 */
export const registerProjectHandler = async (req, res, next) => {
  try {
    const { name, ownerEmail } = req.body
    if (!name || !ownerEmail) {
      return errorResponse(res, 'name and ownerEmail are required', 400)
    }

    const result = await registerProject({ name, ownerEmail })

    return successResponse(res, 'Project registered. Save your API key — it will not be shown again.', result, 201)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/projects?ownerEmail=
 * Query: { ownerEmail }
 */
export const listProjectsHandler = async (req, res, next) => {
  try {
    const { ownerEmail } = req.query
    if (!ownerEmail) {
      return errorResponse(res, 'ownerEmail query param is required', 400)
    }

    const projects = await listOwnerProjects(ownerEmail)
    return successResponse(res, 'Projects fetched', { projects })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/projects/:projectId
 */
export const deleteProjectHandler = async (req, res, next) => {
  try {
    const { projectId } = req.params
    await removeProject(projectId)
    return successResponse(res, 'Project deactivated')
  } catch (err) {
    if (err.message.includes('not found')) {
      return errorResponse(res, 'Project not found', 404)
    }
    next(err)
  }
}

/**
 * GET /api/projects/settings
 * Requires: x-api-key header (apiKeyAuth middleware)
 */
export const getSettings = async (req, res, next) => {
  try {
    const projectId = req.project.id
    const settings = await getProjectSettings(projectId)
    return successResponse(res, 'Project settings retrieved successfully', settings)
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/projects/settings
 * Requires: x-api-key header (apiKeyAuth middleware)
 * Body: { mfaEnabled: boolean, mfaMethod: string }
 */
export const updateSettings = async (req, res, next) => {
  try {
    const projectId = req.project.id
    const { mfaEnabled, mfaMethod } = req.body

    // Validation
    if (mfaEnabled !== undefined && typeof mfaEnabled !== 'boolean') {
      return errorResponse(res, 'mfaEnabled must be a boolean', 400)
    }
    
    if (mfaMethod !== undefined) {
      if (mfaMethod !== 'email_otp' && mfaMethod !== 'phone_otp') {
        return errorResponse(res, 'mfaMethod must be either email_otp or phone_otp', 400)
      }
    }

    const updates = {}
    if (mfaEnabled !== undefined) updates.mfaEnabled = mfaEnabled
    if (mfaMethod !== undefined) updates.mfaMethod = mfaMethod

    const updatedSettings = await updateProjectSettings(projectId, updates)
    return successResponse(res, 'Project settings updated successfully', {
      mfaEnabled: updatedSettings.mfaEnabled,
      mfaMethod: updatedSettings.mfaMethod
    })
  } catch (err) {
    next(err)
  }
}
