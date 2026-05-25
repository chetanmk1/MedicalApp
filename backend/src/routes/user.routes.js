import express from 'express';
import {
  createUser,
  getClinicUsers,
  getDoctors,
  updateUserStatus,
} from '../controllers/user.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.js';
import { enforceTenant } from '../middleware/tenant.js';

const router = express.Router();

router.route('/')
  .post(protect, authorizeRoles('super_admin', 'clinic_admin'), enforceTenant, createUser)
  .get(protect, authorizeRoles('clinic_admin', 'staff'), enforceTenant, getClinicUsers);

router.route('/doctors')
  .get(getDoctors);

router.route('/:userId/status')
  .patch(protect, authorizeRoles('super_admin', 'clinic_admin'), updateUserStatus);

export default router;
