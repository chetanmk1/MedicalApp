import { ref } from 'vue';

const activeTab = ref('dashboard');

export const useDashboardTab = () => {
  return {
    activeTab
  };
};
