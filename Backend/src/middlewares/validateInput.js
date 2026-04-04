/**
 * validateInput.js
 * Imports: utils/apiResponse.js
 * Imported by: routes/*.js (wrapped with a schema)
 *
 * Usage in routes: router.post('/register', validateInput(registerSchema), authController.register)
 */

import { errorResponse } from '../utils/apiResponse.js'

/**
 * Returns an Express middleware that validates req.body against a Joi schema.
 * @param {import('joi').Schema} schema
 */
export const validateInput = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,     // return all errors, not just the first
    stripUnknown: true     // remove keys not in schema
  })

  if (error) {
    const messages = error.details.map(d => d.message).join(', ')
    return res.status(422).json(errorResponse(`Validation failed: ${messages}`))
  }

  req.body = value  // use sanitised value going forward
  next()
}
