/**
 * suspiciousEvent.model.js
 * Imports: config/firebase.js
 * Imported by: services/suspicious.service.js
 * Firestore collection: suspiciousEvents
 * All operations scoped to projectId for multi-tenancy.
 */

import { db } from '../config/firebase.js'

const COLLECTION = 'suspiciousEvents'

export const createSuspiciousEvent = async (data) => {
  const ref = await db.collection(COLLECTION).add({
    ...data,
    timestamp: new Date()
  })
  return { id: ref.id, ...data }
}

export const findSuspiciousEventsByUserId = async (userId, projectId, limit = 20) => {
  let query = db.collection(COLLECTION)
    .where('userId', '==', userId)
  if (projectId) query = query.where('projectId', '==', projectId)
  const snapshot = await query.orderBy('timestamp', 'desc').limit(limit).get()
  if (snapshot.empty) return []
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export const findAllSuspiciousEvents = async (projectId, limit = 50) => {
  let query = db.collection(COLLECTION)
  if (projectId) query = query.where('projectId', '==', projectId)
  const snapshot = await query.orderBy('timestamp', 'desc').limit(limit).get()
  if (snapshot.empty) return []
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}
