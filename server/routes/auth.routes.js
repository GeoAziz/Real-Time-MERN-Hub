import express from 'express';
import { login, signup, logout } from '../controllers/auth.controller.js';
import { authRateLimiter } from '../middleware/rateLimiters.js';
const router = express.Router();
router.post('/signup', authRateLimiter, signup);
router.post('/login', authRateLimiter, login);
router.post('/logout', logout);
export default router;
