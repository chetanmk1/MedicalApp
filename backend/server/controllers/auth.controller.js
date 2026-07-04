import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendMail } from '../utils/mailer.js';

// Helper to generate access token
const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'dev_jwt_access_secret_99887766',
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );
};

// Helper to generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_11223344',
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );
};

// @desc    Register a new patient
// @route   POST /api/auth/register
// @access  Public
export const registerPatient = async (req, res) => {
  try {
    let { name, email, password, phone, age, gender } = req.body;
    
    if (email === '') email = undefined;

    if (!phone && !email) {
      return res.status(400).json({ message: 'Please provide either an email or a phone number' });
    }

    // Check if user exists
    let userExists = null;
    if (email) {
      userExists = await User.findOne({ email });
    }
    if (!userExists && phone) {
      userExists = await User.findOne({ phone });
    }
    
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email or phone number' });
    }

    // Generate mock OTP
    const otpCode = '123456'; // static or random for testing
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user with patient role and pending_otp status
    const user = await User.create({
      name,
      email,
      password,
      phone,
      age,
      gender,
      role: 'patient',
      status: 'pending_otp',
      otp: {
        code: otpCode,
        expiresAt
      }
    });

    console.log(`[OTP DEBUG] Generated OTP for ${email || phone}: ${otpCode}`);

    res.status(201).json({
      message: 'Registration successful. Please verify OTP.',
      identifier: user.email || user.phone,
      status: user.status
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error, registration failed', error: error.message });
  }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body; // 'email' from frontend could be email or phone

    // Validate request
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email/phone and password' });
    }

    // Check for user
    const user = await User.findOne({
      $or: [{ email: email }, { phone: email }]
    }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check status
    if (user.status === 'pending_otp') {
      return res.status(403).json({ message: 'Please verify your account OTP first.', status: 'pending_otp', identifier: user.email || user.phone });
    }

    if (user.status === 'inactive' || user.status === 'suspended') {
      return res.status(403).json({ message: `Your account has been ${user.status}. Please contact support.` });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId,
        specialization: user.specialization,
        phone: user.phone,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error, login failed', error: error.message });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token not found' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_11223344');
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.status === 'inactive' || user.status === 'suspended') {
      return res.status(403).json({ message: `Account is ${user.status}` });
    }

    // Issue new tokens
    const accessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Update refresh token cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId,
        specialization: user.specialization,
        phone: user.phone,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Server error, refreshing failed', error: error.message });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logout = async (req, res) => {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error, logout failed' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        clinicId: req.user.clinicId,
        specialization: req.user.specialization,
        phone: req.user.phone,
        status: req.user.status,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error, profiles failed' });
  }
};

// @desc    Setup the initial Super Admin account (or register one using a secret setup token)
// @route   POST /api/auth/setup-super-admin
// @access  Public (Protected by secret token or one-time execution)
export const setupSuperAdmin = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: 'Please provide all details (name, email, password, phone)' });
    }

    const setupToken = process.env.SUPER_ADMIN_SETUP_TOKEN;
    const reqToken = req.headers['x-setup-token'];
    const superAdminExists = await User.findOne({ role: 'super_admin' });

    // If setup token is defined, require it to be a valid JWT signed with the setup token secret.
    // If not defined, we only allow this route if no super_admin exists in the DB.
    if (setupToken) {
      if (!reqToken) {
        return res.status(401).json({ message: 'Unauthorized: Missing X-Setup-Token header' });
      }
      try {
        jwt.verify(reqToken, setupToken);
      } catch (err) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired X-Setup-Token JWT signature', error: err.message });
      }
    } else {
      if (superAdminExists) {
        return res.status(403).json({ message: 'Forbidden: Super Admin already exists. For security reasons, setup is disabled.' });
      }
    }

    // 2. Check if email already taken
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // 3. Create Super Admin
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'super_admin',
      status: 'active'
    });

    // 4. Return user and token
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: 'Super Admin registered successfully',
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Setup Super Admin error:', error);
    res.status(500).json({ message: 'Server error during setup', error: error.message });
  }
};

