import express from 'express';
import {
  getMaintenanceMode,
  toggleMaintenanceMode,
} from '../controllers/setting.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.route('/maintenance')
  .get(getMaintenanceMode)
  .post(protect, authorizeRoles('super_admin'), toggleMaintenanceMode);

export default router;
