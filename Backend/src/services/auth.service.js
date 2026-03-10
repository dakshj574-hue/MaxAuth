

import {
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  lockUser,
  unlockUser
} from '../models/user.model.js'
import {
  findLoginAttemptByEmail,
  updateLoginAttempt,
  resetLoginAttempts
} from '../models/loginAttempt.model.js'
import { hashPassword, comparePassword } from '../utils/hash.js'


const MAX_ATTEMPTS = 4
const LOCK_DURATION_MS = 15 * 60 * 1000  // 15 minutes

const COMMON_PASSWORDS = [
  'password', '12345678', '123456789', 'qwerty123', 'iloveyou',
  'admin123', 'letmein1', 'welcome1', 'monkey123', 'dragon12'
]

const enforcePasswordPolicy = (password) => {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long')
  }
  if (password.length > 64) {
    throw new Error('Password must not exceed 64 characters')
  }
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    throw new Error('Password is too common. Please choose a stronger password')
  }
}

export const registerUser = async ({ email, username, password, phoneNumber, projectId }) => {
  try {
    const existing = await findUserByEmail(email, projectId)
    if (existing) throw new Error('An account with this email already exists')

    enforcePasswordPolicy(password)

    const passwordHash = await hashPassword(password)

    const user = await createUser({
      email,
      username,
      phoneNumber: phoneNumber || null,
      passwordHash,
      loginMethods: ['password'],
      isLocked: false,
      lockUntil: null,
      projectId
    })

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      loginMethods: user.loginMethods,
      projectId: user.projectId
    }
  } catch (err) {
    throw new Error(`Registration failed: ${err.message}`)
  }
}

export const loginUser = async ({ email, password, projectId }) => {
  try {
    const user = await findUserByEmail(email, projectId)

    if (!user) {
      // Still record the attempt to prevent user enumeration via timing
      await updateLoginAttempt(email, {
        attemptCount: 1,
        lastAttemptAt: new Date(),
        isBlocked: false,
        blockedUntil: null
      }, projectId)
      throw new Error('Invalid email or password')
    }

    // Check if account is still locked
    if (user.isLocked && user.lockUntil) {
      const lockUntil = user.lockUntil.toDate
        ? user.lockUntil.toDate()
        : new Date(user.lockUntil)

      if (new Date() < lockUntil) {
        const minutesLeft = Math.ceil((lockUntil - new Date()) / 60000)
        throw new Error(`Account is locked. Try again in ${minutesLeft} minute(s)`)
      }
      // Lock expired — auto-unlock
      await unlockUser(user.id)
    }

    if (!user.passwordHash) {
      throw new Error('Password login is not enabled for this account')
    }

    const isMatch = await comparePassword(password, user.passwordHash)

    if (!isMatch) {
      // Fetch current attempt count
      const attempt = await findLoginAttemptByEmail(email, projectId)
      const currentCount = attempt ? attempt.attemptCount : 0
      const newCount = currentCount + 1

      if (newCount >= MAX_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + LOCK_DURATION_MS)
        await updateLoginAttempt(email, {
          userId: user.id,
          attemptCount: newCount,
          lastAttemptAt: new Date(),
          isBlocked: true,
          blockedUntil: lockUntil
        }, projectId)
        await lockUser(user.id, lockUntil)
        throw new Error(`Too many failed attempts. Account locked for 15 minutes`)
      }

      await updateLoginAttempt(email, {
        userId: user.id,
        attemptCount: newCount,
        lastAttemptAt: new Date(),
        isBlocked: false,
        blockedUntil: null
      }, projectId)
      const attemptsLeft = MAX_ATTEMPTS - newCount
      throw new Error(`Invalid email or password. ${attemptsLeft} attempt(s) remaining`)
    }

    // Successful login — reset attempts
    await resetLoginAttempts(email, projectId)

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      loginMethods: user.loginMethods,
      projectId: user.projectId
    }
  } catch (err) {
    throw new Error(`Login failed: ${err.message}`)
  }
}

export const checkUserEmail = async (email, projectId) => {
  try {
    const user = await findUserByEmail(email, projectId)
    if (!user) return { exists: false, loginMethods: [] }
    return { exists: true, loginMethods: user.loginMethods, userId: user.id }
  } catch (err) {
    throw new Error(`Email check failed: ${err.message}`)
  }
}

export const getUserProfile = async (userId) => {
  try {
    const user = await findUserById(userId)
    if (!user) throw new Error('User not found')
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      loginMethods: user.loginMethods,
      projectId: user.projectId
    }
  } catch (err) {
    throw new Error(`Get profile failed: ${err.message}`)
  }
}
