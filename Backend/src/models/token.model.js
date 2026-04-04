/**
 * token.model.js
 * Imports: config/firebase.js
 * Imported by: services/token.service.js
 * Firestore collection: refreshTokens
 * All operations scoped to projectId for multi-tenancy.
 */

import { db } from '../config/firebase.js'

const COLLECTION = 'refreshTokens'

export const findTokenByHash = async (tokenHash, projectId) => {
  try {
    let query = db.collection(COLLECTION).where('token', '==', tokenHash)
    if (projectId) query = query.where('projectId', '==', projectId)
    const snapshot = await query.limit(1).get()
    if (snapshot.empty) return null
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }
  } catch (err) {
    throw new Error(`findTokenByHash failed: ${err.message}`)
  }
}

export const createRefreshToken = async (data) => {
  try {
    const ref = await db.collection(COLLECTION).add({
      ...data,
      isRevoked: false,
      createdAt: new Date()
    })
    return { id: ref.id, ...data }
  } catch (err) {
    throw new Error(`createRefreshToken failed: ${err.message}`)
  }
}

export const revokeToken = async (tokenId) => {
  try {
    await db.collection(COLLECTION).doc(tokenId).update({
      isRevoked: true,
      revokedAt: new Date()
    })
    return true
  } catch (err) {
    throw new Error(`revokeToken failed: ${err.message}`)
  }
}

export const revokeAllUserTokens = async (userId, projectId) => {
  try {
    let query = db.collection(COLLECTION)
      .where('userId', '==', userId)
      .where('isRevoked', '==', false)
    if (projectId) query = query.where('projectId', '==', projectId)
    const snapshot = await query.get()
    const batch = db.batch()
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isRevoked: true, revokedAt: new Date() })
    })
    await batch.commit()
    return true
  } catch (err) {
    throw new Error(`revokeAllUserTokens failed: ${err.message}`)
  }
}
