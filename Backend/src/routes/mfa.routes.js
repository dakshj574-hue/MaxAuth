import { Router } from 'express';
import { challenge, verify } from '../controllers/mfa.controller.js';
import { rateLimiter } from '../middlewares/rateLimiter.js';
import { logAuditEvent } from '../middlewares/auditLogger.js';

const router = Router();

router.use(rateLimiter);

router.post('/challenge', logAuditEvent('MFA_CHALLENGE'), challenge);
router.post('/verify', logAuditEvent('MFA_VERIFY'), verify);

export default router;
