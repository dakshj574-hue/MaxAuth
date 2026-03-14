import crypto from 'crypto';
import { db } from '../config/firebase.js';
import { sendEmail } from '../services/email.service.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { findUserByEmail } from '../models/user.model.js';
import { generateTokens } from '../services/token.service.js';
import { generateMFAToken } from '../services/mfa.service.js';
import { createUserSession } from '../services/session.service.js';
import { detectSuspiciousActivity } from '../services/suspicious.service.js';
import { verifyFirebasePhoneToken } from '../services/otp.service.js';

export const sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const projectId = req.project.id;
    if (!email) return errorResponse(res, 'Email is required', 400);

    const user = await findUserByEmail(email, projectId);
    if (!user) return errorResponse(res, 'Account not found', 404);

    // 1. Generate 6 digit numeric code
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

    // 2. Hash OTP to prevent database leaks
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    // 3. Store securely in Firestore
    await db.collection('otps').doc(`${projectId}_${email}`).set({
      otp: hashedOtp,
      expiresAt,
      attempts: 0,
      projectId
    });

    // 4. Dispatch Email
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e1e8fd; border-radius: 16px; background-color: #f9f9ff; text-align: center;">
        <h2 style="color: #1e3a8a; margin-top: 0;">Your MaxAuth Security Code</h2>
        <p style="color: #444651; font-size: 16px; line-height: 1.5;">You recently requested a one-time password to sign in.</p>
        <div style="margin: 30px auto; background-color: #e9edff; padding: 20px; border-radius: 12px; display: inline-block;">
            <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #00236f;">${otp}</span>
        </div>
        <p style="color: #757682; font-size: 11px; margin-top: 20px;">This code expires in exactly 5 minutes. Do not share it with anyone.</p>
      </div>
    `;

    await sendEmail(email, 'Your MaxAuth Security Code', `Your code is ${otp}. It expires in 5 minutes.`, htmlBody);
    
    return successResponse(res, 'OTP Sent successfully', {}, 200);
  } catch (error) {
    next(error);
  }
};

export const verifyOTP = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const projectId = req.project.id;
    if (!email || !code) return errorResponse(res, 'Email and code are required', 400);

    const docRef = db.collection('otps').doc(`${projectId}_${email}`);
    const doc = await docRef.get();
    
    if (!doc.exists) return errorResponse(res, 'No active OTP found or already expired', 400);
    const data = doc.data();

    if (Date.now() > data.expiresAt) {
        await docRef.delete(); // Cleanup
        return errorResponse(res, 'OTP Expired', 400);
    }
    
    if (data.attempts >= 3) {
        await docRef.delete(); // Burn it to prevent brute force entirely
        return errorResponse(res, 'Too many failed attempts. Code destroyed.', 429);
    }

    const hashedInput = crypto.createHash('sha256').update(code).digest('hex');
    
    if (hashedInput === data.otp) {
       await docRef.delete(); // Single-use burn
       
       const user = await findUserByEmail(email, projectId);
       if (!user) return errorResponse(res, 'User no longer exists', 404);

       if (req.project.mfaEnabled) {
         const mfaToken = await generateMFAToken({ userId: user.id, projectId, method: 'email_otp' })
         res.locals.userId = user.id
         res.locals.auditMetadata = { method: 'email_otp', action: 'LOGIN_MFA_REQUIRED', projectId }
         return successResponse(res, 'MFA required', {
           mfaRequired: true,
           mfaToken,
           mfaMethod: req.project.mfaMethod || 'email_otp'
         })
       }

       // Execute login protocols identical to password.
       const { accessToken, refreshToken } = await generateTokens({ userId: user.id, email: user.email, projectId });
       const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
       const userAgent = req.headers['user-agent'] || 'unknown';

       await createUserSession({
         userId: user.id,
         ip: ip,
         userAgent: userAgent,
         projectId
       });

       detectSuspiciousActivity({ userId: user.id, email: user.email, ip, userAgent, projectId }).catch(() => {});

       // Do NOT include user obj explicitly in top-level login standard, we rely on standard shape:
       return successResponse(res, 'OTP Verified successfully', { accessToken, refreshToken, user }, 200);
    } else {
       await docRef.update({ attempts: data.attempts + 1 });
       return errorResponse(res, 'Invalid Code', 401);
    }
  } catch (error) {
    next(error);
  }
};

export const verifyPhone = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    const projectId = req.project.id;

    if (!idToken) return errorResponse(res, 'Firebase idToken is required', 400);

    // 1. Verify token and find/create user
    const user = await verifyFirebasePhoneToken(idToken, projectId);

    if (req.project.mfaEnabled) {
      const mfaToken = await generateMFAToken({ userId: user.id, projectId, method: 'phone_otp' })
      res.locals.userId = user.id
      res.locals.auditMetadata = { method: 'phone_otp', action: 'LOGIN_MFA_REQUIRED', projectId }
      return successResponse(res, 'MFA required', {
        mfaRequired: true,
        mfaToken,
        mfaMethod: req.project.mfaMethod || 'email_otp'
      })
    }

    // 2. Generate authentication tokens
    const { accessToken, refreshToken } = await generateTokens({ 
       userId: user.id, 
       email: user.email || '', 
       projectId 
    });
    
    // 3. Create session
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    await createUserSession({
      userId: user.id,
      ip,
      userAgent,
      projectId
    });

    // 4. Async suspicious activity check (best effort)
    detectSuspiciousActivity({ 
       userId: user.id, 
       email: user.email || 'phone-auth', 
       ip, 
       userAgent, 
       projectId 
    }).catch(() => {});

    return successResponse(res, 'Phone authentication successful', { accessToken, refreshToken, user }, 200);
  } catch (error) {
    // If it's a known token error, return 401, else 500
    if (error.message.includes('Phone Verification Failed') || error.message.includes('expired') || error.message.includes('Invalid')) {
        return errorResponse(res, error.message, 401);
    }
    next(error);
  }
};
