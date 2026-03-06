/**
 * @file config/firebase.js
 * @description Firebase Admin SDK initialization — single source of truth for Firestore.
 *
 * IMPORTS FROM:
 *   - firebase-admin  (npm package)
 *   - ./env.js        (Member C — environment variable loader)
 *
 * IMPORTED BY:
 *   - src/services/auth.service.js        (Member A)
 *   - src/services/token.service.js       (Member A)
 *   - src/services/session.service.js     (Member B)
 *   - src/services/suspicious.service.js  (Member A)
 *   - src/services/magiclink.service.js   (Member B)
 *   - src/middlewares/attemptLimiter.js   (Member B)
 *   - src/middlewares/auditLogger.js      (Member B)
 *   - src/models/user.model.js            (Member A)
 *   - src/models/token.model.js           (Member A)
 *   - src/models/loginAttempt.model.js    (Member A)
 *   - src/models/session.model.js         (Member B)
 *   - src/models/auditLog.model.js        (Member B)
 *   - src/models/suspiciousEvent.model.js (Member B)
 *
 * ⚠️  RULES:
 *   - Never call admin.initializeApp() anywhere else in the codebase.
 *   - Always import { db } from this file — never instantiate Firestore directly.
 *   - Never import process.env here — always use env.js.
 */

import admin from 'firebase-admin'
import { env } from './env.js'

// Guard against multiple initializations (e.g. hot-reloads in dev)
import serviceAccount from './serviceAccountKey.json' with { type: 'json' }

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
}

/**
 * Firestore database instance.
 * Import this in every model and service that needs database access.
 *
 * @example
 *   import { db } from '../config/firebase.js'
 *   const ref = await db.collection('users').add({ ... })
 */
export const db = admin.firestore()

/**
 * Firebase Admin SDK instance.
 * Export as default for any file that needs direct Admin SDK access
 * (e.g. Firebase Auth, Storage — not used in current scope but exported
 * for forward compatibility).
 */
export default admin
