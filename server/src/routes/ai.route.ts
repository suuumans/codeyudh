import express from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.ts';
import { chatWithAI } from '../controllers/ai.controller.ts';
import createRateLimiter from '../utils/rateLimiter.ts';

const router = express.Router();

const aiRateLimiter = createRateLimiter({ keyPrefix: 'ai_rate', windowSeconds: 60 * 60, maxRequests: Number(process.env.API_AI_LIMIT || 10), allowOnFail: true });

router.use(verifyJWT); // All AI routes require authentication
router.post('/chat', chatWithAI);

export default router;