/**
 * project.service.js
 * Business logic for project (tenant) registration and management.
 * Uses SHA-256 index for fast API key lookup, never stores raw keys.
 */

import crypto from 'crypto'
import { db } from '../config/firebase.js'
import { createProject, findProjectsByOwner, findProjectById, deactivateProject } from '../models/project.model.js'

const COLLECTION = 'projects'

/**
 * Generates a secure API key prefixed with "mxa_".
 */
const generateApiKey = () => {
  const random = crypto.randomBytes(32).toString('hex')
  return `mxa_${random}`
}

/**
 * Derives a fast-lookup index from a raw API key using SHA-256.
 */
export const deriveApiKeyIndex = (rawApiKey) => {
  return crypto.createHash('sha256').update(rawApiKey).digest('hex')
}

/**
 * Registers a new project and returns the raw API key (shown only once).
 */
export const registerProject = async ({ name, ownerEmail }) => {
  try {
    if (!name || !ownerEmail) throw new Error('name and ownerEmail are required')
    const rawApiKey = generateApiKey()
    const apiKeyIndex = deriveApiKeyIndex(rawApiKey)
    const project = await createProject({ name, ownerEmail, apiKeyIndex })
    return {
      project: { id: project.id, name: project.name, ownerEmail: project.ownerEmail, isActive: true },
      apiKey: rawApiKey
    }
  } catch (err) {
    throw new Error(`Project registration failed: ${err.message}`)
  }
}

/**
 * Validates an API key and returns the resolved project.
 */
export const resolveProjectFromApiKey = async (rawApiKey) => {
  try {
    if (!rawApiKey) throw new Error('API key missing')
    const index = deriveApiKeyIndex(rawApiKey)
    const snapshot = await db.collection(COLLECTION)
      .where('apiKeyIndex', '==', index)
      .where('isActive', '==', true)
      .limit(1)
      .get()
    if (snapshot.empty) throw new Error('Invalid API key')
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }
  } catch (err) {
    throw new Error(`API key resolution failed: ${err.message}`)
  }
}

export const listOwnerProjects = async (ownerEmail) => {
  try {
    return await findProjectsByOwner(ownerEmail)
  } catch (err) {
    throw new Error(`List projects failed: ${err.message}`)
  }
}

export const removeProject = async (projectId) => {
  try {
    const project = await findProjectById(projectId)
    if (!project) throw new Error('Project not found')
    await deactivateProject(projectId)
    return true
  } catch (err) {
    throw new Error(`Remove project failed: ${err.message}`)
  }
}

export const getProjectSettings = async (projectId) => {
  try {
    const project = await findProjectById(projectId)
    if (!project) throw new Error('Project not found')
    return {
      mfaEnabled: project.mfaEnabled || false,
      mfaMethod: project.mfaMethod || null
    }
  } catch (err) {
    throw new Error(`Get project settings failed: ${err.message}`)
  }
}

export const updateProjectSettings = async (projectId, settings) => {
  try {
    const project = await findProjectById(projectId)
    if (!project) throw new Error('Project not found')
    
    // Direct db update since we do not have an updateProject in model
    await db.collection(COLLECTION).doc(projectId).update({
      ...settings,
      updatedAt: new Date()
    })
    
    return {
      ...project,
      ...settings
    }
  } catch (err) {
    throw new Error(`Update project settings failed: ${err.message}`)
  }
}
