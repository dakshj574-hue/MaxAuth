/**
 * token.routes.js
 * Imports: express, controllers/token.controller.js, middlewares/rateLimiter.js
 * Imported by: src/app.js
 */

import { Router } from 'express'
import { refresh } from '../controllers/token.controller.js'
import { rateLimiter } from '../middlewares/rateLimiter.js'

const router = Router()

// POST /api/token/refresh
router.post(
  '/refresh',
  rateLimiter,
  refresh
)

export default router
