/**
 * loginAttempt.model.js
 * Imports: config/firebase.js
 * Imported by: services/auth.service.js, middlewares/attemptLimiter.js
 * Firestore collection: loginAttempts
 * All operations scoped to projectId for multi-tenancy.
 */

import { db } from '../config/firebase.js'

const COLLECTION = 'loginAttempts'

export const findLoginAttemptByEmail = async (email, projectId) => {
  try {
    let query = db.collection(COLLECTION).where('email', '==', email)
    if (projectId) query = query.where('projectId', '==', projectId)
    const snapshot = await query.limit(1).get()
    if (snapshot.empty) return null
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }
  } catch (err) {
    throw new Error(`findLoginAttemptByEmail failed: ${err.message}`)
  }
}

export const updateLoginAttempt = async (email, fields, projectId) => {
  try {
    let query = db.collection(COLLECTION).where('email', '==', email)
    if (projectId) query = query.where('projectId', '==', projectId)
    const snapshot = await query.limit(1).get()

    if (snapshot.empty) {
      await db.collection(COLLECTION).add({
        email,
        projectId: projectId || null,
        ...fields,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    } else {
      await snapshot.docs[0].ref.update({
        ...fields,
        updatedAt: new Date()
      })
    }
    return true
  } catch (err) {
    throw new Error(`updateLoginAttempt failed: ${err.message}`)
  }
}

export const resetLoginAttempts = async (email, projectId) => {
  try {
    let query = db.collection(COLLECTION).where('email', '==', email)
    if (projectId) query = query.where('projectId', '==', projectId)
    const snapshot = await query.limit(1).get()

    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({
        attemptCount: 0,
        isBlocked: false,
        blockedUntil: null,
        updatedAt: new Date()
      })
    }
    return true
  } catch (err) {
    throw new Error(`resetLoginAttempts failed: ${err.message}`)
  }
}

/**
 * Count failed attempts for an email within a time window.
 * Used by excessive-attempt detection in suspicious.service.js.
 */
export const countRecentAttempts = async (email, windowMs, projectId) => {
  try {
    let query = db.collection(COLLECTION).where('email', '==', email)
    if (projectId) query = query.where('projectId', '==', projectId)
    const snapshot = await query.limit(1).get()
    if (snapshot.empty) return 0
    const data = snapshot.docs[0].data()
    const lastAttempt = data.lastAttemptAt?.toDate ? data.lastAttemptAt.toDate() : new Date(data.lastAttemptAt)
    const isRecent = (Date.now() - lastAttempt.getTime()) < windowMs
    return isRecent ? (data.attemptCount || 0) : 0
  } catch {
    return 0
  }
}
