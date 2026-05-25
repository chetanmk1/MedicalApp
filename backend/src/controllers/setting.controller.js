import SystemSetting from '../models/SystemSetting.js';
import { invalidateMaintenanceCache } from '../middleware/maintenance.js';

// @desc    Get global maintenance mode state
// @route   GET /api/settings/maintenance
// @access  Public
export const getMaintenanceMode = async (req, res) => {
  try {
    let setting = await SystemSetting.findOne();
    if (!setting) {
      setting = await SystemSetting.create({ maintenanceMode: false });
    }
    res.json({ maintenanceMode: setting.maintenanceMode });
  } catch (error) {
    console.error('Get maintenance status error:', error);
    res.status(500).json({ message: 'Server error, checking maintenance mode failed' });
  }
};

// @desc    Toggle global maintenance mode state
// @route   POST /api/settings/maintenance
// @access  Private (super_admin)
export const toggleMaintenanceMode = async (req, res) => {
  try {
    const { maintenanceMode } = req.body;

    if (typeof maintenanceMode !== 'boolean') {
      return res.status(400).json({ message: 'maintenanceMode must be a boolean' });
    }

    let setting = await SystemSetting.findOne();
    if (!setting) {
      setting = new SystemSetting();
    }

    setting.maintenanceMode = maintenanceMode;
    setting.updatedBy = req.user._id;
    await setting.save();

    // Invalidate the cache to apply the toggle instantly across all requests
    invalidateMaintenanceCache();

    res.json({ message: `Maintenance mode toggled to ${maintenanceMode}`, maintenanceMode: setting.maintenanceMode });
  } catch (error) {
    console.error('Toggle maintenance error:', error);
    res.status(500).json({ message: 'Server error, toggling maintenance mode failed' });
  }
};
