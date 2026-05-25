import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true, // format "HH:MM", e.g., "09:00"
  },
  endTime: {
    type: String,
    required: true, // format "HH:MM", e.g., "13:00"
  },
});

const weeklyAvailabilitySchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number,
    required: true, // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    min: 0,
    max: 6,
  },
  slots: [slotSchema],
});

const leaveSchema = new mongoose.Schema({
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  reason: {
    type: String,
    trim: true,
  },
});

const holidaySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true, // exact calendar day
  },
  description: {
    type: String,
    trim: true,
  },
});

const scheduleSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    slotDuration: {
      type: Number,
      default: 30, // in minutes
      required: true,
    },
    weeklyAvailability: [weeklyAvailabilitySchema],
    leaves: [leaveSchema],
    holidays: [holidaySchema],
  },
  {
    timestamps: true,
  }
);

// Indexes
scheduleSchema.index({ clinicId: 1 });
scheduleSchema.index({ doctorId: 1 });

const Schedule = mongoose.model('Schedule', scheduleSchema);
export default Schedule;
