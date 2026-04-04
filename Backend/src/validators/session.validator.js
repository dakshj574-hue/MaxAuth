/**
 * session.validator.js
 * Imports: joi
 * Imported by: routes/session.routes.js (via validateInput middleware)
 */

import Joi from 'joi'

export const revokeSessionSchema = Joi.object({
  sessionId: Joi.string().required().messages({
    'string.empty': 'Session ID is required',
    'any.required': 'Session ID is required'
  })
})
