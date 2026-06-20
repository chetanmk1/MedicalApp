import request from 'supertest';
import mongoose from 'mongoose';
import crypto from 'crypto';
import app from '../app.js';
import User from '../models/User.js';
import Clinic from '../models/Clinic.js';
import Schedule from '../models/Schedule.js';
import Appointment from '../models/Appointment.js';
import SystemSetting from '../models/SystemSetting.js';
import Notification from '../models/Notification.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medical_app_db_test';

beforeAll(async () => {
  await mongoose.connect(MONGO_URI);
  // Clear collections
  await User.deleteMany({});
  await Clinic.deleteMany({});
  await Schedule.deleteMany({});
  await Appointment.deleteMany({});
  await SystemSetting.deleteMany({});
  await Notification.deleteMany({});
});

afterAll(async () => {
  await User.deleteMany({});
  await Clinic.deleteMany({});
  await Schedule.deleteMany({});
  await Appointment.deleteMany({});
  await SystemSetting.deleteMany({});
  await Notification.deleteMany({});
  await mongoose.connection.close();
});

describe('MedCare Refactored Hybrid SaaS API Suite', () => {
  let superAdminToken;
  let clinicId;
  let clinicAdminToken;
  let clinicAdminId;
  let doctorToken;
  let doctorId;
  let receptionistToken;
  let receptionistId;
  let patientToken;
  let patientId;
  let appointmentId;

  const testDate = '2026-05-25'; // Monday

  // --- 1. AUTHENTICATION & SUPER ADMIN SETUP ---
  describe('Authentication & Seeding Tests', () => {
    it('should setup the initial super admin', async () => {
      const res = await request(app)
        .post('/api/auth/setup-super-admin')
        .send({
          name: 'Super Admin',
          email: 'super@medbook.com',
          password: 'superpassword123',
          phone: '0000000000'
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('super_admin');
      expect(res.body.token).toBeDefined();
      superAdminToken = res.body.token;
    });

    it('should block setup-super-admin if super admin already exists', async () => {
      const res = await request(app)
        .post('/api/auth/setup-super-admin')
        .send({
          name: 'Super Admin Two',
          email: 'super2@medbook.com',
          password: 'superpassword123',
          phone: '0000000000'
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Super Admin already exists');
    });

    it('should register a patient (sets pending_otp status)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@patient.com',
          password: 'patientpassword123',
          phone: '1234567890'
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('pending_otp');
      expect(res.body.token).toBeUndefined(); // No token issued yet
    });

    it('should block login of unverified patient', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@patient.com',
          password: 'patientpassword123'
        });

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('pending_otp');
    });

    it('should fail OTP verification with incorrect code', async () => {
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          email: 'john@patient.com',
          otpCode: '000000'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid or expired OTP code');
    });

    it('should verify OTP and issue token for patient', async () => {
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          email: 'john@patient.com',
          otpCode: '123456'
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.status).toBe('active');
      patientToken = res.body.token;
      patientId = res.body.user.id;
    });

    it('should login patient successfully now', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@patient.com',
          password: 'patientpassword123'
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it('should allow patient to update profile', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          name: 'John Updated Doe',
          phone: '9876543210'
        });

      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('John Updated Doe');
      expect(res.body.user.phone).toBe('9876543210');
    });

    it('should allow patient to update password', async () => {
      const res = await request(app)
        .put('/api/auth/update-password')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          currentPassword: 'patientpassword123',
          newPassword: 'newpatientpassword123'
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Password updated successfully');
    });

    it('should allow forgot password request', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'john@patient.com'
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBeDefined();
    });

    it('should reset password using a reset token', async () => {
      const rawToken = 'myresettoken123';
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      // Inject token directly into DB
      const user = await User.findOne({ email: 'john@patient.com' });
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
      await user.save({ validateBeforeSave: false });

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: rawToken,
          password: 'patientpassword123' // reset back
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Password reset successful');
    });

    it('should refresh access token using cookie', async () => {
      // Authenticate to get cookies
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@patient.com',
          password: 'patientpassword123'
        });

      const cookies = loginRes.headers['set-cookie'];
      
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it('should logout user and clear cookie', async () => {
      const res = await request(app)
        .post('/api/auth/logout');

      expect(res.status).toBe(200);
      expect(res.headers['set-cookie'][0]).toContain('refreshToken=;');
    });
  });

  // --- 2. CLINIC ONBOARDING & APPROVAL ---
  describe('Clinic Onboarding Tests', () => {
    it('should submit a clinic onboarding request', async () => {
      const res = await request(app)
        .post('/api/clinics/register')
        .send({
          name: 'Care First Clinic',
          city: 'New York',
          district: 'Manhattan',
          address: '123 Broadway St',
          phone: '555-0199',
          email: 'info@carefirst.com',
          adminName: 'Alice Manager',
          adminEmail: 'alice@carefirst.com',
          adminPhone: '555-0211'
        });

      expect(res.status).toBe(201);
      expect(res.body.clinic.status).toBe('pending');
      clinicId = res.body.clinic._id;
    });

    it('should not return pending clinics for public searches', async () => {
      const res = await request(app)
        .get('/api/clinics');

      expect(res.status).toBe(200);
      const pendingClinic = res.body.clinics.find(c => c._id === clinicId);
      expect(pendingClinic).toBeUndefined();
    });

    it('should approve clinic and create admin user', async () => {
      const res = await request(app)
        .patch(`/api/clinics/${clinicId}/approve`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.clinic.status).toBe('active');
      expect(res.body.admin.tempPassword).toBeDefined();

      clinicAdminId = res.body.admin.id;
    });

    it('should login new clinic admin with temporary password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice@carefirst.com',
          password: 'TempPass123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('clinic_admin');
      clinicAdminToken = res.body.token;
    });

    it('should allow clinic admin to update clinic profile', async () => {
      const res = await request(app)
        .put(`/api/clinics/${clinicId}`)
        .set('Authorization', `Bearer ${clinicAdminToken}`)
        .send({
          name: 'Care First Hospital',
          phone: '555-9999'
        });

      expect(res.status).toBe(200);
      expect(res.body.clinic.name).toBe('Care First Hospital');
    });

    it('should allow super admin to change clinic status', async () => {
      const res = await request(app)
        .patch(`/api/clinics/${clinicId}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ status: 'suspended' });

      expect(res.status).toBe(200);
      expect(res.body.clinic.status).toBe('suspended');

      // Revert status to active for subsequent tests
      await Clinic.findByIdAndUpdate(clinicId, { status: 'active' });
    });

    it('should allow super admin to reject a clinic request', async () => {
      // Create a dummy pending clinic
      const tempClinic = await Clinic.create({
        name: 'Rejected Clinic Corp',
        city: 'Boston',
        district: 'West',
        address: '99 Main Road',
        phone: '123-4567',
        email: 'temp@clinic.com',
        adminName: 'Bob Rejected',
        adminEmail: 'bob@temp.com',
        adminPhone: '123-4568',
        status: 'pending'
      });

      const res = await request(app)
        .patch(`/api/clinics/${tempClinic._id}/reject`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      
      const dbClinic = await Clinic.findById(tempClinic._id);
      expect(dbClinic.status).toBe('rejected');
    });
  });

  // --- 3. INTERNAL STAFF ONBOARDING & MANAGEMENT ---
  describe('Internal Staff Onboarding Tests', () => {
    it('should allow clinic admin to create doctor user', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${clinicAdminToken}`)
        .send({
          name: 'Robert Chen',
          email: 'robert@carefirst.com',
          password: 'doctorpassword123',
          phone: '555-0322',
          role: 'doctor',
          specialization: 'Pediatrician'
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('doctor');
      doctorId = res.body.user.id;
    });

    it('should allow clinic admin to create receptionist user', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${clinicAdminToken}`)
        .send({
          name: 'Sarah Receptionist',
          email: 'recep@carefirst.com',
          password: 'receppassword123',
          phone: '555-0433',
          role: 'receptionist'
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('receptionist');
      receptionistId = res.body.user.id;
    });

    it('should get clinic users for clinic admin', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${clinicAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.users.length).toBeGreaterThanOrEqual(2);
    });

    it('should allow clinic admin to search/look up patients', async () => {
      const res = await request(app)
        .get('/api/users/patients/lookup')
        .set('Authorization', `Bearer ${clinicAdminToken}`)
        .query({ query: 'John' });

      expect(res.status).toBe(200);
      expect(res.body.patients.length).toBeGreaterThanOrEqual(1);
    });

    it('should allow clinic admin to update user status', async () => {
      const res = await request(app)
        .patch(`/api/users/${receptionistId}/status`)
        .set('Authorization', `Bearer ${clinicAdminToken}`)
        .send({ status: 'suspended' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('suspended');

      // Revert status to active
      await User.findByIdAndUpdate(receptionistId, { status: 'active' });
    });

    it('should block clinic admin from creating a super admin user', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${clinicAdminToken}`)
        .send({
          name: 'Fake Super Admin',
          email: 'fakesuper@carefirst.com',
          password: 'superpassword123',
          phone: '555-9999',
          role: 'super_admin'
        });

      expect(res.status).toBe(403);
    });

    it('should login receptionist successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'recep@carefirst.com',
          password: 'receppassword123'
        });

      expect(res.status).toBe(200);
      receptionistToken = res.body.token;
    });
  });

  // --- 4. SCHEDULE CONFIG & AVAILABILITY SLOTS ---
  describe('Doctor Schedule & Slot Listing Tests', () => {
    it('should return empty slots array if doctor has no schedule configured', async () => {
      const tempDoc = await User.create({
        name: 'No Sched Doc',
        email: 'nosched@carefirst.com',
        password: 'doctorpassword123',
        phone: '555-8888',
        role: 'doctor',
        clinicId,
        specialization: 'Dermatologist'
      });

      const res = await request(app)
        .get(`/api/schedules/doctor/${tempDoc._id}/slots`)
        .query({ date: testDate });

      expect(res.status).toBe(200);
      expect(res.body.slots).toEqual([]);
    });

    it('should configure doctor weekly availability schedule', async () => {
      const mondayShift = {
        dayOfWeek: 1, // Monday
        slots: [{ startTime: '09:00', endTime: '12:00' }]
      };

      const res = await request(app)
        .put(`/api/schedules/doctor/${doctorId}`)
        .set('Authorization', `Bearer ${clinicAdminToken}`)
        .send({
          slotDuration: 30,
          weeklyAvailability: [mondayShift],
          leaves: [],
          holidays: []
        });

      expect(res.status).toBe(200);
    });

    it('should block booking if proposed slot is outside work hours', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          clinicId,
          doctorId,
          date: testDate,
          startTime: '14:00'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('falls outside doctor\'s work hours');
    });

    it('should block booking on Sunday if no Sunday shift is set', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          clinicId,
          doctorId,
          date: '2026-05-24', // Sunday
          startTime: '09:30'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('does not consult on this day of the week');
    });

    it('should block booking on doctor holiday', async () => {
      // Add holiday to doctor's schedule
      const sched = await Schedule.findOne({ doctorId });
      sched.holidays.push({ date: new Date('2026-05-25T00:00:00.000Z'), description: 'Memorial Day' });
      await sched.save();

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          clinicId,
          doctorId,
          date: '2026-05-25',
          startTime: '09:30'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('holiday');

      // Clear holiday for next tests
      sched.holidays = [];
      await sched.save();
    });

    it('should block booking on doctor leave', async () => {
      // Add leave
      const sched = await Schedule.findOne({ doctorId });
      sched.leaves.push({ startDate: new Date('2026-05-25T00:00:00.000Z'), endDate: new Date('2026-05-25T23:59:59.000Z'), reason: 'Personal' });
      await sched.save();

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          clinicId,
          doctorId,
          date: '2026-05-25',
          startTime: '09:30'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('leave');

      // Clear leave
      sched.leaves = [];
      await sched.save();
    });

    it('should retrieve available slots for doctor on a given Monday', async () => {
      const res = await request(app)
        .get(`/api/schedules/doctor/${doctorId}/slots`)
        .query({ date: testDate });

      expect(res.status).toBe(200);
      expect(res.body.slots.length).toBe(6); // 9:00 to 12:00 (3 hours = 6 slots of 30 mins)
      expect(res.body.slots[0].startTime).toBe('09:00');
      expect(res.body.slots[0].available).toBe(true);
    });
  });

  // --- 5. APPOINTMENT BOOKING, CHECK-IN, COMPLETION ---
  describe('Appointment Workflow Tests', () => {
    it('should book an appointment as patient', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          clinicId,
          doctorId,
          date: testDate,
          startTime: '09:30',
          notes: 'Routine checkup'
        });

      expect(res.status).toBe(201);
      expect(res.body.appointment.status).toBe('confirmed');
      appointmentId = res.body.appointment._id;
    });

    it('should block booking of the same slot (collision)', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          clinicId,
          doctorId,
          date: testDate,
          startTime: '09:30'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already booked');
    });

    it('should allow receptionist to book appointment on behalf of patient', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          clinicId,
          doctorId,
          date: testDate,
          startTime: '11:00',
          patientId
        });

      expect(res.status).toBe(201);
      
      // Clean up the dummy appointment
      await Appointment.findByIdAndDelete(res.body.appointment._id);
    });

    it('should get list of appointments with filters', async () => {
      const res = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .query({ status: 'confirmed' });

      expect(res.status).toBe(200);
      expect(res.body.appointments.length).toBeGreaterThanOrEqual(1);
    });

    it('should reschedule appointment as patient', async () => {
      const res = await request(app)
        .patch(`/api/appointments/${appointmentId}/reschedule`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          date: testDate,
          startTime: '10:00'
        });

      expect(res.status).toBe(200);
      expect(res.body.appointment.startTime).toBe('10:00');
    });

    it('should check-in patient by receptionist', async () => {
      const res = await request(app)
        .patch(`/api/appointments/${appointmentId}/check-in`)
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(res.status).toBe(200);
      expect(res.body.appointment.status).toBe('checked_in');
    });

    it('should login doctor and complete appointment with notes', async () => {
      // Login Doctor
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'robert@carefirst.com',
          password: 'doctorpassword123'
        });
      expect(loginRes.status).toBe(200);
      doctorToken = loginRes.body.token;

      // Complete
      const res = await request(app)
        .patch(`/api/appointments/${appointmentId}/complete`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          consultationNotes: 'Mild allergies. Prescribed antihistamines.'
        });

      expect(res.status).toBe(200);
      expect(res.body.appointment.status).toBe('completed');
      expect(res.body.appointment.notes).toBe('Mild allergies. Prescribed antihistamines.');
    });

    it('should block cancellation of completed appointment', async () => {
      const res = await request(app)
        .patch(`/api/appointments/${appointmentId}/cancel`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot cancel a completed appointment');
    });
  });

  // --- 6. TENANT SECURITY & ROUTING ISOLATION ---
  describe('Tenant Scoping & Security Guards', () => {
    let secondClinic;

    it('should block non-tenant admin from modifying another clinic', async () => {
      // Create a second clinic
      secondClinic = await Clinic.create({
        name: 'Second Clinic Ltd',
        city: 'Boston',
        district: 'East',
        address: '45 Second Rd',
        phone: '111-2222',
        email: 'info@secondclinic.com',
        adminName: 'Manager Two',
        adminEmail: 'man2@second.com',
        adminPhone: '111-2223',
        status: 'active'
      });

      const res = await request(app)
        .put(`/api/clinics/${secondClinic._id}`)
        .set('Authorization', `Bearer ${clinicAdminToken}`)
        .send({ name: 'Breached Clinic Name' });

      expect(res.status).toBe(403);
    });

    it('should block clinic admin from updating status of user in another clinic', async () => {
      const otherUser = await User.create({
        name: 'Other Clinic Doctor',
        email: 'otherdoc@second.com',
        password: 'doctorpassword123',
        phone: '555-9876',
        role: 'doctor',
        clinicId: secondClinic._id,
        specialization: 'Cardiologist'
      });

      const res = await request(app)
        .patch(`/api/users/${otherUser._id}/status`)
        .set('Authorization', `Bearer ${clinicAdminToken}`)
        .send({ status: 'suspended' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });

    it('should block patient from cancelling another patient\'s appointment', async () => {
      // Create second patient
      const patient2 = await User.create({
        name: 'Jane Doe',
        email: 'jane@patient.com',
        password: 'patientpassword123',
        phone: '1234567891',
        role: 'patient',
        status: 'active'
      });
      // Generate token for patient 2
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'jane@patient.com', password: 'patientpassword123' });
      const patient2Token = loginRes.body.token;

      // Book an appointment for patient 1
      const appRes = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          clinicId,
          doctorId,
          date: testDate,
          startTime: '11:30'
        });
      const appToCancelId = appRes.body.appointment._id;

      // Try to cancel using patient 2's token
      const res = await request(app)
        .patch(`/api/appointments/${appToCancelId}/cancel`)
        .set('Authorization', `Bearer ${patient2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Not authorized');

      // Clean up
      await Appointment.findByIdAndDelete(appToCancelId);
    });

    it('should block patient from accessing admin endpoints', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
    });
  });

  // --- 7. ROLE SWITCHING & IMPERSONATION ---
  describe('Role Switching & Impersonation Tests', () => {
    it('should switch role within administrative staff boundaries', async () => {
      // Add 'doctor' to clinic admin's authorized roles
      const user = await User.findById(clinicAdminId);
      user.roles = ['clinic_admin', 'doctor'];
      await user.save({ validateBeforeSave: false });

      // Switch role to doctor
      const res = await request(app)
        .post('/api/auth/switch-role')
        .set('Authorization', `Bearer ${clinicAdminToken}`)
        .send({ role: 'doctor' });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('doctor');
      
      // Revert role back to clinic_admin
      const revertRes = await request(app)
        .post('/api/auth/switch-role')
        .set('Authorization', `Bearer ${res.body.token}`)
        .send({ role: 'clinic_admin' });

      expect(revertRes.status).toBe(200);
      expect(revertRes.body.user.role).toBe('clinic_admin');
    });

    it('should block role switching to patient', async () => {
      const res = await request(app)
        .post('/api/auth/switch-role')
        .set('Authorization', `Bearer ${clinicAdminToken}`)
        .send({ role: 'patient' });

      expect(res.status).toBe(403);
    });

    it('should impersonate a clinic user as super admin', async () => {
      const res = await request(app)
        .post('/api/auth/impersonate')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ userId: clinicAdminId });

      expect(res.status).toBe(200);
      expect(res.body.user.id.toString()).toBe(clinicAdminId.toString());
      expect(res.body.message).toContain('Impersonating');
    });

    it('should block impersonating another super admin', async () => {
      // Fetch super admin ID
      const superUser = await User.findOne({ role: 'super_admin' });
      const res = await request(app)
        .post('/api/auth/impersonate')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ userId: superUser._id });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('prohibited');
    });
  });

  // --- 8. GLOBAL MAINTENANCE INTERCEPTOR ---
  describe('Maintenance Mode Interceptor Tests', () => {
    it('should fetch global maintenance state publicly', async () => {
      const res = await request(app)
        .get('/api/settings/maintenance');

      expect(res.status).toBe(200);
      expect(res.body.maintenanceMode).toBeDefined();
    });

    it('should fail maintenance mode toggle if input is invalid', async () => {
      const res = await request(app)
        .post('/api/settings/maintenance')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ maintenanceMode: 'not-a-boolean' });

      expect(res.status).toBe(400);
    });

    it('should toggle maintenance mode ON as super admin', async () => {
      const res = await request(app)
        .post('/api/settings/maintenance')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ maintenanceMode: true });

      expect(res.status).toBe(200);
      expect(res.body.maintenanceMode).toBe(true);
    });

    it('should block patient requests under maintenance mode', async () => {
      const res = await request(app)
        .get('/api/clinics')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(503);
      expect(res.body.maintenance).toBe(true);
    });

    it('should allow super admin bypass under maintenance mode', async () => {
      const res = await request(app)
        .get('/api/clinics')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
    });

    it('should toggle maintenance mode OFF as super admin', async () => {
      const res = await request(app)
        .post('/api/settings/maintenance')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ maintenanceMode: false });

      expect(res.status).toBe(200);
    });
  });

  // --- 9. NOTIFICATIONS ---
  describe('Notification Tests', () => {
    let dummyNotificationId;

    it('should retrieve patient notifications list', async () => {
      // Insert a dummy notification
      const notif = await Notification.create({
        userId: patientId,
        title: 'Test Notification',
        message: 'This is a test notification message'
      });
      dummyNotificationId = notif._id;

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.notifications.length).toBeGreaterThanOrEqual(1);
    });

    it('should mark a notification as read', async () => {
      const res = await request(app)
        .patch(`/api/notifications/${dummyNotificationId}/read`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.notification.isRead).toBe(true);
    });
  });

  // --- 10. ERROR PATHS & EDGE CASES ---
  describe('Error Paths & Edge Cases', () => {
    it('should fail to register a clinic if a clinic email already exists', async () => {
      const res = await request(app)
        .post('/api/clinics/register')
        .send({
          name: 'Care First Duplicate',
          city: 'New York',
          district: 'Manhattan',
          address: '123 Broadway St',
          phone: '555-0199',
          email: 'info@carefirst.com',
          adminName: 'Alice Manager 2',
          adminEmail: 'alice2@carefirst.com',
          adminPhone: '555-0212'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already exists');
    });

    it('should fail to register a clinic if admin email already exists as a user', async () => {
      const res = await request(app)
        .post('/api/clinics/register')
        .send({
          name: 'Care First Duplicate Admin',
          city: 'New York',
          district: 'Manhattan',
          address: '123 Broadway St',
          phone: '555-0199',
          email: 'info-diff@carefirst.com',
          adminName: 'Alice Manager Duplicate',
          adminEmail: 'alice@carefirst.com',
          adminPhone: '555-0211'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already exists');
    });

    it('should fail to approve a clinic if it is already active', async () => {
      const res = await request(app)
        .patch(`/api/clinics/${clinicId}/approve`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already active');
    });

    it('should fail to reject a clinic if it is already approved', async () => {
      const res = await request(app)
        .patch(`/api/clinics/${clinicId}/reject`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot reject clinic');
    });

    it('should fail to create a user with duplicate email', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${clinicAdminToken}`)
        .send({
          name: 'Robert Duplicate',
          email: 'robert@carefirst.com',
          password: 'doctorpassword123',
          phone: '555-0322',
          role: 'doctor',
          specialization: 'Pediatrician'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already exists');
    });

    it('should block clinic admin from modifying administrative user status', async () => {
      const res = await request(app)
        .patch(`/api/users/${clinicAdminId}/status`)
        .set('Authorization', `Bearer ${clinicAdminToken}`)
        .send({ status: 'suspended' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Cannot update administrative roles');
    });

    it('should return 404 when reading a notification that does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/notifications/${nonExistentId}/read`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(404);
    });

    it('should block completing an appointment if the status is not confirmed/checked_in', async () => {
      const res = await request(app)
        .patch(`/api/appointments/${appointmentId}/complete`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ consultationNotes: 'Should fail' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot complete');
    });

    it('should block receptionist check-in if the status is not confirmed', async () => {
      const res = await request(app)
        .patch(`/api/appointments/${appointmentId}/check-in`)
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot check-in');
    });

    it('should fail login if status is suspended or inactive', async () => {
      await User.findByIdAndUpdate(patientId, { status: 'suspended' });
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@patient.com',
          password: 'patientpassword123'
        });
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('suspended');
      await User.findByIdAndUpdate(patientId, { status: 'active' });
    });

    it('should fail login if credentials are invalid', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@patient.com',
          password: 'wrongpassword'
        });
      expect(res.status).toBe(401);
    });

    it('should fail login if email or password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@patient.com'
        });
      expect(res.status).toBe(400);
    });

    it('should return error if trying to switch role to a role not authorized', async () => {
      const res = await request(app)
        .post('/api/auth/switch-role')
        .set('Authorization', `Bearer ${clinicAdminToken}`)
        .send({ role: 'super_admin' });
      expect(res.status).toBe(403);
    });

    it('should return already active message if switching to same role', async () => {
      const res = await request(app)
        .post('/api/auth/switch-role')
        .set('Authorization', `Bearer ${clinicAdminToken}`)
        .send({ role: 'clinic_admin' });
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Already active');
    });

    it('should fail to register a clinic with missing fields', async () => {
      const res = await request(app)
        .post('/api/clinics/register')
        .send({
          name: 'Incomplete Clinic'
        });
      expect(res.status).toBe(400);
    });

    it('should return 404 when approving a non-existent clinic', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/clinics/${nonExistentId}/approve`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(404);
    });

    it('should return 404 when rejecting a non-existent clinic', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/clinics/${nonExistentId}/reject`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(404);
    });

    it('should fail lookup of patient if query is missing', async () => {
      const res = await request(app)
        .get('/api/users/patients/lookup')
        .set('Authorization', `Bearer ${clinicAdminToken}`);
      expect(res.status).toBe(400);
    });
  });
});
