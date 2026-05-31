<template>
  <div class="row justify-center items-center" style="min-height: 80vh;">
    <q-spinner-dots color="primary" size="40px" />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();

onMounted(() => {
  if (!authStore.isLoggedIn) {
    navigateTo('/app');
  } else {
    const role = authStore.userRole;
    navigateTo(role === 'patient' ? '/app' : '/admin/dashboard');
  }
});
</script>
