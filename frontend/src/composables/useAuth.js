import { computed } from 'vue';
import { useAuthStore } from '~/stores/auth';

export const useAuth = () => {
  const authStore = useAuthStore();
  const { $api } = useNuxtApp();

  const user = computed(() => authStore.user);
  const token = computed(() => authStore.token);
  const isLoggedIn = computed(() => authStore.isLoggedIn);
  const userRole = computed(() => authStore.userRole);
  const allowedRoles = computed(() => authStore.user?.roles || []);

  const login = async (email, password) => {
    const data = await $api('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    if (data && data.token) {
      authStore.setSession(data.user, data.token);
    }
    return data;
  };

  const register = async (name, email, phone, password, age, gender) => {
    return await $api('/auth/register', {
      method: 'POST',
      body: { name, email, phone, password, age, gender },
    });
  };

  const verifyOtp = async (email, otpCode) => {
    const data = await $api('/auth/verify-otp', {
      method: 'POST',
      body: { email, otpCode },
    });
    if (data && data.token) {
      authStore.setSession(data.user, data.token);
    }
    return data;
  };

  const logout = async () => {
    await authStore.logoutUser();
  };

  const fetchProfile = async () => {
    await authStore.fetchProfile();
  };

  const switchRole = async (targetRole) => {
    const data = await $api('/auth/switch-role', {
      method: 'POST',
      body: { role: targetRole }
    });
    if (data && data.token) {
      authStore.setSession(data.user, data.token);
    }
    return data;
  };

  const isImpersonating = computed(() => authStore.isImpersonating);

  const impersonate = async (userId) => {
    const data = await $api('/auth/impersonate', {
      method: 'POST',
      body: { userId }
    });
    if (data && data.token) {
      authStore.startImpersonating(data.user, data.token);
    }
    return data;
  };

  const stopImpersonating = () => {
    authStore.stopImpersonating();
  };

  return {
    user,
    token,
    isLoggedIn,
    userRole,
    allowedRoles,
    isImpersonating,
    login,
    register,
    verifyOtp,
    logout,
    fetchProfile,
    switchRole,
    impersonate,
    stopImpersonating,
  };
};
