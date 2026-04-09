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
    const projectId = req.project?.id

    if (!email) return next()

    // pass projectId so lockout is scoped per tenant
    const attempt = await findLoginAttemptByEmail(email, projectId)
    if (!attempt) return next()

    if (attempt.isBlocked && attempt.blockedUntil) {
      const now = new Date()
      const blockedUntil = attempt.blockedUntil.toDate
        ? attempt.blockedUntil.toDate()
        : new Date(attempt.blockedUntil)

      if (now < blockedUntil) {
        const minutesLeft = Math.ceil((blockedUntil - now) / 60000)
        return errorResponse(res, `Account is temporarily locked. Try again in ${minutesLeft} minute(s).`, 429)
      }
    }

    next()
  } catch (err) {
    next(err)
  }
}
