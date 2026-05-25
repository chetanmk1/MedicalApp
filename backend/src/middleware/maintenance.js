import jwt from 'jsonwebtoken';
import SystemSetting from '../models/SystemSetting.js';
import User from '../models/User.js';

let lastMaintenanceCheck = false;
let lastCheckTime = 0;
const CACHE_TTL = 5000; // Cache database lookup for 5 seconds to optimize performance

export const invalidateMaintenanceCache = () => {
  lastCheckTime = 0;
};

export const checkMaintenance = async (req, res, next) => {
  try {
    const now = Date.now();
    let maintenanceMode = lastMaintenanceCheck;

    if (now - lastCheckTime > CACHE_TTL) {
      const setting = await SystemSetting.findOne();
      maintenanceMode = setting ? setting.maintenanceMode : false;
      lastMaintenanceCheck = maintenanceMode;
      lastCheckTime = now;
    }

    if (maintenanceMode) {
      // Check if super_admin bypass is present
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_access_secret_99887766');
          const user = await User.findById(decoded.id).select('role status');
          
          if (user && user.role === 'super_admin' && user.status === 'active') {
            // Super Admin Bypass Allowed
            return next();
          }
        } catch (err) {
          // Token invalid or expired, continue to block
        }
      }

      return res.status(503).json({
        maintenance: true,
        message: 'System is under maintenance. Please try again later.',
      });
    }

    next();
  } catch (error) {
    console.error('Maintenance Middleware Error:', error);
    next(); // Fail-open in case of DB issues, or we can choose to fail-closed.
  }
};
