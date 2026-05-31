import { ref } from 'vue';

export const useNotifications = () => {
  const { $api } = useNuxtApp();
  const notifications = ref([]);
  const unreadCount = ref(0);
  const loading = ref(false);

  const fetchNotifications = async () => {
    loading.value = true;
    try {
      const data = await $api('/notifications');
      notifications.value = data.notifications || [];
      unreadCount.value = notifications.value.filter(n => !n.isRead).length;
      return notifications.value;
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
      // Update local list
      const index = notifications.value.findIndex(n => n._id === notificationId);
      if (index !== -1) {
        notifications.value[index].isRead = true;
      }
      unreadCount.value = notifications.value.filter(n => !n.isRead).length;
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
