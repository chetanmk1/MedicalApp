import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true, // Only date portion used (set to midnight UTC/local)
    },
    startTime: {
      type: String,
      required: true, // format "HH:MM"
    },
    endTime: {
      type: String,
      required: true, // format "HH:MM"
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for rapid slot conflict resolution and tenant isolation queries
appointmentSchema.index({ clinicId: 1 });
appointmentSchema.index({ doctorId: 1, date: 1 });
appointmentSchema.index({ patientId: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
