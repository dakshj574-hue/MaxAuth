/**
 * @file src/app.js
 * @description Express application bootstrap
 */

import { env } from './config/env.js'
import express from 'express'
import helmet from 'helmet'
import path from 'path'
import { fileURLToPath } from 'url'
import { corsMiddleware } from './config/cors.js'
import './config/firebase.js'
import { errorResponse } from './utils/apiResponse.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ── Routes ────────────────────────────────────────────────────────────────────
import projectRoutes from './routes/project.routes.js'
import authRoutes from './routes/auth.routes.js'
import tokenRoutes from './routes/token.routes.js'
import sessionRoutes from './routes/session.routes.js'
import magiclinkRoutes from './routes/magiclink.routes.js'
import passkeyRoutes from './routes/passkey.routes.js'
import suspiciousRoutes from './routes/suspicious.routes.js'
import otpRoutes from './routes/otp.routes.js'
import mfaRoutes from './routes/mfa.routes.js'
import { apiKeyAuth } from './middlewares/apiKeyAuth.js'

const app = express()

// ── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}))

app.use(corsMiddleware)

// ── Body Parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'SecureAuth API is running', data: {} })
})

// ── API Routes (NO API KEY REQUIRED) ──────────────────────────────────────────
// Projects bootstrap endpoint (to create a project and get API key)
app.use('/api/projects', projectRoutes)

// ── Multi-tenant API Key Enforcement ──────────────────────────────────────────
// All downstream routes require a valid x-api-key header
app.use('/api', apiKeyAuth)

// ── API Routes (API KEY REQUIRED) ─────────────────────────────────────────────

app.use('/api/auth', authRoutes)
app.use('/api/token', tokenRoutes)
app.use('/api/sessions', sessionRoutes)
app.use('/api/magic', magiclinkRoutes)
app.use('/api/passkey', passkeyRoutes)
app.use('/api/suspicious', suspiciousRoutes)
app.use('/api/otp', otpRoutes)
app.use('/api/mfa', mfaRoutes)

// ── Static Frontend Serving ───────────────────────────────────────────────────
const frontendDistPath = path.resolve(__dirname, '../../../../../Frontend/maxauth/dist')
app.use(express.static(frontendDistPath))

// ── Fallback Handler ──────────────────────────────────────────────────────────
app.use((req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return errorResponse(res, `Route '${req.method} ${req.originalUrl}' not found`, 404)
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'))
})

// ── Global Error Handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(`[SecureAuth Error] ${err.message}`, {
    method: req.method,
    url: req.originalUrl,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined
  })

  // CORS errors
  if (err.message && err.message.startsWith('CORS:')) {
    return errorResponse(res, err.message, 403)
  }

  if (err.type === 'entity.parse.failed') {
    return errorResponse(res, 'Invalid JSON in request body', 400)
  }
  if (err.type === 'entity.too.large') {
    return errorResponse(res, 'Request payload too large', 413)
  }

  const statusCode = err.statusCode || err.status || 500
  const message = env.NODE_ENV === 'production' ? 'Internal server error' : err.message

  return errorResponse(res, message, statusCode)
})

export default app
