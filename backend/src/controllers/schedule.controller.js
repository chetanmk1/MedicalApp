import Schedule from '../models/Schedule.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';

// Helper to add minutes to HH:MM string
const addMinutes = (timeStr, minsToAdd) => {
  const [hours, mins] = timeStr.split(':').map(Number);
  const tempDate = new Date();
  tempDate.setHours(hours, mins + minsToAdd, 0, 0);
  return `${String(tempDate.getHours()).padStart(2, '0')}:${String(tempDate.getMinutes()).padStart(2, '0')}`;
};

// Helper to check if timeStr1 >= timeStr2
const isAfterOrEqual = (timeStr1, timeStr2) => {
  return timeStr1.localeCompare(timeStr2) >= 0;
};

// @desc    Get doctor schedule details
// @route   GET /api/schedules/doctor/:doctorId
// @access  Public
export const getDoctorSchedule = async (req, res) => {
  try {
    const { doctorId } = req.params;
    let schedule = await Schedule.findOne({ doctorId });

    if (!schedule) {
      // Return a default blank schedule structure
      return res.json({
        doctorId,
        slotDuration: 30,
        weeklyAvailability: [],
        leaves: [],
        holidays: [],
      });
    }

    res.json(schedule);
  } catch (error) {
    console.error('Get doctor schedule error:', error);
    res.status(500).json({ message: 'Server error, fetching schedule failed' });
  }
};

// @desc    Update or Create doctor schedule
// @route   PUT /api/schedules/doctor/:doctorId
// @access  Private (doctor, clinic_admin)
export const updateDoctorSchedule = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { slotDuration, weeklyAvailability, leaves, holidays } = req.body;

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor user not found' });
    }

    // Tenant isolation verification
    if (req.user.role === 'clinic_admin') {
      if (doctor.clinicId.toString() !== req.user.clinicId.toString()) {
        return res.status(403).json({ message: 'Access denied: Doctor belongs to another clinic' });
      }
    } else if (req.user.role === 'doctor') {
      if (req.user._id.toString() !== doctorId) {
        return res.status(403).json({ message: 'Access denied: Cannot update another doctor schedule' });
      }
    }

    let schedule = await Schedule.findOne({ doctorId });

    if (schedule) {
      if (slotDuration) schedule.slotDuration = slotDuration;
      if (weeklyAvailability) schedule.weeklyAvailability = weeklyAvailability;
      if (leaves) schedule.leaves = leaves;
      if (holidays) schedule.holidays = holidays;
      await schedule.save();
    } else {
      schedule = await Schedule.create({
        clinicId: doctor.clinicId,
        doctorId,
        slotDuration: slotDuration || 30,
        weeklyAvailability: weeklyAvailability || [],
        leaves: leaves || [],
        holidays: holidays || [],
      });
    }

    res.json({ message: 'Schedule updated successfully', schedule });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ message: 'Server error, schedule update failed', error: error.message });
  }
};

// @desc    Get slot availability for a doctor on a specific date
// @route   GET /api/schedules/doctor/:doctorId/slots
// @access  Public
export const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query; // format: YYYY-MM-DD

    if (!date) {
      return res.status(400).json({ message: 'Date query parameter (YYYY-MM-DD) is required' });
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Set date to midnight UTC/local for comparison
    const searchDateStart = new Date(targetDate.setHours(0, 0, 0, 0));
    const searchDateEnd = new Date(targetDate.setHours(23, 59, 59, 999));

    const schedule = await Schedule.findOne({ doctorId });
    if (!schedule) {
      return res.json({ slots: [] });
    }

    // 1. Check holidays
    const isHoliday = schedule.holidays.some((h) => {
      const holidayDate = new Date(h.date);
      return (
        holidayDate.getFullYear() === searchDateStart.getFullYear() &&
        holidayDate.getMonth() === searchDateStart.getMonth() &&
        holidayDate.getDate() === searchDateStart.getDate()
      );
    });

    if (isHoliday) {
      return res.json({ message: 'Selected date is a clinic holiday', slots: [] });
    }

    // 2. Check leaves
    const isOnLeave = schedule.leaves.some((l) => {
      const start = new Date(l.startDate);
      start.setHours(0,0,0,0);
      const end = new Date(l.endDate);
      end.setHours(23,59,59,999);
      return searchDateStart >= start && searchDateStart <= end;
    });

    if (isOnLeave) {
      return res.json({ message: 'Doctor is on leave on selected date', slots: [] });
    }

    // 3. Find availability for this day of the week
    const dayOfWeek = searchDateStart.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daySchedule = schedule.weeklyAvailability.find((d) => d.dayOfWeek === dayOfWeek);

    if (!daySchedule || !daySchedule.slots || daySchedule.slots.length === 0) {
      return res.json({ slots: [] });
    }

    // 4. Fetch existing appointments on this date
    const appointments = await Appointment.find({
      doctorId,
      date: { $gte: searchDateStart, $lte: searchDateEnd },
      status: { $ne: 'cancelled' },
    });

    // 5. Generate and check slots
    const availableSlots = [];
    const slotDuration = schedule.slotDuration;

    for (const shift of daySchedule.slots) {
      let current = shift.startTime;
      const end = shift.endTime;

      while (isAfterOrEqual(end, addMinutes(current, slotDuration))) {
        const nextTime = addMinutes(current, slotDuration);
        
        // Check if slot overlaps with any active appointment
        const isBooked = appointments.some((app) => {
          // Check if slot overlaps with appointment
          // Appointment time: [app.startTime, app.endTime]
          // Current slot time: [current, nextTime]
          return (
            (isAfterOrEqual(current, app.startTime) && !isAfterOrEqual(current, app.endTime)) ||
            (isAfterOrEqual(nextTime, app.startTime) && !isAfterOrEqual(nextTime, app.endTime)) ||
            (isAfterOrEqual(app.startTime, current) && !isAfterOrEqual(app.startTime, nextTime))
          );
        });

        availableSlots.push({
          startTime: current,
          endTime: nextTime,
          available: !isBooked,
        });

        current = nextTime;
      }
    }

    res.json({ slots: availableSlots });
  } catch (error) {
    console.error('Calculate slots error:', error);
    res.status(500).json({ message: 'Server error, calculating slots failed', error: error.message });
  }
};
