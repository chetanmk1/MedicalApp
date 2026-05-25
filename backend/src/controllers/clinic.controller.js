import Clinic from '../models/Clinic.js';

// @desc    Create a new clinic (Onboarding)
// @route   POST /api/clinics
// @access  Private (super_admin)
export const createClinic = async (req, res) => {
  try {
    const { name, city, district, address, phone, email } = req.body;

    const clinic = await Clinic.create({
      name,
      city,
      district,
      address,
      phone,
      email,
      status: 'active',
    });

    res.status(201).json({ clinic });
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

// @desc    Search clinics by city/district or fetch all active
// @route   GET /api/clinics
// @access  Public
export const getClinics = async (req, res) => {
  try {
    const { city, district } = req.query;
    const query = { status: 'active' };

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
