/**
 * auth.validator.js
 * Imports: joi
 * Imported by: routes/auth.routes.js (via validateInput middleware)
 * Pure schema definitions — no DB, no req/res, no process.env
 *
 * NIST SP 800-63B password rules enforced:
 * - Min 8, max 64 characters
 * - No forced complexity (no symbol/number requirements)
 */

import Joi from 'joi'

export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),

  username: Joi.string().min(2).max(30).alphanum().required().messages({
    'string.min': 'Username must be at least 2 characters',
    'string.max': 'Username must not exceed 30 characters',
    'string.alphanum': 'Username must contain only letters and numbers',
    'any.required': 'Username is required'
  }),

  phoneNumber: Joi.string().min(10).max(15).allow('').optional().messages({
    'string.min': 'Phone number must be at least 10 characters',
    'string.max': 'Phone number must not exceed 15 characters'
  }),

  password: Joi.string().min(8).max(64).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password must not exceed 64 characters',
    'any.required': 'Password is required'
  })
})

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),

  password: Joi.string().min(1).required().messages({
    'string.empty': 'Password is required',
    'any.required': 'Password is required'
  })
})

export const checkEmailSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  })
})

export const logoutSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'string.empty': 'Refresh token is required',
    'any.required': 'Refresh token is required'
  })
})
