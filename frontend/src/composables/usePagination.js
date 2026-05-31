import { ref, computed } from 'vue';

export const usePagination = (initialLimit = 10) => {
  const page = ref(1);
  const limit = ref(initialLimit);
  const totalItems = ref(0);

  const totalPages = computed(() => Math.ceil(totalItems.value / limit.value));

  const setPage = (p) => {
    if (p >= 1 && p <= totalPages.value) {
      page.value = p;
    }
  };

  return {
    page,
    limit,
    totalItems,
    totalPages,
    setPage,
  };
};
