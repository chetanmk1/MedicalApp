import mongoose from 'mongoose';

const clinicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Clinic name is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'inactive', 'suspended', 'rejected'],
      default: 'pending',
    },
    adminName: {
      type: String,
    },
    adminEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    adminPhone: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexing for search
clinicSchema.index({ city: 1, district: 1 });

const Clinic = mongoose.model('Clinic', clinicSchema);
export default Clinic;
