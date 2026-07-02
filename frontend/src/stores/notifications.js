import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref([]);
  const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length);

  const setNotifications = (data) => {
    notifications.value = data;
  };

  const addNotification = (notification) => {
    notifications.value.unshift(notification);
  };

  const markAsRead = (id) => {
    const notif = notifications.value.find(n => n._id === id);
    if (notif) {
      notif.isRead = true;
    }
  };

  const markAllAsRead = () => {
    notifications.value.forEach(n => {
      n.isRead = true;
    });
  };

  return {
    notifications,
    unreadCount,
    setNotifications,
    addNotification,
    markAsRead,
    markAllAsRead
  };
});
