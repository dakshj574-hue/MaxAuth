import crypto from 'crypto';
import { db } from '../config/firebase.js';
import { verifyMFAToken, triggerMFAChallenge } from '../services/mfa.service.js';
import { generateTokens } from '../services/token.service.js';
import { createUserSession } from '../services/session.service.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { findUserById } from '../models/user.model.js';
import { detectSuspiciousActivity } from '../services/suspicious.service.js';

export const challenge = async (req, res, next) => {
  try {
    const { mfaToken } = req.body;
    if (!mfaToken) return errorResponse(res, 'mfaToken is required', 400);

    const { decoded } = await verifyMFAToken(mfaToken);
    const { userId, projectId } = decoded;

    const mfaMethod = req.project.mfaMethod || 'email_otp'; 
    await triggerMFAChallenge(userId, projectId, mfaMethod);

    res.locals.userId = userId;
    res.locals.auditMetadata = { action: 'MFA_CHALLENGE', projectId };

    return successResponse(res, 'MFA challenge sent', { method: mfaMethod });
  } catch (error) {
    if (error.message.includes('expired') || error.message.includes('invalid') || error.message.includes('mismatch')) {
      return errorResponse(res, error.message, 401);
    }
    next(error);
  }
};

export const verify = async (req, res, next) => {
  try {
    const { mfaToken, code } = req.body;
    if (!mfaToken || !code) return errorResponse(res, 'mfaToken and code are required', 400);

    const { decoded, docRef: pendingMfaRef } = await verifyMFAToken(mfaToken);
    const { userId, projectId } = decoded;
    
    const user = await findUserById(userId);
    if (!user) return errorResponse(res, 'User not found', 404);

    const mfaMethod = req.project.mfaMethod || 'email_otp';
    
    if (mfaMethod === 'email_otp') {
      const docRef = db.collection('otps').doc(`${projectId}_${user.email}_mfa`);
      const doc = await docRef.get();
      
      if (!doc.exists) return errorResponse(res, 'No active MFA OTP found or expired', 400);
      const data = doc.data();

      if (Date.now() > data.expiresAt) {
          await docRef.delete();
          return errorResponse(res, 'MFA OTP Expired', 400);
      }
      
      if (data.attempts >= 3) {
          await docRef.delete();
          return errorResponse(res, 'Too many failed attempts. Code destroyed.', 429);
      }

      const hashedInput = crypto.createHash('sha256').update(code).digest('hex');
      
      if (hashedInput === data.otp) {
         await docRef.delete();
         await pendingMfaRef.delete();
      } else {
         await docRef.update({ attempts: data.attempts + 1 });
         return errorResponse(res, 'Invalid MFA Code', 401);
      }
    } else {
      return errorResponse(res, 'Unsupported MFA Method', 400);
    }

    const { accessToken, refreshToken } = await generateTokens({ userId: user.id, email: user.email, projectId });
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    await createUserSession({
      userId: user.id,
      ip,
      userAgent,
      projectId
    });

    detectSuspiciousActivity({ userId: user.id, email: user.email, ip, userAgent, projectId }).catch(() => {});

    res.locals.userId = user.id;
    res.locals.auditMetadata = { method: 'mfa', action: 'MFA_VERIFY', projectId };

    return successResponse(res, 'MFA Verified successfully', { accessToken, refreshToken, user }, 200);

  } catch (error) {
    if (error.message.includes('expired') || error.message.includes('invalid') || error.message.includes('mismatch')) {
      return errorResponse(res, error.message, 401);
    }
    next(error);
  }
};
