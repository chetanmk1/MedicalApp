import Appointment from '../models/Appointment.js';
import Schedule from '../models/Schedule.js';
import User from '../models/User.js';
import Clinic from '../models/Clinic.js';
import { sendBookingNotification } from '../utils/mailer.js';

// Helper to add minutes
const addMinutes = (timeStr, minsToAdd) => {
  const [hours, mins] = timeStr.split(':').map(Number);
  const tempDate = new Date();
  tempDate.setHours(hours, mins + minsToAdd, 0, 0);
  return `${String(tempDate.getHours()).padStart(2, '0')}:${String(tempDate.getMinutes()).padStart(2, '0')}`;
};

// Helper for time comparisons
const isAfterOrEqual = (timeStr1, timeStr2) => {
  return timeStr1.localeCompare(timeStr2) >= 0;
};

// Helper to validate slot with doctor schedule
const checkSlotAvailability = async (doctorId, date, startTime, clinicId) => {
  const targetDate = new Date(date);
  const searchDateStart = new Date(targetDate.setHours(0, 0, 0, 0));
  const searchDateEnd = new Date(targetDate.setHours(23, 59, 59, 999));

  // 1. Fetch schedule
  const schedule = await Schedule.findOne({ doctorId });
  if (!schedule) {
    throw new Error('Doctor does not have a configured schedule');
  }

  // 2. Check clinic match
  if (schedule.clinicId.toString() !== clinicId.toString()) {
    throw new Error('Doctor does not belong to the selected clinic');
  }

  // 3. Check holiday blocking
  const isHoliday = schedule.holidays.some((h) => {
    const holidayDate = new Date(h.date);
    return (
      holidayDate.getFullYear() === searchDateStart.getFullYear() &&
      holidayDate.getMonth() === searchDateStart.getMonth() &&
      holidayDate.getDate() === searchDateStart.getDate()
    );
  });
  if (isHoliday) {
    throw new Error('Selected date is a holiday at the clinic');
  }

  // 4. Check leave blocking
  const isOnLeave = schedule.leaves.some((l) => {
    const start = new Date(l.startDate);
    start.setHours(0,0,0,0);
    const end = new Date(l.endDate);
    end.setHours(23,59,59,999);
    return searchDateStart >= start && searchDateStart <= end;
  });
  if (isOnLeave) {
    throw new Error('Doctor is on leave on the selected date');
  }

  // 5. Check weekly availability
  const dayOfWeek = searchDateStart.getDay();
  const daySchedule = schedule.weeklyAvailability.find((d) => d.dayOfWeek === dayOfWeek);
  if (!daySchedule || !daySchedule.slots || daySchedule.slots.length === 0) {
    throw new Error('Doctor does not consult on this day of the week');
  }

  const slotDuration = schedule.slotDuration;
  const endTime = addMinutes(startTime, slotDuration);

  // Check if slot falls within any of the doctor's active daily shifts
  const isWithinShift = daySchedule.slots.some((shift) => {
    return isAfterOrEqual(startTime, shift.startTime) && isAfterOrEqual(shift.endTime, endTime);
  });

  if (!isWithinShift) {
    throw new Error(`Proposed time slot ${startTime} - ${endTime} falls outside doctor's work hours`);
  }

  // 6. Check for active appointment collisions
  const overlappingApp = await Appointment.findOne({
    doctorId,
    date: { $gte: searchDateStart, $lte: searchDateEnd },
    status: { $ne: 'cancelled' },
    $or: [
      {
        startTime: { $lte: startTime },
        endTime: { $gt: startTime },
      },
      {
        startTime: { $lt: endTime },
        endTime: { $gte: endTime },
      },
      {
        startTime: { $gte: startTime },
        endTime: { $lte: endTime },
      },
    ],
  });

  if (overlappingApp) {
    throw new Error('The selected time slot is already booked');
  }

  return { endTime, slotDuration };
};

