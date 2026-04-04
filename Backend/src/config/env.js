/**
 * ========================================
 * Environment Configuration Module
 * ========================================
 * 
 * FILE: backend/src/config/env.js
 * OWNER: Member C
 * 
 * IMPORTS: dotenv (npm package)
 * IMPORTED BY: 
 *   - config/firebase.js
 *   - config/cors.js
 *   - all utils/* files that need config
 *   - all services/* files that need config
 *   - controllers/* (indirectly via services)
 * 
 * PURPOSE:
 *   Load, validate, and export environment variables.
 *   This is the ONLY place process.env is used.
 *   All other files must import from here.
 * 
 * MUST BE WRITTEN BEFORE:
 *   - config/firebase.js
 *   - config/cors.js
 *   - any file that needs config values
 * ========================================
 */

import dotenv from 'dotenv'

// Load .env file into process.env
dotenv.config()

/**
 * Validate that a required environment variable exists
 * @param {string} varName - Name of the env variable
 * @throws {Error} if variable is missing
 */
const requireEnv = (varName) => {
  const value = process.env[varName]
  if (!value) {
    throw new Error(
      `❌ Missing required environment variable: ${varName}\n` +
      `Please add it to your .env file. See .env.example for reference.`
    )
  }
  return value
}

/**
 * Get optional environment variable with fallback
 * @param {string} varName - Name of the env variable
 * @param {*} defaultValue - Default value if not set
 * @returns {string|*} - Environment value or default
 */
const optionalEnv = (varName, defaultValue) => {
  return process.env[varName] || defaultValue
}

/**
 * Exported environment object
 * Use: import { env } from './config/env.js'
 * Then: env.JWT_ACCESS_SECRET, env.PORT, etc.
 */
export const env = {
  // Server Configuration
  PORT: optionalEnv('PORT', 5000),
  NODE_ENV: optionalEnv('NODE_ENV', 'development'),
  CLIENT_URL: requireEnv('CLIENT_URL'),

  // Firebase Configuration (REQUIRED)
  FIREBASE_PROJECT_ID: requireEnv('FIREBASE_PROJECT_ID'),
  FIREBASE_CLIENT_EMAIL: requireEnv('FIREBASE_CLIENT_EMAIL'),
  FIREBASE_PRIVATE_KEY: requireEnv('FIREBASE_PRIVATE_KEY'),

  // JWT Secrets and Expiry (REQUIRED)
  JWT_ACCESS_SECRET: requireEnv('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: requireEnv('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRY: optionalEnv('JWT_ACCESS_EXPIRY', '15m'),
  JWT_REFRESH_EXPIRY: optionalEnv('JWT_REFRESH_EXPIRY', '7d'),

  // Magic Link Configuration
  MAGIC_LINK_SECRET: requireEnv('MAGIC_LINK_SECRET'),
  MAGIC_LINK_EXPIRY: optionalEnv('MAGIC_LINK_EXPIRY', '15m'),

  // MFA Configuration
  MFA_SECRET: requireEnv('MFA_SECRET'),

  // Email Configuration (for magic links and notifications)
  RESEND_API_KEY: optionalEnv('RESEND_API_KEY', ''),
  EMAIL_FROM: optionalEnv('EMAIL_FROM', 'onboarding@resend.dev'),
  EMAIL_FROM_NAME: optionalEnv('EMAIL_FROM_NAME', 'SecureAuth'),

  // Security Configuration
  BCRYPT_ROUNDS: parseInt(optionalEnv('BCRYPT_ROUNDS', 10), 10),
  MAX_LOGIN_ATTEMPTS: parseInt(optionalEnv('MAX_LOGIN_ATTEMPTS', 4), 10),
  LOGIN_LOCK_DURATION_MS: parseInt(
    optionalEnv('LOGIN_LOCK_DURATION_MS', 15 * 60 * 1000), // 15 minutes
    10
  ),

  // Rate Limiting Configuration
  RATE_LIMIT_WINDOW_MS: parseInt(
    optionalEnv('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000), // 15 minutes
    10
  ),
  RATE_LIMIT_MAX_REQUESTS: parseInt(
    optionalEnv('RATE_LIMIT_MAX_REQUESTS', 100),
    10
  ),

  // Geolocation API (optional, for suspicious activity detection)
  GEO_API_ENABLED: optionalEnv('GEO_API_ENABLED', 'true') === 'true',
}

/**
 * Validation: Ensure all required env vars are present
 * This runs immediately when the module is imported
 */
const validateEnv = () => {
  const errors = []

  // Check Firebase credentials format
  if (env.FIREBASE_PRIVATE_KEY) {
    if (!env.FIREBASE_PRIVATE_KEY.includes('BEGIN PRIVATE KEY')) {
      errors.push('⚠️  FIREBASE_PRIVATE_KEY appears to be malformed')
    }
  }

  // Check JWT secrets are not too short
  if (env.JWT_ACCESS_SECRET && env.JWT_ACCESS_SECRET.length < 32) {
    errors.push('⚠️  JWT_ACCESS_SECRET should be at least 32 characters')
  }

  if (env.JWT_REFRESH_SECRET && env.JWT_REFRESH_SECRET.length < 32) {
    errors.push('⚠️  JWT_REFRESH_SECRET should be at least 32 characters')
  }

  // Check email configuration
  if (env.RESEND_API_KEY && !env.RESEND_API_KEY.startsWith('re_')) {
    errors.push('⚠️  RESEND_API_KEY should start with "re_"')
  }

  if (errors.length > 0) {
    console.warn('\n🔐 Environment Validation Warnings:')
    errors.forEach((error) => console.warn(`  ${error}`))
    console.warn('\n')
  }
}

// Run validation on import
validateEnv()

/**
 * Summary of exported configuration:
 * 
 * Server & Firebase:
 *   - PORT, NODE_ENV, CLIENT_URL
 *   - FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 * 
 * Authentication:
 *   - JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
 *   - JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY
 *   - MAGIC_LINK_SECRET, MAGIC_LINK_EXPIRY
 *   - MFA_SECRET
 * 
 * Email:
 *   - EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM_NAME
 * 
 * Security:
 *   - BCRYPT_ROUNDS, MAX_LOGIN_ATTEMPTS, LOGIN_LOCK_DURATION_MS
 *   - RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS
 * 
 * Features:
 *   - GEO_API_ENABLED
 * 
 * Usage in other files:
 *   import { env } from './config/env.js'
 *   const secret = env.JWT_ACCESS_SECRET
 */
