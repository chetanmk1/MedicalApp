import { useAuthStore } from '~/stores/auth';

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();
  // Base backend API URL
  const baseURL = 'http://localhost:5000/api';

  const authStore = useAuthStore();
  let isRefreshing = false;
  let refreshQueue = [];

  const processQueue = (error, token = null) => {
    refreshQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    refreshQueue = [];
  };

  const apiFetch = $fetch.create({
    baseURL,
    onRequest({ request, options }) {
      // Append access token if logged in
      if (authStore.token) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${authStore.token}`,
        };
      }
      
      // Allow credentials/cookies for refresh token handling
      options.credentials = 'include';
    },
    async onResponseError({ request, response, options }) {
      const status = response.status;
      const data = response._data;

      // Handle global maintenance mode redirection
      if (status === 503 && data && data.maintenance) {
        // Bypass maintenance page itself to avoid infinite redirect loops
        const route = useRoute();
        if (route.path !== '/maintenance') {
          return navigateTo('/maintenance');
        }
      }

      // Handle Token Expiration (401)
      if (status === 401 && !request.includes('/auth/login') && !request.includes('/auth/refresh')) {
        const originalRequest = { request, options };

        if (!isRefreshing) {
          isRefreshing = true;

          try {
            // Attempt token refresh using httpOnly cookie
            const refreshResponse = await $fetch('/auth/refresh', {
              baseURL,
              method: 'POST',
              credentials: 'include',
            });

            if (refreshResponse && refreshResponse.token) {
              // Update state with new token
              authStore.setSession(refreshResponse.user, refreshResponse.token);
              processQueue(null, refreshResponse.token);
              isRefreshing = false;

              // Retry original request with new token
              options.headers = {
                ...options.headers,
                Authorization: `Bearer ${refreshResponse.token}`,
              };
              return $fetch(request, options);
            }
          } catch (refreshErr) {
            processQueue(refreshErr, null);
            isRefreshing = false;
            authStore.clearSession();
            return navigateTo('/login');
          }
        } else {
          // Queue request while refreshing is in progress
          return new Promise((resolve, reject) => {
            refreshQueue.push({ resolve, reject });
          })
            .then((token) => {
              options.headers = {
                ...options.headers,
                Authorization: `Bearer ${token}`,
              };
              return $fetch(request, options);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }
      }

      return Promise.reject(response);
    },
  });

  return {
    provide: {
      api: apiFetch,
    },
  };
});
