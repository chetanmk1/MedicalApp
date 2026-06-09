import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: String,
      enum: ['super_admin', 'clinic_admin', 'doctor', 'receptionist', 'patient'],
      required: [true, 'Role is required'],
    },
    roles: {
      type: [String],
      default: function () {
        return [this.role];
      },
    },
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      // Required for tenant-specific users (clinic_admin, doctor, receptionist)
      required: function () {
        return ['clinic_admin', 'doctor', 'receptionist'].includes(this.role);
      },
    },
    specialization: {
      type: String,
      // Only applicable for doctors
      required: function () {
        return this.role === 'doctor';
      },
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    age: {
      type: Number,
      min: 0,
      max: 150,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'pending_otp'],
      default: 'active',
    },
    otp: {
      code: String,
      expiresAt: Date,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function () {
  // We need to dynamically import crypto to avoid top-level require errors or import issues if needed, but import crypto is standard.
  // Actually, let's just import it at the top of the file.
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire (e.g. 1 hour)
  this.resetPasswordExpire = Date.now() + 60 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);
export default User;
