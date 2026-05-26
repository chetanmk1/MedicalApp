import express from 'express';
import {
  createAppointment,
  getAppointments,
  cancelAppointment,
  rescheduleAppointment,
  checkInAppointment,
  completeAppointment,
} from '../controllers/appointment.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.js';
import { enforceTenant } from '../middleware/tenant.js';

const router = express.Router();

router.route('/')
  .post(protect, authorizeRoles('patient', 'receptionist', 'clinic_admin'), enforceTenant, createAppointment)
  .get(protect, enforceTenant, getAppointments);

router.route('/:appointmentId/cancel')
  .patch(protect, cancelAppointment);

router.route('/:appointmentId/reschedule')
  .patch(protect, rescheduleAppointment);

router.route('/:appointmentId/check-in')
  .patch(protect, authorizeRoles('receptionist', 'clinic_admin'), enforceTenant, checkInAppointment);

router.route('/:appointmentId/complete')
  .patch(protect, authorizeRoles('doctor'), enforceTenant, completeAppointment);

export default router;
