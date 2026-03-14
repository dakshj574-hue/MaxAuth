import { Router } from 'express';
import { sendOTP, verifyOTP, verifyPhone } from '../controllers/otp.controller.js';
import { loginRateLimiter } from '../middlewares/rateLimiter.js';
import { otpLimiter } from '../middlewares/rateLimit.middleware.js';
import { validateInput } from '../middlewares/validateInput.js';
import { logAuditEvent } from '../middlewares/auditLogger.js';
import { checkEmailSchema } from '../validators/auth.validator.js';

const router = Router();

// POST /api/otp/send  (Migrated from auth.routes.js)
router.post(
  '/send',
  otpLimiter,
  validateInput(checkEmailSchema),
  logAuditEvent('SEND_OTP'),
  sendOTP
);

// POST /api/otp/verify  (Migrated from auth.routes.js)
router.post(
  '/verify',
  loginRateLimiter,
  logAuditEvent('VERIFY_OTP'),
  verifyOTP
);

// POST /api/otp/verify-phone
router.post(
  '/verify-phone',
  loginRateLimiter,
  logAuditEvent('VERIFY_PHONE_OTP'),
  verifyPhone
);

export default router;
