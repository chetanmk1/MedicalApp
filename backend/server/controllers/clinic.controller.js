import Clinic from '../models/Clinic.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// @desc    Register a new clinic onboarding request
// @route   POST /api/clinics/register
// @access  Public
export const createClinic = async (req, res) => {
  try {
    const { name, city, district, address, phone, email, adminName, adminEmail, adminPhone } = req.body;

    if (!name || !city || !district || !address || !phone || !email || !adminName || !adminEmail || !adminPhone) {
      return res.status(400).json({ message: 'Please provide all clinic and admin details' });
    }

    // Check if clinic already exists with email
    const clinicExists = await Clinic.findOne({ email });
    if (clinicExists) {
      return res.status(400).json({ message: 'A clinic request with this email already exists' });
    }

    // Check if admin email already taken by any user
    const userExists = await User.findOne({ email: adminEmail });
    if (userExists) {
      return res.status(400).json({ message: 'A user with this admin email already exists' });
    }

    const clinic = await Clinic.create({
      name,
      city,
      district,
      address,
      phone,
      email,
      adminName,
      adminEmail,
      adminPhone,
      status: 'pending', // Pending super admin approval
    });

    res.status(201).json({ message: 'Onboarding request submitted successfully. Pending approval.', clinic });
  } catch (error) {
    console.error('Create clinic error:', error);
    res.status(500).json({ message: 'Server error, clinic onboarding failed', error: error.message });
  }
};

// @desc    Update clinic profile
// @route   PUT /api/clinics/:clinicId
// @access  Private (clinic_admin)
export const updateClinic = async (req, res) => {
  try {
    const { name, city, district, address, phone, email } = req.body;
    const { clinicId } = req; // injected by enforceTenant middleware

    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    // Update fields
    if (name) clinic.name = name;
    if (city) clinic.city = city;
    if (district) clinic.district = district;
    if (address) clinic.address = address;
    if (phone) clinic.phone = phone;
    if (email) clinic.email = email;

    await clinic.save();
    res.json({ clinic });
  } catch (error) {
    console.error('Update clinic error:', error);
    res.status(500).json({ message: 'Server error, clinic update failed', error: error.message });
  }
};

// @desc    Update clinic status (active, inactive, suspended)
// @route   PATCH /api/clinics/:clinicId/status
// @access  Private (super_admin)
export const updateClinicStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const targetClinicId = req.params.clinicId;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const clinic = await Clinic.findById(targetClinicId);
    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    clinic.status = status;
    await clinic.save();

    res.json({ message: `Clinic status updated to ${status}`, clinic });
  } catch (error) {
    console.error('Update clinic status error:', error);
    res.status(500).json({ message: 'Server error, clinic status update failed', error: error.message });
  }
};

// @desc    Approve clinic request and create its clinic admin (Super Admin only)
// @route   PATCH /api/clinics/:clinicId/approve
// @access  Private (super_admin)
export const approveClinic = async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.clinicId);
    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    if (clinic.status === 'active') {
      return res.status(400).json({ message: 'Clinic is already active' });
    }

    // Create the clinic admin user
    // Check if email already taken
    const userExists = await User.findOne({ email: clinic.adminEmail });
    if (userExists) {
      return res.status(400).json({ message: 'A user with this clinic admin email already exists' });
    }

    // Generate temp password
    const tempPassword = 'TempPass123!';

    const adminUser = await User.create({
      name: clinic.adminName,
      email: clinic.adminEmail,
      phone: clinic.adminPhone,
      password: tempPassword,
      role: 'clinic_admin',
      clinicId: clinic._id,
      status: 'active',
    });

    clinic.status = 'active';
    await clinic.save();

    res.json({
      message: 'Clinic approved and admin user created successfully',
      clinic,
      admin: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        tempPassword,
      },
    });
  } catch (error) {
    console.error('Approve clinic error:', error);
    res.status(500).json({ message: 'Server error, approval failed', error: error.message });
  }
};

// @desc    Reject clinic request (Super Admin only)
// @route   PATCH /api/clinics/:clinicId/reject
// @access  Private (super_admin)
export const rejectClinic = async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.clinicId);
    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    if (clinic.status !== 'pending') {
      return res.status(400).json({ message: `Cannot reject clinic with status: ${clinic.status}` });
    }

    clinic.status = 'rejected';
    await clinic.save();

    res.json({ message: 'Clinic request rejected successfully', clinic });
  } catch (error) {
    console.error('Reject clinic error:', error);
    res.status(500).json({ message: 'Server error, rejection failed' });
  }
};

// @desc    Search clinics by city/district or fetch all active
// @route   GET /api/clinics
// @access  Public
export const getClinics = async (req, res) => {
  try {
    const { city, district, status, name } = req.query;
    const query = {};

    // Check if requester is super_admin (optionally decode token)
    let isSuperAdmin = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_access_secret_99887766');
        const user = await User.findById(decoded.id).select('role');
        if (user && user.role === 'super_admin') {
          isSuperAdmin = true;
        }
      } catch (err) {
        // Ignore invalid token
      }
    }

    if (isSuperAdmin) {
      if (status) {
        query.status = status;
      }
    } else {
      query.status = 'active';
    }

    if (name) {
      query.name = { $regex: new RegExp(name, 'i') };
    }
    if (city) {
      query.city = { $regex: new RegExp(city, 'i') };
    }
    if (district) {
      query.district = { $regex: new RegExp(district, 'i') };
    }

    const clinics = await Clinic.find(query);
    res.json({ clinics });
  } catch (error) {
    console.error('Search clinics error:', error);
    res.status(500).json({ message: 'Server error, searching clinics failed', error: error.message });
  }
};

// @desc    Get single clinic profile
// @route   GET /api/clinics/:id
// @access  Public
export const getClinicById = async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }
    res.json({ clinic });
  } catch (error) {
    console.error('Get clinic error:', error);
    res.status(500).json({ message: 'Server error, fetching clinic details failed' });
  }
};
