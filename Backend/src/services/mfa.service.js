import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { db } from '../config/firebase.js';
import { sendEmail } from './email.service.js';
import { findUserById } from '../models/user.model.js';

/**
 * Generate a short-lived MFA Challenge token.
 * Stores in Firestore to guarantee single-use.
 */
export const generateMFAToken = async ({ userId, projectId, method }) => {
  const token = jwt.sign(
    { userId, projectId, firstFactor: method },
    env.MFA_SECRET,
    { expiresIn: '5m' }
  );

  await db.collection('pending_mfa').doc(`${projectId}_${userId}`).set({
    mfaToken: token,
    createdAt: Date.now()
  });

  return token;
};

/**
 * Verify token signature, expiry, and existence in pending_mfa tracking store.
 */
export const verifyMFAToken = async (token) => {
  try {
    const decoded = jwt.verify(token, env.MFA_SECRET);
    const { userId, projectId } = decoded;

    const docRef = db.collection('pending_mfa').doc(`${projectId}_${userId}`);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error('MFA token is invalid or already expired');
    }

    const data = doc.data();
    if (data.mfaToken !== token) {
      throw new Error('MFA token mismatch or superseded');
    }

    return { decoded, docRef };
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('MFA token has expired');
    }
    throw new Error(err.message);
  }
};

/**
 * Triggers sending the secondary factor to the user based on project mfaMethod.
 */
export const triggerMFAChallenge = async (userId, projectId, mfaMethod) => {
  const user = await findUserById(userId);
  if (!user) throw new Error('User not found');

  if (mfaMethod === 'email_otp') {
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    // Reuse the otps collection but with an _mfa suffix to distinguish
    await db.collection('otps').doc(`${projectId}_${user.email}_mfa`).set({
      otp: hashedOtp,
      expiresAt,
      attempts: 0,
      projectId
    });

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e1e8fd; border-radius: 16px; background-color: #f9f9ff; text-align: center;">
        <h2 style="color: #1e3a8a; margin-top: 0;">Your MFA Security Code</h2>
        <p style="color: #444651; font-size: 16px; line-height: 1.5;">You requested a secondary authentication step.</p>
        <div style="margin: 30px auto; background-color: #e9edff; padding: 20px; border-radius: 12px; display: inline-block;">
            <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #00236f;">${otp}</span>
        </div>
        <p style="color: #757682; font-size: 11px; margin-top: 20px;">This code expires in exactly 5 minutes. Do not share it with anyone.</p>
      </div>
    `;

    await sendEmail(user.email, 'Your MaxAuth MFA Code', `Your code is ${otp}. It expires in 5 minutes.`, htmlBody);
    return true;
  } else if (mfaMethod === 'phone_otp') {
     throw new Error('Phone OTP via backend text messages is not fully implemented in this environment yet.');
  }

  throw new Error('Unsupported MFA Method');
};