// @desc    Create a new appointment
// @route   POST /api/appointments
// @access  Private (patient, staff, clinic_admin)
export const createAppointment = async (req, res) => {
  try {
    const { doctorId, date, startTime, notes } = req.body;
    const targetClinicId = req.body.clinicId || req.clinicId;

    if (!doctorId || !date || !startTime || !targetClinicId) {
      return res.status(400).json({ message: 'Missing required booking fields (clinicId, doctorId, date, startTime)' });
    }

    // Determine patient context
    let patientId;
    if (req.user.role === 'patient') {
      patientId = req.user._id;
    } else {
      // Clinic staff booking on behalf of patient
      patientId = req.body.patientId;
      if (!patientId) {
        return res.status(400).json({ message: 'Patient ID is required when booking as staff' });
      }
    }

    // Run schedule validation checks
    let bookingResult;
    try {
      bookingResult = await checkSlotAvailability(doctorId, date, startTime, targetClinicId);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const targetDateMidnight = new Date(new Date(date).setHours(0, 0, 0, 0));

    const appointment = await Appointment.create({
      clinicId: targetClinicId,
      patientId,
      doctorId,
      date: targetDateMidnight,
      startTime,
      endTime: bookingResult.endTime,
      status: 'confirmed', // confirm immediately
      notes,
    });

    // Populate data for notification
    const patientUser = await User.findById(patientId);
    const doctorUser = await User.findById(doctorId);
    const clinic = await Clinic.findById(targetClinicId);

    if (patientUser && doctorUser && clinic) {
      await sendBookingNotification(appointment, patientUser, doctorUser, clinic, 'created');
    }

    res.status(201).json({ message: 'Appointment booked successfully', appointment });
  } catch (error) {
    console.error('Book appointment error:', error);
    res.status(500).json({ message: 'Server error, booking failed', error: error.message });
  }
};

// @desc    Get appointments list based on user role and filters
// @route   GET /api/appointments
// @access  Private
export const getAppointments = async (req, res) => {
  try {
    const query = {};

    // Apply role-based scoping filters
    if (req.user.role === 'patient') {
      query.patientId = req.user._id;
    } else if (req.user.role === 'doctor') {
      query.doctorId = req.user._id;
      query.clinicId = req.clinicId;
    } else if (['clinic_admin', 'staff'].includes(req.user.role)) {
      query.clinicId = req.clinicId;
    } else if (req.user.role === 'super_admin') {
      // Super Admin filter
      if (req.query.clinicId) {
        query.clinicId = req.query.clinicId;
      }
    }

    // Apply date filters if requested
    if (req.query.date) {
      const target = new Date(req.query.date);
      const start = new Date(target.setHours(0, 0, 0, 0));
      const end = new Date(target.setHours(23, 59, 59, 999));
      query.date = { $gte: start, $lte: end };
    }

    // Apply status filters if requested
    if (req.query.status) {
      query.status = req.query.status;
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name email specialization')
      .populate('clinicId', 'name city district')
      .sort({ date: 1, startTime: 1 });

    res.json({ appointments });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ message: 'Server error, listing failed' });
  }
};

// @desc    Cancel appointment
// @route   PATCH /api/appointments/:appointmentId/cancel
// @access  Private
export const cancelAppointment = async (req, res) => {
  try {
    const app = await Appointment.findById(req.params.appointmentId);
    if (!app) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Role-based authorization and cross-tenant checks
    if (req.user.role === 'patient') {
      if (app.patientId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
      }
    } else if (['clinic_admin', 'doctor', 'staff'].includes(req.user.role)) {
      if (app.clinicId.toString() !== req.user.clinicId.toString()) {
        return res.status(403).json({ message: 'Access denied: Cross-tenant modification blocked' });
      }
    }

    if (app.status === 'cancelled') {
      return res.status(400).json({ message: 'Appointment is already cancelled' });
    }

    app.status = 'cancelled';
    await app.save();

    // Trigger emails
    const patientUser = await User.findById(app.patientId);
    const doctorUser = await User.findById(app.doctorId);
    const clinic = await Clinic.findById(app.clinicId);

    if (patientUser && doctorUser && clinic) {
      await sendBookingNotification(app, patientUser, doctorUser, clinic, 'cancelled');
    }

    res.json({ message: 'Appointment cancelled successfully', appointment: app });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ message: 'Server error, cancellation failed' });
  }
};

// @desc    Reschedule appointment
// @route   PATCH /api/appointments/:appointmentId/reschedule
// @access  Private
export const rescheduleAppointment = async (req, res) => {
  try {
    const { date, startTime } = req.body;
    if (!date || !startTime) {
      return res.status(400).json({ message: 'Date and startTime are required for rescheduling' });
    }

    const app = await Appointment.findById(req.params.appointmentId);
    if (!app) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Role validation and cross-tenant checks
    if (req.user.role === 'patient') {
      if (app.patientId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to reschedule this appointment' });
      }
    } else if (['clinic_admin', 'doctor', 'staff'].includes(req.user.role)) {
      if (app.clinicId.toString() !== req.user.clinicId.toString()) {
        return res.status(403).json({ message: 'Access denied: Cross-tenant modification blocked' });
      }
    }

    if (app.status === 'cancelled' || app.status === 'completed') {
      return res.status(400).json({ message: `Cannot reschedule a ${app.status} appointment` });
    }

    // Validate new slot
    let bookingResult;
    try {
      bookingResult = await checkSlotAvailability(app.doctorId, date, startTime, app.clinicId);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const targetDateMidnight = new Date(new Date(date).setHours(0, 0, 0, 0));

    app.date = targetDateMidnight;
    app.startTime = startTime;
    app.endTime = bookingResult.endTime;
    app.status = 'confirmed';
    await app.save();

    // Trigger emails
    const patientUser = await User.findById(app.patientId);
    const doctorUser = await User.findById(app.doctorId);
    const clinic = await Clinic.findById(app.clinicId);

    if (patientUser && doctorUser && clinic) {
      await sendBookingNotification(app, patientUser, doctorUser, clinic, 'rescheduled');
    }

    res.json({ message: 'Appointment rescheduled successfully', appointment: app });
  } catch (error) {
    console.error('Reschedule appointment error:', error);
    res.status(500).json({ message: 'Server error, rescheduling failed', error: error.message });
  }
};
