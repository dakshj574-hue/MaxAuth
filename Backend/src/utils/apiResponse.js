/**
 * @file utils/apiResponse.js
 * @description Shared API response formatter — every controller uses this.
 *              Never construct raw response objects in controllers.
 *
 * IMPORTS FROM:
 *   - Nothing (pure utility — no external dependencies)
 *
 * IMPORTED BY:
 *   - src/controllers/auth.controller.js        (Member A)
 *   - src/controllers/token.controller.js       (Member A)
 *   - src/controllers/session.controller.js     (Member B)
 *   - src/controllers/magiclink.controller.js   (Member B)
 *   - src/controllers/passkey.controller.js     (Member B)
 *   - src/middlewares/attemptLimiter.js         (Member B)
 *   - src/middlewares/validateInput.js          (Member B)
 *
 * ⚠️  RULES:
 *   - Every API response MUST use one of these two functions.
 *   - Response shape is fixed: { success, message, data }
 *   - Never add extra top-level keys — keep the contract stable for Member D.
 *   - These are pure functions — no Firestore, no req/res imports here.
 */

/**
 * Send a successful API response.
 *
 * @param {import('express').Response} res     - Express response object
 * @param {string}                     message - Human-readable success message
 * @param {object}                     [data]  - Payload to return to the client
 * @param {number}                     [statusCode=200] - HTTP status code
 *
 * @example
 *   // In a controller:
 *   return successResponse(res, 'User registered successfully', { userId: user.id }, 201)
 */
export const successResponse = (res, message, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  })
}

/**
 * Send a failed API response.
 *
 * @param {import('express').Response} res     - Express response object
 * @param {string}                     message - Human-readable error message
 * @param {number}                     [statusCode=500] - HTTP status code
 * @param {object}                     [data]  - Optional extra error context (e.g. validation errors)
 *
 * @example
 *   // In a controller catch block:
 *   return errorResponse(res, 'Invalid credentials', 401)
 *
 * @example
 *   // With validation error details:
 *   return errorResponse(res, 'Validation failed', 422, { errors: details })
 */
export const errorResponse = (res, message, statusCode = 500, data = {}) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data
  })
}
