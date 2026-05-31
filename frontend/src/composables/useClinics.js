import { ref } from 'vue';

export const useClinics = () => {
  const { $api } = useNuxtApp();
  const clinics = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const fetchClinics = async (params = {}) => {
    loading.value = true;
    error.value = null;
    try {
      const data = await $api('/clinics', { params });
      clinics.value = data.clinics || [];
      return clinics.value;
    } catch (err) {
      error.value = err._data?.message || 'Failed to fetch clinics';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const registerClinic = async (clinicData) => {
    loading.value = true;
    error.value = null;
    try {
      return await $api('/clinics/register', {
        method: 'POST',
        body: clinicData,
      });
    } catch (err) {
      error.value = err._data?.message || 'Failed to submit clinic onboarding request';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const approveClinic = async (clinicId) => {
    loading.value = true;
    error.value = null;
    try {
      return await $api(`/clinics/${clinicId}/approve`, {
        method: 'PATCH',
      });
    } catch (err) {
      error.value = err._data?.message || 'Failed to approve clinic';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const rejectClinic = async (clinicId) => {
    loading.value = true;
    error.value = null;
    try {
      return await $api(`/clinics/${clinicId}/reject`, {
        method: 'PATCH',
      });
    } catch (err) {
      error.value = err._data?.message || 'Failed to reject clinic';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateClinicStatus = async (clinicId, status) => {
    loading.value = true;
    error.value = null;
    try {
      return await $api(`/clinics/${clinicId}/status`, {
        method: 'PATCH',
        body: { status },
      });
    } catch (err) {
      error.value = err._data?.message || 'Failed to update clinic status';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    clinics,
    loading,
    error,
    fetchClinics,
    registerClinic,
    approveClinic,
    rejectClinic,
    updateClinicStatus,
  };
};
