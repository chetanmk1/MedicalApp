import mongoose from 'mongoose';

const systemSettingSchema = new mongoose.Schema(
  {
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const SystemSetting = mongoose.model('SystemSetting', systemSettingSchema);
export default SystemSetting;
