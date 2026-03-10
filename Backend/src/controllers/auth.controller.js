import { registerUser, loginUser, checkUserEmail, getUserProfile } from '../services/auth.service.js'
import { generateTokens, revokeRefreshToken } from '../services/token.service.js'
import { generateMFAToken } from '../services/mfa.service.js'
import { createUserSession, revokeAllSessions } from '../services/session.service.js'
import { detectSuspiciousActivity, checkExcessiveAttempts } from '../services/suspicious.service.js'
import { successResponse, errorResponse } from '../utils/apiResponse.js'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { findUserByEmail, findUserById } from '../models/user.model.js'
import { sendMagicLinkEmail } from '../services/email.service.js'

export const register = async (req, res, next) => {
  try {
    const { email, username, password, phoneNumber } = req.body
    const projectId = req.project.id

    const user = await registerUser({ email, username, password, phoneNumber, projectId })
    const { accessToken, refreshToken } = await generateTokens({ userId: user.id, email: user.email, projectId })

    await createUserSession({
      userId: user.id,
      ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'] || '',
      projectId
    })

    res.locals.userId = user.id
    res.locals.auditMetadata = { method: 'password', action: 'REGISTER', projectId }

    return successResponse(res, 'Account created successfully', {
      accessToken,
      refreshToken,
      user
    }, 201)

  } catch (err) {
    if (err.message.includes('already exists')) {
      return errorResponse(res, err.message, 409)
    }
    if (err.message.includes('Password')) {
      return errorResponse(res, err.message, 422)
    }
    next(err)
  }
}

export const checkEmail = async (req, res, next) => {
  try {
    const { email } = req.body
    const projectId = req.project.id
    const result = await checkUserEmail(email, projectId)

    return successResponse(res, 'Email checked', result)

  } catch (err) {
    next(err)
  }
}

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const projectId = req.project.id

    const user = await loginUser({ email, password, projectId })

    if (req.project.mfaEnabled) {
      const mfaToken = await generateMFAToken({ userId: user.id, projectId, method: 'password' })
      res.locals.userId = user.id
      res.locals.auditMetadata = { method: 'password', action: 'LOGIN_MFA_REQUIRED', projectId }
      return successResponse(res, 'MFA required', {
        mfaRequired: true,
        mfaToken,
        mfaMethod: req.project.mfaMethod || 'email_otp'
      })
    }

    const { accessToken, refreshToken } = await generateTokens({ userId: user.id, email: user.email, projectId })

    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown'
    const userAgent = req.headers['user-agent'] || ''

    await createUserSession({
      userId: user.id,
      ip,
      userAgent,
      projectId
    })

    detectSuspiciousActivity({
      userId: user.id,
      email: user.email,
      ip,
      userAgent,
      projectId
    }).catch(() => {})

    res.locals.userId = user.id
    res.locals.auditMetadata = { method: 'password', action: 'LOGIN', projectId }

    return successResponse(res, 'Login successful', {
      accessToken,
      refreshToken,
      user
    })

  } catch (err) {
    const msg = err.message
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown'
    const userAgent = req.headers['user-agent'] || ''
    const projectId = req.project.id

    if (msg.includes('Invalid email or password') || msg.includes('attempt(s) remaining')) {
      // Fire tracking for the invalid attempt threshold silently
      checkExcessiveAttempts({ email: req.body.email, ip, userAgent, projectId }).catch(() => {})
      return errorResponse(res, msg, 401)
    }
    if (msg.includes('locked')) {
      return errorResponse(res, msg, 429)
    }
    if (msg.includes('not enabled')) {
      return errorResponse(res, msg, 400)
    }
    next(err)
  }
}

export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    const { userId } = req.user
    const projectId = req.project.id

    await revokeRefreshToken(refreshToken, projectId)
    await revokeAllSessions(userId, projectId)

    res.locals.userId = userId
    res.locals.auditMetadata = { action: 'LOGOUT', projectId }

    return successResponse(res, 'Logged out successfully')

  } catch (err) {
    next(err)
  }
}

export const getMe = async (req, res, next) => {
  try {
    const { userId } = req.user
    const user = await getUserProfile(userId)

    return successResponse(res, 'Profile fetched', { user })

  } catch (err) {
    if (err.message.includes('not found')) {
      return errorResponse(res, 'User not found', 404)
    }
    next(err)
  }
}

export const sendMagiclink = async (req, res, next) => {
  try {
    const { email } = req.body
    const projectId = req.project.id
    if (!email) return errorResponse(res, 'Email is required', 400)
    
    const user = await findUserByEmail(email, projectId)
    if (!user) {
      // Avoid user enumeration
      return successResponse(res, 'If your email is registered, a magic link has been sent.')
    }
    
    const token = jwt.sign(
      { userId: user.id },
      env.MAGIC_LINK_SECRET,
      { expiresIn: env.MAGIC_LINK_EXPIRY || '15m' }
    )
    
    const link = `${env.CLIENT_URL}/?magic_token=${token}`
    await sendMagicLinkEmail(user.email, link)
    
    return successResponse(res, 'If your email is registered, a magic link has been sent.')
  } catch (err) {
    next(err)
  }
}

export const verifyMagiclink = async (req, res, next) => {
  try {
    const { token } = req.body
    const projectId = req.project.id
    if (!token) return errorResponse(res, 'Token is required', 400)
    
    let decoded;
    try {
      decoded = jwt.verify(token, env.MAGIC_LINK_SECRET)
    } catch(err) {
      return errorResponse(res, 'Invalid or expired magic link', 401)
    }
    
    const user = await findUserById(decoded.userId)
    if (!user || user.projectId !== projectId) return errorResponse(res, 'Account not found', 404)

    if (req.project.mfaEnabled) {
      const mfaToken = await generateMFAToken({ userId: user.id, projectId, method: 'magiclink' })
      res.locals.userId = user.id
      res.locals.auditMetadata = { method: 'magiclink', action: 'LOGIN_MFA_REQUIRED', projectId }
      return successResponse(res, 'MFA required', {
        mfaRequired: true,
        mfaToken,
        mfaMethod: req.project.mfaMethod || 'email_otp'
      })
    }
    
    const { accessToken, refreshToken } = await generateTokens({ userId: user.id, email: user.email, projectId })

    await createUserSession({
      userId: user.id,
      ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'] || '',
      projectId
    })

    res.locals.userId = user.id
    res.locals.auditMetadata = { method: 'magiclink', action: 'LOGIN', projectId }

    return successResponse(res, 'Login successful', {
      accessToken,
      refreshToken,
      user
    })
  } catch (err) {
    next(err)
  }
}