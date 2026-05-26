import User from '../models/User.js';

// @desc    Create a user (doctor, receptionist by clinic_admin; clinic_admin by super_admin)
// @route   POST /api/users
// @access  Private (super_admin, clinic_admin)
export const createUser = async (req, res) => {
  try {
    const { name, email, password, phone, role, specialization } = req.body;
    let targetClinicId = req.clinicId; // from enforceTenant middleware

    // Role-based validation
    if (req.user.role === 'clinic_admin') {
      // Clinic admins can only create doctors or receptionist for their own clinic
      if (!['doctor', 'receptionist'].includes(role)) {
        return res.status(403).json({ message: 'Clinic admins can only create doctor or receptionist users' });
      }
    } else if (req.user.role === 'super_admin') {
      // Super admin must provide clinicId for non-super_admin clinic roles
      if (['clinic_admin', 'doctor', 'receptionist'].includes(role)) {
        targetClinicId = req.body.clinicId;
        if (!targetClinicId) {
          return res.status(400).json({ message: 'Clinic ID is required for clinic-specific roles' });
        }
      }
    }

    // Check if email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    const newUser = await User.create({
      name,
      email,
      password,
      phone,
      role,
      clinicId: targetClinicId,
      specialization: role === 'doctor' ? specialization : undefined,
      status: 'active',
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        clinicId: newUser.clinicId,
        specialization: newUser.specialization,
        phone: newUser.phone,
        status: newUser.status,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error, user creation failed', error: error.message });
  }
};

// @desc    Get all clinic users (doctors and receptionists)
// @route   GET /api/users
// @access  Private (clinic_admin, receptionist)
export const getClinicUsers = async (req, res) => {
  try {
    const { clinicId } = req; // from enforceTenant
    
    if (!clinicId) {
      return res.status(400).json({ message: 'Clinic context not found' });
    }

    const users = await User.find({ clinicId, role: { $in: ['doctor', 'receptionist', 'clinic_admin'] } }).select('-password');
    res.json({ users });
  } catch (error) {
    console.error('Get clinic users error:', error);
    res.status(500).json({ message: 'Server error, fetching users failed' });
  }
};

// @desc    Get doctors (public search with filters)
// @route   GET /api/users/doctors
// @access  Public
export const getDoctors = async (req, res) => {
  try {
    const { clinicId, specialization } = req.query;
    const query = { role: 'doctor', status: 'active' };

    if (clinicId) {
      query.clinicId = clinicId;
    }
    if (specialization) {
      query.specialization = { $regex: new RegExp(specialization, 'i') };
    }

    const doctors = await User.find(query)
      .select('-password')
      .populate('clinicId', 'name city district');

    res.json({ doctors });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ message: 'Server error, fetching doctors failed' });
  }
};

// @desc    Update user status (active, inactive, suspended)
// @route   PATCH /api/users/:userId/status
// @access  Private (super_admin, clinic_admin)
export const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const targetUserId = req.params.userId;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Tenant isolation verification
    if (req.user.role === 'clinic_admin') {
      if (!user.clinicId || user.clinicId.toString() !== req.user.clinicId.toString()) {
        return res.status(403).json({ message: 'Access denied: Cannot update user in another clinic' });
      }
      if (user.role === 'clinic_admin' || user.role === 'super_admin') {
        return res.status(403).json({ message: 'Access denied: Cannot update administrative roles' });
      }
    }

    user.status = status;
    await user.save();

    res.json({ message: `User status updated to ${status}`, userId: user._id, status: user.status });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error, status update failed' });
  }
};

// @desc    Lookup patient by email or phone
// @route   GET /api/users/patients/lookup
// @access  Private (clinic_admin, receptionist)
export const lookupPatient = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const patients = await User.find({
      role: 'patient',
      $or: [
        { name: { $regex: new RegExp(query, 'i') } },
        { email: { $regex: new RegExp(query, 'i') } },
        { phone: { $regex: new RegExp(query, 'i') } }
      ]
    }).select('name email phone status').limit(10);

    res.json({ patients });
  } catch (error) {
    console.error('Lookup patient error:', error);
    res.status(500).json({ message: 'Server error, lookup failed' });
  }
};
