/**
 * jwt.js
 * Imports: jsonwebtoken, config/env.js
 * Imported by: services/token.service.js, services/magiclink.service.js, middlewares/auth.middleware.js
 * Pure utility — no DB, no req/res
 */

import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

/**
 * Signs a short-lived access token.
 * @param {{ userId: string, email: string }} payload
 * @returns {string} signed JWT
 */
export const signAccessToken = (payload, secret = env.JWT_ACCESS_SECRET, expiresIn = env.JWT_ACCESS_EXPIRY) => {
  try {
    return jwt.sign(payload, secret, { expiresIn })
  } catch (err) {
    throw new Error(`Access token signing failed: ${err.message}`)
  }
}

/**
 * Signs a long-lived refresh token.
 * @param {{ userId: string }} payload
 * @returns {string} signed JWT
 */
export const signRefreshToken = (payload) => {
  try {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRY
    })
  } catch (err) {
    throw new Error(`Refresh token signing failed: ${err.message}`)
  }
}

/**
 * Verifies and decodes a JWT using the provided secret.
 * Throws if token is invalid or expired.
 * @param {string} token
 * @param {string} secret
 * @returns {object} decoded payload
 */
export const verifyToken = (token, secret = env.JWT_ACCESS_SECRET) => {
  try {
    return jwt.verify(token, secret)
  } catch (err) {
    throw err  // preserve err.name (TokenExpiredError, JsonWebTokenError) for callers
  }
}
