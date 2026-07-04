import Notification from '../models/Notification.js';
import { getIO } from '../socket.js';

/**
 * Creates a notification in the database and emits it via Socket.io
 * @param {Object} options
 * @param {String} options.userId - User ID to receive the notification
 * @param {String} options.title - Notification title
 * @param {String} options.message - Notification message
 * @param {String} [options.type='info'] - 'info', 'warning', 'success', 'error'
 * @param {String} [options.clinicId] - Optional. If provided, sends to clinic room instead of single user
 */
export const sendNotification = async ({ userId, title, message, type = 'info', clinicId }) => {
  try {
    let notification;
    
    // Only save to DB if userId is provided (personal notification)
    if (userId) {
      notification = await Notification.create({
        userId,
        title,
        message,
        type
      });
    }

    const payload = notification ? notification.toObject() : {
      title,
      message,
      type,
      createdAt: new Date()
    };

    const io = getIO();
    
    if (clinicId) {
      io.to(`clinic_${clinicId}`).emit('notification', payload);
    } else if (userId) {
      io.to(`user_${userId}`).emit('notification', payload);
    }

    return notification;
  } catch (err) {
    console.error('Failed to send notification:', err);
  }
};
