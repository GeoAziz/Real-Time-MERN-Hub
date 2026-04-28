import express from 'express';
import protectRoute from '../middleware/protectRoute.js';
import {
  createDirectConversation,
  createGroupConversation,
  getConversations,
} from '../controllers/conversation.controller.js';

const router = express.Router();

router.get('/', protectRoute, getConversations);
router.post('/direct', protectRoute, createDirectConversation);
router.post('/group', protectRoute, createGroupConversation);

export default router;
