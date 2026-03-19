/**
 * passkey.service.js
 * Imports: models/user.model.js, config/env.js
 * Imported by: controllers/passkey.controller.js
 */

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from '@simplewebauthn/server'
import { findUserById, updateUser } from '../models/user.model.js'
import { db } from '../config/firebase.js'
import { env } from '../config/env.js'

const RP_NAME = 'SecureAuth'
const RP_ID = new URL(env.CLIENT_URL).hostname   // e.g. 'localhost'
const ORIGIN = env.CLIENT_URL                    // e.g. 'http://localhost:3000'

// ─── Registration ────────────────────────────────────────────────────────────

export const registerPasskeyStart = async ({ userId, projectId }) => {
  try {
    const user = await findUserById(userId)
    if (!user || user.projectId !== projectId) throw new Error('User not found')

    const existingCredentials = user.passkeys || []

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: userId,
      userName: user.email,
      userDisplayName: user.username || user.email,
      attestationType: 'none',
      excludeCredentials: existingCredentials.map(cred => ({
        id: Buffer.from(cred.credentialID, 'base64url'),
        type: 'public-key',
        transports: cred.transports || []
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred'
      }
    })

    await db.collection('passkeyChallengers').doc(userId).set({
      challenge: options.challenge,
      projectId,
      createdAt: new Date()
    })

    return options
  } catch (err) {
    throw new Error(`Passkey registration start failed: ${err.message}`)
  }
}

export const registerPasskeyFinish = async ({ userId, response, projectId }) => {
  try {
    const user = await findUserById(userId)
    if (!user || user.projectId !== projectId) throw new Error('User not found')

    const challengeDoc = await db.collection('passkeyChallengers').doc(userId).get()
    if (!challengeDoc.exists) throw new Error('Challenge not found or expired')
    
    const data = challengeDoc.data()
    if (data.projectId !== projectId) throw new Error('Invalid project')

    const { challenge: expectedChallenge } = data

    let verification
    try {
      verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID
      })
    } catch (e) {
      throw new Error(`WebAuthn verification error: ${e.message}`)
    }

    if (!verification.verified) throw new Error('Passkey registration failed')

    const { registrationInfo } = verification
    const newCredential = {
      credentialID: Buffer.from(registrationInfo.credentialID).toString('base64url'),
      credentialPublicKey: Buffer.from(registrationInfo.credentialPublicKey).toString('base64url'),
      counter: registrationInfo.counter,
      transports: response.response.transports || []
    }

    const existingPasskeys = user.passkeys || []
    const loginMethods = user.loginMethods.includes('passkey')
      ? user.loginMethods
      : [...user.loginMethods, 'passkey']

    await updateUser(userId, {
      passkeys: [...existingPasskeys, newCredential],
      loginMethods
    })

    await db.collection('passkeyChallengers').doc(userId).delete()

    return { verified: true }
  } catch (err) {
    throw new Error(`Passkey registration finish failed: ${err.message}`)
  }
}

// ─── Authentication ──────────────────────────────────────────────────────────

export const loginPasskeyStart = async ({ userId, projectId }) => {
  try {
    const user = await findUserById(userId)
    if (!user || user.projectId !== projectId) throw new Error('User not found')

    const existingCredentials = (user.passkeys || []).map(cred => ({
      id: Buffer.from(cred.credentialID, 'base64url'),
      type: 'public-key',
      transports: cred.transports || []
    }))

    if (existingCredentials.length === 0) throw new Error('No passkeys registered')

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials: existingCredentials,
      userVerification: 'preferred'
    })

    await db.collection('passkeyChallengers').doc(userId).set({
      challenge: options.challenge,
      projectId,
      createdAt: new Date()
    })

    return options
  } catch (err) {
    throw new Error(`Passkey login start failed: ${err.message}`)
  }
}

export const loginPasskeyFinish = async ({ userId, response, projectId }) => {
  try {
    const user = await findUserById(userId)
    if (!user || user.projectId !== projectId) throw new Error('User not found')

    const challengeDoc = await db.collection('passkeyChallengers').doc(userId).get()
    if (!challengeDoc.exists) throw new Error('Challenge not found or expired')
    
    const data = challengeDoc.data()
    if (data.projectId !== projectId) throw new Error('Invalid project')

    const { challenge: expectedChallenge } = data

    const credentialID = response.id
    const storedCredential = (user.passkeys || []).find(
      c => c.credentialID === credentialID
    )
    if (!storedCredential) throw new Error('Credential not found')

    let verification
    try {
      verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        authenticator: {
          credentialID: Buffer.from(storedCredential.credentialID, 'base64url'),
          credentialPublicKey: Buffer.from(storedCredential.credentialPublicKey, 'base64url'),
          counter: storedCredential.counter,
          transports: storedCredential.transports || []
        }
      })
    } catch (e) {
      throw new Error(`WebAuthn verification error: ${e.message}`)
    }

    if (!verification.verified) throw new Error('Passkey authentication failed')

    const { authenticationInfo } = verification
    const updatedPasskeys = user.passkeys.map(cred => {
      if (cred.credentialID === credentialID) {
        return { ...cred, counter: authenticationInfo.newCounter }
      }
      return cred
    })
    await updateUser(userId, { passkeys: updatedPasskeys })

    await db.collection('passkeyChallengers').doc(userId).delete()

    return { verified: true, userId: user.id }
  } catch (err) {
    throw new Error(`Passkey login finish failed: ${err.message}`)
  }
}
