import { ref } from 'vue';

export const useDoctors = () => {
  const { $api } = useNuxtApp();
  const doctors = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const fetchDoctors = async (params = {}) => {
    loading.value = true;
    error.value = null;
    try {
      const data = await $api('/users/doctors', { params });
      doctors.value = data.doctors || [];
      return doctors.value;
    } catch (err) {
      error.value = err._data?.message || 'Failed to fetch doctors';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getAvailableSlots = async (doctorId, date) => {
    loading.value = true;
    error.value = null;
    try {
      const data = await $api(`/schedules/doctor/${doctorId}/slots`, {
        params: { date }
      });
      return data.slots || [];
    } catch (err) {
      error.value = err._data?.message || 'Failed to fetch available slots';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchSchedule = async (doctorId) => {
    loading.value = true;
    error.value = null;
    try {
      return await $api(`/schedules/doctor/${doctorId}`);
    } catch (err) {
      error.value = err._data?.message || 'Failed to fetch schedule';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const saveSchedule = async (doctorId, scheduleData) => {
    loading.value = true;
    error.value = null;
    try {
      return await $api(`/schedules/doctor/${doctorId}`, {
        method: 'PUT',
        body: scheduleData,
      });
    } catch (err) {
      error.value = err._data?.message || 'Failed to save doctor schedule';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    doctors,
    loading,
    error,
    fetchDoctors,
    getAvailableSlots,
    fetchSchedule,
    saveSchedule,
  };
};
