/**
 * project.model.js
 * Firestore collection: projects
 * Each project represents one tenant using MaxAuth as a service.
 */

import { db } from '../config/firebase.js'

const COLLECTION = 'projects'

export const createProject = async (data) => {
  try {
    const ref = await db.collection(COLLECTION).add({
      ...data,
      isActive: true,
      mfaEnabled: false,
      mfaMethod: null, // "email_otp", "phone_otp", "totp"
      createdAt: new Date(),
      updatedAt: new Date()
    })
    return { id: ref.id, ...data }
  } catch (err) {
    throw new Error(`createProject failed: ${err.message}`)
  }
}

export const findProjectByApiKeyHash = async (apiKeyHash) => {
  try {
    const snapshot = await db.collection(COLLECTION)
      .where('apiKeyHash', '==', apiKeyHash)
      .where('isActive', '==', true)
      .limit(1)
      .get()
    if (snapshot.empty) return null
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }
  } catch (err) {
    throw new Error(`findProjectByApiKeyHash failed: ${err.message}`)
  }
}

export const findProjectById = async (projectId) => {
  try {
    const doc = await db.collection(COLLECTION).doc(projectId).get()
    if (!doc.exists) return null
    return { id: doc.id, ...doc.data() }
  } catch (err) {
    throw new Error(`findProjectById failed: ${err.message}`)
  }
}

export const findProjectsByOwner = async (ownerEmail) => {
  try {
    const snapshot = await db.collection(COLLECTION)
      .where('ownerEmail', '==', ownerEmail)
      .orderBy('createdAt', 'desc')
      .get()
    if (snapshot.empty) return []
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (err) {
    throw new Error(`findProjectsByOwner failed: ${err.message}`)
  }
}

export const deactivateProject = async (projectId) => {
  try {
    await db.collection(COLLECTION).doc(projectId).update({
      isActive: false,
      updatedAt: new Date()
    })
    return true
  } catch (err) {
    throw new Error(`deactivateProject failed: ${err.message}`)
  }
}
