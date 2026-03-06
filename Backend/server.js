/**
 * @file server.js
 * @description HTTP server entry point for SecureAuth.
 *              Boots the Express app and binds it to a port.
 *              This is the ONLY file that calls app.listen().
 *
 * IMPORTS FROM:
 *   - ./src/app.js        (Member C — Express app with all middleware + routes)
 *   - ./src/config/env.js (Member C — validated environment variables)
 *
 * IMPORTED BY:
 *   - Nothing — this is the top-level entry point.
 *               Started via: node server.js  or  npm start
 *
 * ⚠️  RULES:
 *   - Never import process.env directly — always use env.js.
 *   - Never register routes or middleware here — that belongs in app.js.
 *   - Never initialize Firebase here — that is handled inside app.js.
 *   - Unhandled rejections and uncaught exceptions must be caught here
 *     so the process exits cleanly with a logged reason.
 */

import app from './src/app.js'
import { env } from './src/config/env.js'

// ── Unhandled Rejection Guard ─────────────────────────────────────────────────

/**
 * Catches any Promise rejection that was not caught by a try/catch block.
 * In an async Express app this is the last safety net.
 * Logs the reason and exits — letting the process manager (e.g. PM2) restart.
 */
process.on('unhandledRejection', (reason) => {
  console.error('[SecureAuth] Unhandled Promise Rejection:', reason)
  process.exit(1)
})

/**
 * Catches synchronous exceptions that escaped all try/catch blocks.
 * Should never fire in normal operation — signals a programming error.
 */
process.on('uncaughtException', (err) => {
  console.error('[SecureAuth] Uncaught Exception:', err.message)
  process.exit(1)
})

// ── Server Bootstrap ──────────────────────────────────────────────────────────

/**
 * Start the HTTP server on the port defined in env.js (default 5000).
 * All middleware, routes, and Firebase init are already wired inside app.js
 * by the time listen() is called.
 */
const server = app.listen(env.PORT, () => {
  console.log('─────────────────────────────────────────')
  console.log(`  SecureAuth API`)
  console.log(`  Environment : ${env.NODE_ENV}`)
  console.log(`  Port        : ${env.PORT}`)
  console.log(`  Health      : http://localhost:${env.PORT}/health`)
  console.log('─────────────────────────────────────────')
})

// ── Graceful Shutdown ─────────────────────────────────────────────────────────

/**
 * SIGTERM is sent by process managers (Docker, PM2, Kubernetes) on shutdown.
 * Close the server gracefully — finish in-flight requests before exiting.
 */
process.on('SIGTERM', () => {
  console.log('[SecureAuth] SIGTERM received — shutting down gracefully')
  server.close(() => {
    console.log('[SecureAuth] Server closed. Exiting.')
    process.exit(0)
  })
})

/**
 * SIGINT is sent when the developer presses Ctrl+C in the terminal.
 * Same graceful shutdown as SIGTERM.
 */
process.on('SIGINT', () => {
  console.log('[SecureAuth] SIGINT received — shutting down gracefully')
  server.close(() => {
    console.log('[SecureAuth] Server closed. Exiting.')
    process.exit(0)
  })
})

export default server
