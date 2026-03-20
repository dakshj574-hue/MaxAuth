import admin from '../config/firebase.js';
import { findUserByPhoneNumber, createUser } from '../models/user.model.js';

/**
 * Verify Firebase ID Token and find/create user by phone number
 * @param {string} idToken - Firebase generated ID token
 * @param {string} projectId - MaxAuth Tenant Project ID
 * @returns {Object} User document
 */
export const verifyFirebasePhoneToken = async (idToken, projectId) => {
  try {
    // 1. Verify token with Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // 2. Extract phone number
    const phoneNumber = decodedToken.phone_number;
    if (!phoneNumber) {
      throw new Error('Firebase token does not contain a phone number');
    }

    // 3. Check if user already exists for this tenant
    let user = await findUserByPhoneNumber(phoneNumber, projectId);

    // 4. Create new user if not found
    if (!user) {
      user = await createUser({
        phoneNumber,
        projectId,
        authProvider: 'firebase_phone',
        email: null, // Phone auth doesn't require email
        isLocked: false,
        name: 'Phone User'
      });
    }

    return user;
  } catch (error) {
    if (error.code === 'auth/id-token-expired') {
      throw new Error('Firebase ID token has expired');
    }
    if (error.code === 'auth/argument-error') {
      throw new Error('Invalid Firebase ID token');
    }
    throw new Error(`Phone Verification Failed: ${error.message}`);
  }
};
