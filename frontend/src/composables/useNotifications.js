import { ref, computed } from 'vue';
import { useNotificationStore } from '~/stores/notifications';

export const useNotifications = () => {
  const { $api } = useNuxtApp();
  const store = useNotificationStore();
  const loading = ref(false);

  const notifications = computed(() => store.notifications);
  const unreadCount = computed(() => store.unreadCount);

  const fetchNotifications = async () => {
    loading.value = true;
    try {
      const data = await $api('/notifications');
      store.setNotifications(data.notifications || []);
      return data.notifications;
    } catch (err) {
      console.error('Fetch notifications error:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const data = await $api(`/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      store.markAsRead(notificationId);
      return data;
    } catch (err) {
      console.error('Mark read error:', err);
      throw err;
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
  };
};
