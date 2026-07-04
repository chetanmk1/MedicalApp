import { io } from 'socket.io-client';
import { useAuthStore } from '~/stores/auth';
import { useNotificationStore } from '~/stores/notifications';
import { useQuasar } from 'quasar';

export default defineNuxtPlugin((nuxtApp) => {
  const authStore = useAuthStore();
  const notificationStore = useNotificationStore();
  
  let socket = null;
  
  // Create a function to initialize socket
  const initSocket = () => {
    if (!authStore.token) return;
    
    if (socket) {
      socket.disconnect();
    }
    
    socket = io('http://localhost:5000', {
      auth: {
        token: authStore.token
      }
    });
    
    socket.on('connect', () => {
      console.log('Socket connected successfully');
    });
    
    socket.on('notification', (payload) => {
      // 1. Store in Pinia
      notificationStore.addNotification(payload);
      
      // 2. Immediate Toast notification
      let icon = 'info';
      let color = 'primary';
      
      if (payload.type === 'success') {
        icon = 'check_circle';
        color = 'positive';
      } else if (payload.type === 'warning') {
        icon = 'warning';
        color = 'warning';
      } else if (payload.type === 'error') {
        icon = 'error';
        color = 'negative';
      }
      
      // Note: The Quasar plugin is available inside Nuxt context
      // But we can also trigger a custom event or use window.$q if available
      if (import.meta.client) {
        nuxtApp.vueApp.config.globalProperties.$q.notify({
          message: payload.title,
          caption: payload.message,
          icon: icon,
          color: color,
          position: 'top-right',
          timeout: 5000,
          actions: [{ icon: 'close', color: 'white' }]
        });
      }
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  };

  // Watch for auth changes to init/disconnect socket
  watch(() => authStore.token, (newToken) => {
    if (newToken) {
      initSocket();
    } else if (socket) {
      socket.disconnect();
      socket = null;
    }
  }, { immediate: true });

  return {
    provide: {
      socket
    }
  };
});
