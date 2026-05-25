import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore();
  const { $api } = useNuxtApp();

  // 1. Recover token on client-side reload
  if (import.meta.client && !authStore.token) {
    const savedToken = localStorage.getItem('med_token');
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
    // If visiting maintenance page but maintenance is OFF, redirect home
    try {
      const data = await $api('/settings/maintenance');
      if (data && !data.maintenanceMode) {
        return navigateTo('/');
      }
    } catch (err) {}
  }

  // 3. Define access control paths
  const publicPaths = ['/', '/login', '/register', '/maintenance'];
  const isPublic = publicPaths.includes(to.path);

  if (!authStore.isLoggedIn && !isPublic) {
    return navigateTo('/login');
  }

  // Redirect authenticated users away from auth pages
  if (authStore.isLoggedIn && (to.path === '/login' || to.path === '/register')) {
    return navigateTo(getDefaultDashboard(authStore.userRole));
  }

  // 4. Role authorization check based on page meta
  if (to.meta.role && authStore.userRole !== to.meta.role) {
    return navigateTo(getDefaultDashboard(authStore.userRole));
  }
});

function getDefaultDashboard(role: string | null): string {
  switch (role) {
    case 'super_admin':
      return '/dashboard/super-admin';
    case 'clinic_admin':
      return '/dashboard/clinic-admin';
    case 'doctor':
      return '/dashboard/doctor';
    case 'staff':
      return '/dashboard/clinic-admin'; // Staff and clinic_admin share admin interfaces
    case 'patient':
      return '/dashboard/patient';
    default:
      return '/';
  }
}
