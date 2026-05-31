export const enforceTenant = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User context not found' });
  }

  // Super Admin can access any tenant. We extract clinicId from query, body, or params.
  if (req.user.role === 'super_admin') {
    const targetClinicId = req.query.clinicId || req.body.clinicId || req.params.clinicId;
    if (targetClinicId) {
      req.clinicId = targetClinicId;
    }
    return next();
  }

  // Patients are global. We extract target clinicId from the request if provided.
  if (req.user.role === 'patient') {
    const targetClinicId = req.query.clinicId || req.body.clinicId || req.params.clinicId;
    if (targetClinicId) {
      req.clinicId = targetClinicId;
    }
    return next();
  }

  // Clinic-scoped roles (clinic_admin, doctor, receptionist)
  const userClinicId = req.user.clinicId?.toString();
  if (!userClinicId) {
    return res.status(403).json({ message: 'User account does not belong to any clinic' });
  }

  // Inject tenant context into request object
  req.clinicId = req.user.clinicId;

  // Cross-tenant data breach protection
  const explicitClinicId = req.params.clinicId || req.query.clinicId || req.body.clinicId;
  if (explicitClinicId && explicitClinicId.toString() !== userClinicId) {
    return res.status(403).json({
      message: 'Access denied: Cross-tenant data breach attempt detected',
    });
  }

  next();
};
