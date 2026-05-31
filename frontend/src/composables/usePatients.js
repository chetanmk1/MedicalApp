import { ref } from 'vue';

export const usePatients = () => {
  const { $api } = useNuxtApp();
  const patients = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const searchPatients = async (searchQuery) => {
    if (!searchQuery) {
      patients.value = [];
      return [];
    }
    loading.value = true;
    error.value = null;
    try {
      const data = await $api('/users/patients/lookup', {
        params: { query: searchQuery }
      });
      patients.value = data.patients || [];
      return patients.value;
    } catch (err) {
      error.value = err._data?.message || 'Failed to search patients';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    patients,
    loading,
    error,
    searchPatients,
  };
};
