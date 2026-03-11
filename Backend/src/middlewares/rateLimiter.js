/**
 * rateLimiter.js
 * Imports: express-rate-limit
 * Imported by: routes/auth.routes.js
 *
 * Applies IP-based rate limiting to prevent automated attacks (NIST SP 800-63B).
 */

import rateLimit from 'express-rate-limit'

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15-minute sliding window
  max: 20,                    // max 20 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
    data: {}
  },
  // Skip successful requests — only count failures (optional but NIST-friendly)
  skipSuccessfulRequests: false
})

// Stricter limiter for login specifically
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
    data: {}
  }
})
