/**
 * session.model.js
 * Imports: config/firebase.js
 * Imported by: services/session.service.js
 * Firestore collection: sessions
 * All operations scoped to projectId for multi-tenancy.
 */

import { db } from '../config/firebase.js'

const COLLECTION = 'sessions'

export const findSessionsByUserId = async (userId, projectId) => {
  let query = db.collection(COLLECTION)
    .where('userId', '==', userId)
    .where('isActive', '==', true)
  if (projectId) query = query.where('projectId', '==', projectId)
  const snapshot = await query.orderBy('createdAt', 'desc').get()
  if (snapshot.empty) return []
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export const findAllActiveSessions = async (projectId) => {
  let query = db.collection(COLLECTION).where('isActive', '==', true)
  if (projectId) query = query.where('projectId', '==', projectId)
  const snapshot = await query.orderBy('createdAt', 'desc').get()
  if (snapshot.empty) return []
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export const findSessionById = async (sessionId) => {
  const doc = await db.collection(COLLECTION).doc(sessionId).get()
  if (!doc.exists) return null
  return { id: doc.id, ...doc.data() }
}

export const createSession = async (data) => {
  const ref = await db.collection(COLLECTION).add({
    ...data,
    isActive: true,
    createdAt: new Date(),
    lastUsedAt: new Date()
  })
  return { id: ref.id, ...data }
}

export const deactivateSession = async (sessionId) => {
  await db.collection(COLLECTION).doc(sessionId).update({
    isActive: false,
    updatedAt: new Date()
  })
  return true
}

export const deactivateAllUserSessions = async (userId, projectId) => {
  let query = db.collection(COLLECTION)
    .where('userId', '==', userId)
    .where('isActive', '==', true)
  if (projectId) query = query.where('projectId', '==', projectId)
  const snapshot = await query.get()
  const batch = db.batch()
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, { isActive: false, updatedAt: new Date() })
  })
  await batch.commit()
  return true
}

export const updateSessionLastUsed = async (sessionId) => {
  await db.collection(COLLECTION).doc(sessionId).update({
    lastUsedAt: new Date()
  })
  return true
}
