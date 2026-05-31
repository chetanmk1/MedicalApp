import express from 'express';
import { getNotifications, readNotification } from '../controllers/notification.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, getNotifications);

router.route('/:id/read')
  .patch(protect, readNotification);

export default router;
