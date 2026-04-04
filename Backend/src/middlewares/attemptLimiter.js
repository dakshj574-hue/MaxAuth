/**
 * attemptLimiter.js
 * Imports: models/loginAttempt.model.js, utils/apiResponse.js
 * Imported by: routes/auth.routes.js (on POST /login)
 *
 * Enforces NIST SP 800-63B account lockout after 4 failed attempts.
 */

import { findLoginAttemptByEmail } from '../models/loginAttempt.model.js'
import { errorResponse } from '../utils/apiResponse.js'

export const checkLoginAttempts = async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) return next()

    const attempt = await findLoginAttemptByEmail(email)
    if (!attempt) return next()

    if (attempt.isBlocked && attempt.blockedUntil) {
      const now = new Date()
      const blockedUntil = attempt.blockedUntil.toDate
        ? attempt.blockedUntil.toDate()
        : new Date(attempt.blockedUntil)

      if (now < blockedUntil) {
        const minutesLeft = Math.ceil((blockedUntil - now) / 60000)
        return res.status(429).json(
          errorResponse(`Account is temporarily locked. Try again in ${minutesLeft} minute(s).`)
        )
      }
    }

    next()
  } catch (err) {
    next(err)
  }
}
