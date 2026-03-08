/**
 * user.model.js
 * Imports: config/firebase.js
 * Imported by: services/auth.service.js, services/magiclink.service.js, services/passkey.service.js
 * Firestore collection: users
 * All operations are scoped to projectId for multi-tenancy.
 */

import { db } from '../config/firebase.js'

const COLLECTION = 'users'

/**
 * Find a user by email WITHIN a specific project (tenant-scoped).
 */
export const findUserByEmail = async (email, projectId) => {
  try {
    let query = db.collection(COLLECTION).where('email', '==', email)
    if (projectId) query = query.where('projectId', '==', projectId)
    const snapshot = await query.limit(1).get()
    if (snapshot.empty) return null
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }
  } catch (err) {
    throw new Error(`findUserByEmail failed: ${err.message}`)
  }
}

/**
 * Find a user by phoneNumber WITHIN a specific project (tenant-scoped).
 */
export const findUserByPhoneNumber = async (phoneNumber, projectId) => {
  try {
    let query = db.collection(COLLECTION).where('phoneNumber', '==', phoneNumber)
    if (projectId) query = query.where('projectId', '==', projectId)
    const snapshot = await query.limit(1).get()
    if (snapshot.empty) return null
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }
  } catch (err) {
    throw new Error(`findUserByPhoneNumber failed: ${err.message}`)
  }
}

/**
 * Find a user document by Firestore document ID.
 */
export const findUserById = async (userId) => {
  try {
    const doc = await db.collection(COLLECTION).doc(userId).get()
    if (!doc.exists) return null
    return { id: doc.id, ...doc.data() }
  } catch (err) {
    throw new Error(`findUserById failed: ${err.message}`)
  }
}

/**
 * Create a new user document, tagged with projectId.
 */
export const createUser = async (data) => {
  try {
    const ref = await db.collection(COLLECTION).add({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    return { id: ref.id, ...data }
  } catch (err) {
    throw new Error(`createUser failed: ${err.message}`)
  }
}

/**
 * Update fields on an existing user document.
 */
export const updateUser = async (userId, fields) => {
  try {
    await db.collection(COLLECTION).doc(userId).update({
      ...fields,
      updatedAt: new Date()
    })
    return true
  } catch (err) {
    throw new Error(`updateUser failed: ${err.message}`)
  }
}

/**
 * Lock a user account until a given datetime.
 */
export const lockUser = async (userId, lockUntil) => {
  try {
    await db.collection(COLLECTION).doc(userId).update({
      isLocked: true,
      lockUntil,
      updatedAt: new Date()
    })
    return true
  } catch (err) {
    throw new Error(`lockUser failed: ${err.message}`)
  }
}

/**
 * Unlock a user account and clear lock fields.
 */
export const unlockUser = async (userId) => {
  try {
    await db.collection(COLLECTION).doc(userId).update({
      isLocked: false,
      lockUntil: null,
      updatedAt: new Date()
    })
    return true
  } catch (err) {
    throw new Error(`unlockUser failed: ${err.message}`)
  }
}
