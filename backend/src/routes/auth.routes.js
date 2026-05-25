import express from 'express';
import {
  registerPatient,
  login,
  refresh,
  logout,
  getMe,
  setupSuperAdmin,
  forgotPassword,
  resetPassword,
  updateProfile,
  updatePassword,
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerPatient);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/update-password', protect, updatePassword);

// Super admin setup & password reset routes
router.post('/setup-super-admin', setupSuperAdmin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
