import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { checkMaintenance } from './middleware/maintenance.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import clinicRoutes from './routes/clinic.routes.js';
import userRoutes from './routes/user.routes.js';
import scheduleRoutes from './routes/schedule.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import settingRoutes from './routes/setting.routes.js';
import notificationRoutes from './routes/notification.routes.js';

const app = express();

// Middleware
app.use(
  cors({
    origin: true, // Allow frontend origin dynamically
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Global Maintenance interceptor with bypass criteria
app.use('/api', (req, res, next) => {
  const isBypassPath =
    (req.path === '/auth/login' && req.method === 'POST') ||
    (req.path === '/settings/maintenance' && req.method === 'GET');

  if (isBypassPath) {
    return next();
  }

  checkMaintenance(req, res, next);
});

// Routes mounting
app.use('/api/auth', authRoutes);
app.use('/api/clinics', clinicRoutes);
app.use('/api/users', userRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/notifications', notificationRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Medical App multi-tenant API is running.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'An unexpected server error occurred',
  });
});

export default app;
