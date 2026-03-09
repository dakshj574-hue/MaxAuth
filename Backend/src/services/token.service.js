/**
 * token.service.js
 * Imports: models/token.model.js, utils/jwt.js, utils/hash.js, config/env.js
 * Imported by: controllers/auth.controller.js, controllers/token.controller.js
 */

import {
  findTokenByHash,
  createRefreshToken,
  revokeToken,
  revokeAllUserTokens
} from '../models/token.model.js'
import { signAccessToken, signRefreshToken, verifyToken } from '../utils/jwt.js'
import { hashPassword } from '../utils/hash.js'
import { env } from '../config/env.js'

const hashToken = async (token) => {
  return hashPassword(token)
}

export const generateTokens = async ({ userId, email = '', projectId }) => {
  try {
    const accessToken = signAccessToken({ userId, email, projectId })
    const refreshToken = signRefreshToken({ userId, projectId })

    const tokenHash = await hashToken(refreshToken)
    const expiryMs = parseDurationToMs(env.JWT_REFRESH_EXPIRY)
    const expiresAt = new Date(Date.now() + expiryMs)

    await createRefreshToken({ userId, token: tokenHash, expiresAt, projectId })

    return { accessToken, refreshToken }
  } catch (err) {
    throw new Error(`Token generation failed: ${err.message}`)
  }
}

export const refreshAccessToken = async (refreshToken, projectId) => {
  try {
    let payload
    try {
      payload = verifyToken(refreshToken, env.JWT_REFRESH_SECRET)
    } catch {
      throw new Error('Invalid or expired refresh token')
    }

    if (payload.projectId !== projectId) {
      throw new Error('Token projectId mismatch')
    }

    const tokenHash = await hashToken(refreshToken)
    const stored = await findTokenByHash(tokenHash, projectId)

    if (!stored) throw new Error('Refresh token not found')
    if (stored.isRevoked) throw new Error('Refresh token has been revoked')

    const expiresAt = stored.expiresAt.toDate
      ? stored.expiresAt.toDate()
      : new Date(stored.expiresAt)

    if (new Date() > expiresAt) throw new Error('Refresh token has expired')

    const accessToken = signAccessToken({ userId: payload.userId, projectId })
    return { accessToken }
  } catch (err) {
    throw new Error(`Token refresh failed: ${err.message}`)
  }
}

export const revokeRefreshToken = async (refreshToken, projectId) => {
  try {
    const tokenHash = await hashToken(refreshToken)
    const stored = await findTokenByHash(tokenHash, projectId)
    if (!stored) throw new Error('Refresh token not found')
    await revokeToken(stored.id)
    return true
  } catch (err) {
    throw new Error(`Token revocation failed: ${err.message}`)
  }
}

export const revokeAllTokens = async (userId, projectId) => {
  try {
    await revokeAllUserTokens(userId, projectId)
    return true
  } catch (err) {
    throw new Error(`Revoke all tokens failed: ${err.message}`)
  }
}

const parseDurationToMs = (duration) => {
  const unit = duration.slice(-1)
  const value = parseInt(duration.slice(0, -1), 10)
  const map = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 }
  return (map[unit] || 60 * 1000) * value
}
