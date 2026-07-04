import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore();
  const { $api } = useNuxtApp();

  // 1. Recover token on SSR and client-side reload using cookies
  if (!authStore.token) {
    const savedToken = useCookie('med_token').value;
    if (savedToken) {
      authStore.token = savedToken;
      try {
        await authStore.fetchProfile();
      } catch (err) {
        authStore.clearSession();
      }
    }
  }

  // 2. Fetch global maintenance status (except when visiting the maintenance page itself)
  let isMaintenanceOn = false;
  if (to.path !== '/maintenance') {
    try {
      const data = await $api('/settings/maintenance');
      isMaintenanceOn = data ? data.maintenanceMode : false;
    } catch (err) {
      // In case of network errors or server downtime
    }

    if (isMaintenanceOn) {
      // Non-super_admins are forced to the maintenance page
      if (authStore.userRole !== 'super_admin') {
        return navigateTo('/maintenance');
      }
    }
  } else {
    // If visiting maintenance page but maintenance is OFF, redirect to root
    try {
      const data = await $api('/settings/maintenance');
      if (data && !data.maintenanceMode) {
        return navigateTo('/');
      }
    } catch (err) {}
  }

  const role = authStore.userRole;

  // 3. Handle pending OTP verification state
  if (authStore.isLoggedIn && authStore.user?.status === 'pending_otp') {
    if (to.path !== '/app/otp-verification') {
      return navigateTo('/app/otp-verification');
    }
    return; // Allow access to OTP verification page
  }

  // 4. Define route categorizations
  const isPatientApp = to.path.startsWith('/app');
  const isAdminPortal = to.path.startsWith('/admin');

  const publicPatientPaths = ['/app/login', '/app/register', '/app/forgot-password', '/app/reset-password', '/app/otp-verification'];
  const isPublicPatient = publicPatientPaths.includes(to.path);
  const isPublicAdmin = to.path === '/admin/login';

  // 5. Auth Checks & Redirects
  if (!authStore.isLoggedIn) {
    // Patient app guest access
    if (isPatientApp && !isPublicPatient) {
      // Allow searching doctors/clinics publicly on '/app/clinics' or '/app/doctors' if needed
      // but otherwise redirect to login
      const publicSearchPaths = ['/app/clinics', '/app/doctors', '/app'];
      if (!publicSearchPaths.includes(to.path)) {
        return navigateTo('/app/login');
      }
    }
    // Admin portal guest access
    if (isAdminPortal && !isPublicAdmin) {
      return navigateTo('/admin/login');
    }

    // Root path redirection
    if (to.path === '/') {
      return navigateTo('/app');
    }
  } else {
    // Authenticated user checks
    if (role === 'patient') {
      // Patients are blocked from the Admin Portal
      if (isAdminPortal) {
        return navigateTo('/app');
      }
      // Redirect from patient login/register to patient home
      if (to.path === '/app/login' || to.path === '/app/register') {
        return navigateTo('/app');
      }
    } else {
      // Admins (super_admin, clinic_admin, doctor, receptionist)
      // Admins are blocked from patient app write paths (appointments) but can update their profile
      if (isPatientApp && !['/app', '/app/clinics', '/app/doctors', '/app/profile'].includes(to.path)) {
        return navigateTo('/admin/dashboard');
      }
      // Redirect from admin login to admin dashboard
      if (to.path === '/admin/login' || to.path === '/login') {
        return navigateTo('/admin/dashboard');
      }
    }

    // Root path redirection for authenticated users
    if (to.path === '/') {
      return navigateTo(role === 'patient' ? '/app' : '/admin/dashboard');
    }
  }
});
