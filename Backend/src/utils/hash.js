/**
 * hash.js
 * Imports: bcrypt
 * Imported by: services/auth.service.js
 * Pure utility — no DB, no req/res, no process.env
 */

import bcrypt from 'bcrypt'

const SALT_ROUNDS = 12

/**
 * Hashes a plain-text password using bcrypt.
 * @param {string} plainPassword
 * @returns {Promise<string>} hashed password
 */
export const hashPassword = async (plainPassword) => {
  try {
    const hash = await bcrypt.hash(plainPassword, SALT_ROUNDS)
    return hash
  } catch (err) {
    throw new Error(`Password hashing failed: ${err.message}`)
  }
}

/**
 * Compares a plain-text password against a bcrypt hash.
 * @param {string} plainPassword
 * @param {string} hashedPassword
 * @returns {Promise<boolean>}
 */
export const comparePassword = async (plainPassword, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword)
    return isMatch
  } catch (err) {
    throw new Error(`Password comparison failed: ${err.message}`)
  }
}
