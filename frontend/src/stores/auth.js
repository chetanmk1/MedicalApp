import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => {
    let originalToken = null;
    let originalUser = null;
    if (import.meta.client) {
      originalToken = sessionStorage.getItem('med_admin_original_token') || null;
      originalUser = JSON.parse(sessionStorage.getItem('med_admin_original_user') || 'null');
    }
    return {
      user: null,
      token: null,
      originalToken,
      originalUser,
    };
  },
  getters: {
    isLoggedIn: (state) => !!state.token,
    userRole: (state) => state.user?.role || null,
    clinicId: (state) => state.user?.clinicId || null,
    isSuperAdmin: (state) => state.user?.role === 'super_admin',
    isClinicAdmin: (state) => state.user?.role === 'clinic_admin',
    isDoctor: (state) => state.user?.role === 'doctor',
    isReceptionist: (state) => state.user?.role === 'receptionist',
    isPatient: (state) => state.user?.role === 'patient',
    isImpersonating: (state) => !!state.originalToken,
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
      this.originalToken = null;
      this.originalUser = null;
      const tokenCookie = useCookie('med_token', { path: '/' });
      tokenCookie.value = null;
      if (import.meta.client) {
        sessionStorage.removeItem('med_admin_original_token');
        sessionStorage.removeItem('med_admin_original_user');
      }
    },
    startImpersonating(impersonatedUser, impersonatedToken) {
      this.originalToken = this.token;
      this.originalUser = this.user;
      if (import.meta.client) {
        sessionStorage.setItem('med_admin_original_token', this.token);
        sessionStorage.setItem('med_admin_original_user', JSON.stringify(this.user));
      }
      this.setSession(impersonatedUser, impersonatedToken);
    },
    stopImpersonating() {
      if (this.originalToken && this.originalUser) {
        this.setSession(this.originalUser, this.originalToken);
        this.originalToken = null;
        this.originalUser = null;
        if (import.meta.client) {
          sessionStorage.removeItem('med_admin_original_token');
          sessionStorage.removeItem('med_admin_original_user');
        }
      }
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

