import { computed } from 'vue';
import { useAuth } from './useAuth';

export const usePermissions = () => {
  const { userRole, allowedRoles } = useAuth();

  const hasPermission = (requiredRole) => {
    return allowedRoles.value.includes(requiredRole);
  };

  const isAdmin = computed(() => {
    return ['super_admin', 'clinic_admin', 'doctor', 'receptionist'].includes(userRole.value);
  });

  return {
    hasPermission,
    isAdmin,
  };
};
