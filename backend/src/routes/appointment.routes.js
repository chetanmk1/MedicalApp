import express from 'express';
import {
  createAppointment,
  getAppointments,
  cancelAppointment,
  rescheduleAppointment,
} from '../controllers/appointment.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.js';
import { enforceTenant } from '../middleware/tenant.js';

const router = express.Router();

router.route('/')
  .post(protect, authorizeRoles('patient', 'staff', 'clinic_admin'), enforceTenant, createAppointment)
  .get(protect, enforceTenant, getAppointments);

router.route('/:appointmentId/cancel')
  .patch(protect, cancelAppointment);

router.route('/:appointmentId/reschedule')
  .patch(protect, rescheduleAppointment);

export default router;
