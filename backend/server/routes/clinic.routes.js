import express from 'express';
import {
  createClinic,
  updateClinic,
  updateClinicStatus,
  getClinics,
  getClinicById,
  approveClinic,
  rejectClinic,
} from '../controllers/clinic.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.js';
import { enforceTenant } from '../middleware/tenant.js';

const router = express.Router();

router.route('/')
  .post(protect, authorizeRoles('super_admin'), createClinic)
  .get(getClinics);

router.post('/register', createClinic);
router.patch('/:clinicId/approve', protect, authorizeRoles('super_admin'), approveClinic);
router.patch('/:clinicId/reject', protect, authorizeRoles('super_admin'), rejectClinic);

router.route('/:id')
  .get(getClinicById);

router.route('/:clinicId')
  .put(protect, authorizeRoles('clinic_admin'), enforceTenant, updateClinic);

router.route('/:clinicId/status')
  .patch(protect, authorizeRoles('super_admin'), updateClinicStatus);

export default router;
