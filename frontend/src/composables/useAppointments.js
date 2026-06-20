import { ref } from 'vue';

export const useAppointments = () => {
  const { $api } = useNuxtApp();
  const appointments = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const fetchAppointments = async (params = {}) => {
    loading.value = true;
    error.value = null;
    try {
      const data = await $api('/appointments', { params });
      appointments.value = data.appointments || [];
      return appointments.value;
    } catch (err) {
      error.value = err._data?.message || 'Failed to fetch appointments';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createAppointment = async (body) => {
    loading.value = true;
    error.value = null;
    try {
      const data = await $api('/appointments', {
        method: 'POST',
        body,
      });
      return data;
    } catch (err) {
      error.value = err._data?.message || 'Failed to book appointment';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const cancelAppointment = async (appointmentId, reason = '') => {
    loading.value = true;
    error.value = null;
    try {
      return await $api(`/appointments/${appointmentId}/cancel`, {
        method: 'PATCH',
        body: { reason }
      });
    } catch (err) {
      error.value = err._data?.message || 'Failed to cancel appointment';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const rescheduleAppointment = async (appointmentId, date, startTime) => {
    loading.value = true;
    error.value = null;
    try {
      return await $api(`/appointments/${appointmentId}/reschedule`, {
        method: 'PATCH',
        body: { date, startTime },
      });
    } catch (err) {
      error.value = err._data?.message || 'Failed to reschedule appointment';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const checkInAppointment = async (appointmentId) => {
    loading.value = true;
    error.value = null;
    try {
      return await $api(`/appointments/${appointmentId}/check-in`, {
        method: 'PATCH',
      });
    } catch (err) {
      error.value = err._data?.message || 'Failed to check-in patient';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const completeAppointment = async (appointmentId, consultationNotes) => {
    loading.value = true;
    error.value = null;
    try {
      return await $api(`/appointments/${appointmentId}/complete`, {
        method: 'PATCH',
        body: { consultationNotes },
      });
    } catch (err) {
      error.value = err._data?.message || 'Failed to complete appointment';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    appointments,
    loading,
    error,
    fetchAppointments,
    createAppointment,
    cancelAppointment,
    rescheduleAppointment,
    checkInAppointment,
    completeAppointment,
  };
};
