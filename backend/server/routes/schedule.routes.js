import express from 'express';
import {
  getDoctorSchedule,
  updateDoctorSchedule,
  getAvailableSlots,
} from '../controllers/schedule.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.route('/doctor/:doctorId')
  .get(getDoctorSchedule)
  .put(protect, authorizeRoles('clinic_admin', 'doctor'), updateDoctorSchedule);

router.route('/doctor/:doctorId/slots')
  .get(getAvailableSlots);

export default router;
