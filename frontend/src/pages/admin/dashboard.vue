<template>
  <NuxtLayout name="admin">
    <div v-if="!userRole" class="row justify-center items-center" style="min-height: 50vh;">
      <q-spinner-dots color="primary" size="40px" />
    </div>

    <template v-else>
      <!-- Render corresponding sub-dashboard -->
      <DashboardSuperAdmin v-if="userRole === 'super_admin'" />
      <DashboardClinicAdmin v-else-if="userRole === 'clinic_admin'" />
      <DashboardDoctor v-else-if="userRole === 'doctor'" />
      <DashboardReceptionist v-else-if="userRole === 'receptionist'" />
      <div v-else class="text-center q-py-xl">
        <q-icon name="error" color="negative" size="48px" />
        <div class="text-h6 q-mt-md">Unauthorized Access</div>
        <p class="text-caption text-grey-7">Your role does not have administrative permissions.</p>
        <q-btn color="primary" label="Go Home" to="/app" />
      </div>
    </template>
  </NuxtLayout>
</template>

<script setup>
import { useAuth } from '~/composables/useAuth';
import DashboardSuperAdmin from '~/components/admin/DashboardSuperAdmin.vue';
import DashboardClinicAdmin from '~/components/admin/DashboardClinicAdmin.vue';
import DashboardDoctor from '~/components/admin/DashboardDoctor.vue';
import DashboardReceptionist from '~/components/admin/DashboardReceptionist.vue';

// Enforce layout blank because we wrap page with NuxtLayout name="admin" directly
definePageMeta({
  layout: false
});

const { userRole } = useAuth();
</script>
