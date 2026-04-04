import rateLimit from 'express-rate-limit';

export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // Limit each IP to 3 OTP requests 
  message: { status: 'error', message: 'Too many OTP requests from this IP. Please try again after 10 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