// @desc    Forgot password - Request reset token
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide email' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // For security, return 200 even if user doesn't exist so we don't leak user existence
      return res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    // Save to DB
    await user.save({ validateBeforeSave: false });

    // Create reset URL (points to frontend route)
    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;

    const html = `
      <h1>Password Reset Request</h1>
      <p>You are receiving this email because you (or someone else) requested a password reset for your account.</p>
      <p>Please click the link below, or paste it into your browser, to complete the process:</p>
      <a href="${resetUrl}" target="_blank">${resetUrl}</a>
      <p>This link is valid for 1 hour. If you did not request this, please ignore this email.</p>
    `;

    try {
      await sendMail({
        to: user.email,
        subject: 'MedCare - Password Reset Link',
        html,
      });

      res.json({ message: 'Password reset link sent to your email.' });
    } catch (err) {
      console.error('Mail sending error:', err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error during forgot password' });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Missing token or new password' });
    }

    // Hash the token to match what's in the DB
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ message: 'Password reset successful! You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset', error: error.message });
  }
};

// @desc    Update current user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, email, phone, specialization, age, gender } = req.body;

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (age !== undefined) user.age = age;
    if (gender) user.gender = gender;
    
    if (user.role === 'doctor' && specialization) {
      user.specialization = specialization;
    }

    if (email === '') {
      user.email = undefined;
    } else if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email is already taken by another user' });
      }
      user.email = email;
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId,
        specialization: user.specialization,
        phone: user.phone,
        status: user.status,
        age: user.age,
        gender: user.gender
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error during profile update', error: error.message });
  }
};

// @desc    Update password (when logged in)
// @route   PUT /api/auth/update-password
// @access  Private
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new password' });
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid current password' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ message: 'Server error during password update', error: error.message });
  }
};

// @desc    Verify OTP for patient account registration
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = async (req, res) => {
  try {
    const { email, otpCode } = req.body; // 'email' could be phone

    if (!email || !otpCode) {
      return res.status(400).json({ message: 'Identifier and OTP code are required' });
    }

    const user = await User.findOne({
      $or: [{ email: email }, { phone: email }]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status !== 'pending_otp') {
      return res.status(400).json({ message: 'Account is already verified or active' });
    }

    // Verify OTP matches and is not expired
    if (!user.otp || user.otp.code !== otpCode || new Date() > new Date(user.otp.expiresAt)) {
      return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    // Activate user
    user.status = 'active';
    user.otp = undefined; // clear OTP
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Account verified successfully',
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error, OTP verification failed', error: error.message });
  }
};

// @desc    Switch active user role (RBAC multi-role swap)
// @route   POST /api/auth/switch-role
// @access  Private
export const switchRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ message: 'Target role is required' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Enforce that target role is in authorized roles
    if (!user.roles.includes(role)) {
      return res.status(403).json({ message: `You are not authorized for role: ${role}` });
    }

    // Enforce role switching rules:
    // Only within admin portal (super_admin ↔ clinic_admin, clinic_admin ↔ doctor, clinic_admin ↔ receptionist)
    // patient ↔ admin is NOT allowed.
    const fromRole = user.role;
    const toRole = role;

    if (fromRole === toRole) {
      return res.json({ message: `Already active in role: ${role}` });
    }

    const isPatientSwitch = (fromRole === 'patient' || toRole === 'patient');
    if (isPatientSwitch) {
      return res.status(403).json({ message: 'Role switching between patient and admin is not allowed.' });
    }

    const allowedRoles = ['super_admin', 'clinic_admin', 'doctor', 'receptionist'];
    if (!allowedRoles.includes(fromRole) || !allowedRoles.includes(toRole)) {
      return res.status(403).json({ message: 'Unauthorized role transition.' });
    }

    // Perform role switch
    user.role = role;
    await user.save({ validateBeforeSave: false });

    // Generate new tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: `Switched active role to ${role}`,
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roles: user.roles,
        clinicId: user.clinicId,
        specialization: user.specialization,
        phone: user.phone,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Switch role error:', error);
    res.status(500).json({ message: 'Server error, role switch failed', error: error.message });
  }
};

// @desc    Impersonate clinic user (Super Admin only)
// @route   POST /api/auth/impersonate
// @access  Private (super_admin only)
export const impersonate = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required for impersonation' });
    }

    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    if (targetUser.role === 'super_admin') {
      return res.status(403).json({ message: 'Impersonating another Super Admin is prohibited' });
    }

    // Generate access token for the target user
    const accessToken = generateAccessToken(targetUser._id);
    const refreshToken = generateRefreshToken(targetUser._id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: `Impersonating ${targetUser.name}`,
      token: accessToken,
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        roles: targetUser.roles,
        clinicId: targetUser.clinicId,
        specialization: targetUser.specialization,
        phone: targetUser.phone,
        status: targetUser.status,
      },
    });
  } catch (error) {
    console.error('Impersonation error:', error);
    res.status(500).json({ message: 'Server error, impersonation failed', error: error.message });
  }
};
