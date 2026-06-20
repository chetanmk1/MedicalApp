import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    userRole: (state) => state.user?.role || null,
    clinicId: (state) => state.user?.clinicId || null,
    isSuperAdmin: (state) => state.user?.role === 'super_admin',
    isClinicAdmin: (state) => state.user?.role === 'clinic_admin',
    isDoctor: (state) => state.user?.role === 'doctor',
    isReceptionist: (state) => state.user?.role === 'receptionist',
    isPatient: (state) => state.user?.role === 'patient',
  },
  actions: {
    setSession(user, token) {
      this.user = user;
      this.token = token;
      
      const tokenCookie = useCookie('med_token', { 
        maxAge: 60 * 60 * 24 * 7, 
        path: '/',
        sameSite: 'lax', // Protects against CSRF attacks
        secure: process.env.NODE_ENV === 'production' // Only send over HTTPS in production
      });
      tokenCookie.value = token;
    },
    clearSession() {
      this.user = null;
      this.token = null;
      const tokenCookie = useCookie('med_token', { path: '/' });
      tokenCookie.value = null;
    },
    async fetchProfile() {
      try {
        const { $api } = useNuxtApp();
        const data = await $api('/auth/me');
        if (data && data.user) {
          this.user = data.user;
        }
      } catch (err) {
        console.error('Fetch profile error:', err);
        this.clearSession();
      }
    },
    async logoutUser() {
      const isPatient = this.userRole === 'patient';
      try {
        const { $api } = useNuxtApp();
        await $api('/auth/logout', { method: 'POST' });
      } catch (err) {
        console.error('Logout error:', err);
      } finally {
        this.clearSession();
        navigateTo(isPatient ? '/app/login' : '/admin/login');
      }
    },
  },
});
