import { ref } from 'vue';
import { useAuth } from './useAuth';

export const useRoleSwitching = () => {
  const { userRole, allowedRoles, switchRole } = useAuth();
  const switching = ref(false);
  const error = ref(null);

  const canSwitchTo = (targetRole) => {
    if (!allowedRoles.value.includes(targetRole)) return false;
    const current = userRole.value;
    // Allowed transitions: super_admin ↔ clinic_admin, clinic_admin ↔ doctor, clinic_admin ↔ receptionist
    // Patient is locked
    if (current === 'patient' || targetRole === 'patient') return false;
    
    const adminRoles = ['super_admin', 'clinic_admin', 'doctor', 'receptionist'];
    return adminRoles.includes(current) && adminRoles.includes(targetRole);
  };

  const performSwitch = async (targetRole) => {
    switching.value = true;
    error.value = null;
    try {
      await switchRole(targetRole);
    } catch (err) {
      error.value = err._data?.message || 'Failed to switch roles';
      throw err;
    } finally {
      switching.value = false;
    }
  };

  return {
    switching,
    error,
    canSwitchTo,
    performSwitch,
  };
};
