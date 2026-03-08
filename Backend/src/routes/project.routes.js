/**
 * project.routes.js
 * Routes for project/tenant management — NO apiKeyAuth here.
 * This is the bootstrap endpoint that creates projects and issues API keys.
 * Imported by: src/app.js
 */

import { Router } from 'express'
import { registerProjectHandler, listProjectsHandler, deleteProjectHandler, getSettings, updateSettings } from '../controllers/project.controller.js'
import { apiKeyAuth } from '../middlewares/apiKeyAuth.js'

const router = Router()

// POST /api/projects/register — public, no API key required (creates the project itself)
router.post('/register', registerProjectHandler)

// GET /api/projects?ownerEmail= — list projects for an owner
router.get('/', listProjectsHandler)

// GET /api/projects/settings - get project settings (requires API key)
router.get('/settings', apiKeyAuth, getSettings)

// PATCH /api/projects/settings - update project settings (requires API key)
router.patch('/settings', apiKeyAuth, updateSettings)

// DELETE /api/projects/:projectId — deactivate a project
router.delete('/:projectId', deleteProjectHandler)

export default router
