import mongoose from 'mongoose';
import app from './app.js';
import User from './models/User.js';
import Clinic from './models/Clinic.js';
import Schedule from './models/Schedule.js';
import Appointment from './models/Appointment.js';
import SystemSetting from './models/SystemSetting.js';

const PORT = 5051;
const BASE_URL = `http://localhost:${PORT}/api`;

const logTest = (msg) => console.log(`\x1b[34m[TEST]\x1b[0m ${msg}`);
const logSuccess = (msg) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`);
const logError = (msg) => console.error(`\x1b[31m[ERROR]\x1b[0m ${msg}`);

async function run() {
  let server;
  try {
    logTest('Connecting to database...');
    // Connect to database (use local test DB)
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medical_app_db_test');
    
    // Clean database before tests
    await User.deleteMany({});
    await Clinic.deleteMany({});
    await Schedule.deleteMany({});
    await Appointment.deleteMany({});
    await SystemSetting.deleteMany({});

    logTest('Starting Express test server...');
    server = app.listen(PORT);
    logSuccess(`Server running on port ${PORT}`);

    // Create a Super Admin account directly in database
    logTest('Seeding Super Admin...');
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'super@medbook.com',
      password: 'superpassword123',
      role: 'super_admin',
      phone: '0000000000',
      status: 'active'
    });
    logSuccess('Super Admin seeded successfully');

    // 1. Patient Registration & OTP Verification
    logTest('1. Testing Patient Registration...');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@patient.com',
        password: 'patientpassword123',
        phone: '1234567890'
      })
    });
    const regData = await regRes.json();
    if (regRes.status !== 201) throw new Error(`Patient registration failed: ${JSON.stringify(regData)}`);
    logSuccess('Patient registered successfully (pending OTP)');

    logTest('1b. Testing Patient OTP Verification...');
    const verifyRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'john@patient.com',
        otpCode: '123456'
      })
    });
    const verifyData = await verifyRes.json();
    if (verifyRes.status !== 200) throw new Error(`Patient OTP verification failed: ${JSON.stringify(verifyData)}`);
    const patientToken = verifyData.token;
    const patientId = verifyData.user.id;
    logSuccess('Patient OTP verified successfully');

    // 2. Super Admin Login
    logTest('2. Testing Super Admin Login...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'super@medbook.com',
        password: 'superpassword123'
      })
    });
    const loginData = await loginRes.json();
    if (loginRes.status !== 200) throw new Error(`Super admin login failed: ${JSON.stringify(loginData)}`);
    const superToken = loginData.token;
    logSuccess('Super Admin logged in successfully');

    // 3. Create Clinic Onboarding Request
    logTest('3. Testing Clinic Onboarding request...');
    const clinicRes = await fetch(`${BASE_URL}/clinics/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Care First Clinic',
        city: 'New York',
        district: 'Manhattan',
        address: '123 Broadway St',
        phone: '555-0199',
        email: 'info@carefirst.com',
        adminName: 'Alice Manager',
        adminEmail: 'alice@carefirst.com',
        adminPhone: '555-0211'
      })
    });
    const clinicData = await clinicRes.json();
    if (clinicRes.status !== 201) throw new Error(`Clinic registration failed: ${JSON.stringify(clinicData)}`);
    const clinicId = clinicData.clinic._id;
    logSuccess(`Clinic Onboarding request submitted: ${clinicData.clinic.name} (${clinicId})`);

    // 4. Approve Clinic Onboarding (Super Admin)
    logTest('4. Testing Clinic Approval and Clinic Admin creation...');
    const approveRes = await fetch(`${BASE_URL}/clinics/${clinicId}/approve`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${superToken}`
      }
    });
    const approveData = await approveRes.json();
    if (approveRes.status !== 200) throw new Error(`Clinic approval failed: ${JSON.stringify(approveData)}`);
    logSuccess('Clinic approved and Clinic Admin account automatically created');

    // Login Clinic Admin (using temp password created during approval)
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alice@carefirst.com',
        password: 'TempPass123!'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    if (adminLoginRes.status !== 200) throw new Error(`Admin login failed: ${JSON.stringify(adminLoginData)}`);
    const adminToken = adminLoginData.token;
    logSuccess('Clinic Admin logged in successfully');

    // 5. Test Maintenance Mode Toggle & Bypass
    logTest('5. Testing Maintenance Mode toggle...');
    const maintToggleRes = await fetch(`${BASE_URL}/settings/maintenance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superToken}`
      },
      body: JSON.stringify({ maintenanceMode: true })
    });
    if (maintToggleRes.status !== 200) throw new Error('Failed to toggle maintenance mode ON');

    // Try to access public API as patient under maintenance
    logTest('Verifying patient gets blocked by maintenance...');
    const patientMaintRes = await fetch(`${BASE_URL}/clinics`);
    const patientMaintData = await patientMaintRes.json();
    if (patientMaintRes.status !== 503 || !patientMaintData.maintenance) {
      throw new Error(`Patient was not blocked by maintenance: Status ${patientMaintRes.status}`);
    }
    logSuccess('Patient was correctly blocked (503 Service Unavailable)');

    // Access public API as super admin under maintenance
    logTest('Verifying super admin bypasses maintenance...');
    const superMaintRes = await fetch(`${BASE_URL}/clinics`, {
      headers: { 'Authorization': `Bearer ${superToken}` }
    });
    if (superMaintRes.status !== 200) {
      throw new Error(`Super admin was blocked by maintenance: Status ${superMaintRes.status}`);
    }
    logSuccess('Super Admin bypassed maintenance successfully');

    // Toggle maintenance off
    logTest('Deactivating maintenance mode...');
    await fetch(`${BASE_URL}/settings/maintenance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superToken}`
      },
      body: JSON.stringify({ maintenanceMode: false })
    });
    logSuccess('Maintenance mode deactivated');

    // 6. Create Doctor Account (Clinic Admin)
    logTest('6. Testing Doctor User Onboarding...');
    const docRes = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Robert Chen',
        email: 'robert@carefirst.com',
        password: 'doctorpassword123',
        phone: '555-0322',
        role: 'doctor',
        specialization: 'Pediatrician'
      })
    });
    const docData = await docRes.json();
    if (docRes.status !== 201) throw new Error(`Doctor onboarding failed: ${JSON.stringify(docData)}`);
    const doctorId = docData.user.id;
    logSuccess(`Doctor Created: Dr. ${docData.user.name} (${doctorId})`);

    // 7. Configure Doctor Schedule
    logTest('7. Configure Weekly Availability (Monday availability)...');
    const mondayShift = {
      dayOfWeek: 1, // Monday
      slots: [{ startTime: '09:00', endTime: '12:00' }]
    };
    const schedRes = await fetch(`${BASE_URL}/schedules/doctor/${doctorId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        slotDuration: 30,
        weeklyAvailability: [mondayShift],
        leaves: [],
        holidays: []
      })
    });
    const schedData = await schedRes.json();
    if (schedRes.status !== 200) throw new Error(`Schedule save failed: ${JSON.stringify(schedData)}`);
    logSuccess('Weekly availability configured successfully');

    // 8. Retrieve slots on a Monday
    // Date: 2026-05-25 (Monday)
    const testDate = '2026-05-25';
    logTest(`8. Fetching slots on ${testDate}...`);
    const slotsRes = await fetch(`${BASE_URL}/schedules/doctor/${doctorId}/slots?date=${testDate}`);
    const slotsData = await slotsRes.json();
    if (slotsRes.status !== 200) throw new Error(`Failed to fetch slots: ${JSON.stringify(slotsData)}`);
    logSuccess(`Retrieved slots count: ${slotsData.slots.length}`);
    const firstSlot = slotsData.slots[0];
    logTest(`First slot: ${firstSlot.startTime} - ${firstSlot.endTime} (Available: ${firstSlot.available})`);

    // 9. Book Appointment
    logTest('9. Testing Appointment Booking...');
    const bookRes = await fetch(`${BASE_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${patientToken}`
      },
      body: JSON.stringify({
        clinicId,
        doctorId,
        date: testDate,
        startTime: '09:30',
        notes: 'Regular child checkup'
      })
    });
    const bookData = await bookRes.json();
    if (bookRes.status !== 201) throw new Error(`Booking failed: ${JSON.stringify(bookData)}`);
    const appId = bookData.appointment._id;
    logSuccess(`Appointment booked successfully (ID: ${appId})`);

    // 10. Verify Booking Collision Blockage
    logTest('10. Verifying duplicate booking is blocked...');
    const duplicateBookRes = await fetch(`${BASE_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${patientToken}`
      },
      body: JSON.stringify({
        clinicId,
        doctorId,
        date: testDate,
        startTime: '09:30'
      })
    });
    if (duplicateBookRes.status === 201) throw new Error('Duplicate booking was allowed!');
    logSuccess('Collision check works - duplicate booking blocked correctly');

    // 11. Reschedule Appointment
    logTest('11. Testing Appointment Rescheduling to 10:00...');
    const reschedRes = await fetch(`${BASE_URL}/appointments/${appId}/reschedule`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${patientToken}`
      },
      body: JSON.stringify({
        date: testDate,
        startTime: '10:00'
      })
    });
    const reschedData = await reschedRes.json();
    if (reschedRes.status !== 200) throw new Error(`Rescheduling failed: ${JSON.stringify(reschedData)}`);
    logSuccess('Appointment rescheduled successfully');

    // 12. Cross-Tenant Protection Checks
    // Seeding another clinic and trying to access its bookings using adminToken
    logTest('12. Testing Cross-Tenant security guards...');
    const secondClinic = await Clinic.create({
      name: 'Second Clinic',
      city: 'Boston',
      district: 'Downtown',
      address: '456 Washington St',
      phone: '555-0811',
      email: 'info@secondclinic.com'
    });
    
    // Make request using Alice Manager's token (belonging to Care First Clinic) to modify Second Clinic's profile
    const breachRes = await fetch(`${BASE_URL}/clinics/${secondClinic._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ name: 'Breached Clinic Name' })
    });
    if (breachRes.status !== 403) {
      throw new Error(`Cross-tenant security breach allowed! Status: ${breachRes.status}`);
    }
    logSuccess('Cross-tenant data breach blocked successfully (403 Forbidden)');

    // 13. Receptionist Onboarding & Check-in
    logTest('13. Testing Receptionist User Onboarding...');
    const recepCreateRes = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Sarah Receptionist',
        email: 'recep@carefirst.com',
        password: 'receppassword123',
        phone: '555-0433',
        role: 'receptionist'
      })
    });
    const recepCreateData = await recepCreateRes.json();
    if (recepCreateRes.status !== 201) throw new Error(`Receptionist onboarding failed: ${JSON.stringify(recepCreateData)}`);
    logSuccess('Receptionist created successfully');

    // Login Receptionist
    const recepLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'recep@carefirst.com',
        password: 'receppassword123'
      })
    });
    const recepLoginData = await recepLoginRes.json();
    if (recepLoginRes.status !== 200) throw new Error(`Receptionist login failed: ${JSON.stringify(recepLoginData)}`);
    const recepToken = recepLoginData.token;
    logSuccess('Receptionist logged in successfully');

    // Check-in Patient
    logTest('Testing Patient Check-in by Receptionist...');
    const checkInRes = await fetch(`${BASE_URL}/appointments/${appId}/check-in`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${recepToken}`
      }
    });
    const checkInData = await checkInRes.json();
    if (checkInRes.status !== 200) throw new Error(`Patient check-in failed: ${JSON.stringify(checkInData)}`);
    if (checkInData.appointment.status !== 'checked_in') {
      throw new Error(`Appointment status should be checked_in, got: ${checkInData.appointment.status}`);
    }
    logSuccess('Patient checked in successfully');

    // 14. Doctor Consultation Completion
    logTest('14. Testing Doctor Login and Consultation Completion...');
    const doctorLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'robert@carefirst.com',
        password: 'doctorpassword123'
      })
    });
    const doctorLoginData = await doctorLoginRes.json();
    if (doctorLoginRes.status !== 200) throw new Error(`Doctor login failed: ${JSON.stringify(doctorLoginData)}`);
    const doctorToken = doctorLoginData.token;
    logSuccess('Doctor logged in successfully');

    // Complete Appointment
    logTest('Testing consultation complete and notes entry...');
    const completeRes = await fetch(`${BASE_URL}/appointments/${appId}/complete`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${doctorToken}`
      },
      body: JSON.stringify({
        consultationNotes: 'Patient has mild fever. Prescribed rest and paracetamol.'
      })
    });
    const completeData = await completeRes.json();
    if (completeRes.status !== 200) throw new Error(`Consultation complete failed: ${JSON.stringify(completeData)}`);
    if (completeData.appointment.status !== 'completed' || completeData.appointment.notes !== 'Patient has mild fever. Prescribed rest and paracetamol.') {
      throw new Error(`Completion status or notes mismatch: ${JSON.stringify(completeData)}`);
    }
    logSuccess('Consultation completed successfully by doctor');

    // 15. Verify cancellation of completed appointment is blocked
    logTest('15. Verifying cancellation of completed appointment is blocked...');
    const cancelCompletedRes = await fetch(`${BASE_URL}/appointments/${appId}/cancel`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${patientToken}` }
    });
    if (cancelCompletedRes.status === 200) {
      throw new Error('Allowed to cancel a completed appointment!');
    }
    logSuccess('Cancellation of completed appointment blocked successfully');

    // 16. Book and Cancel a new appointment (to test cancellation flow)
    logTest('16. Book and cancel a second appointment...');
    const secondBookRes = await fetch(`${BASE_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${patientToken}`
      },
      body: JSON.stringify({
        clinicId,
        doctorId,
        date: testDate,
        startTime: '11:00',
        notes: 'Follow-up query'
      })
    });
    const secondBookData = await secondBookRes.json();
    if (secondBookRes.status !== 201) throw new Error(`Booking second appointment failed: ${JSON.stringify(secondBookData)}`);
    const secondAppId = secondBookData.appointment._id;
    logSuccess('Second appointment booked successfully');

    // Cancel second appointment
    const cancelRes = await fetch(`${BASE_URL}/appointments/${secondAppId}/cancel`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${patientToken}` }
    });
    if (cancelRes.status !== 200) throw new Error('Second appointment cancellation failed');
    logSuccess('Second appointment cancelled successfully');

    console.log('\n\x1b[32m=============================================\x1b[0m');
    console.log('\x1b[32m   ALL E2E INTEGRATION TESTS PASSED!   \x1b[0m');
    console.log('\x1b[32m=============================================\x1b[0m\n');

  } catch (error) {
    logError(`Test suite crashed: ${error.message}`);
    console.error(error);
  } finally {
    if (server) {
      logTest('Shutting down server...');
      server.close();
    }
    logTest('Disconnecting DB...');
    await mongoose.disconnect();
    logSuccess('Cleanup complete');
  }
}

run();
