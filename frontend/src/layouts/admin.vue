<template>
  <q-layout view="lHh Lpr lFf" class="bg-mesh-gradient">
    <!-- Header -->
    <q-header elevated :style="headerStyle">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title class="font-weight-bold">
          MedBook Admin Portal
        </q-toolbar-title>

        <!-- Stop Impersonating Banner -->
        <q-banner v-if="isImpersonating" inline-actions dense rounded class="bg-amber text-black q-mr-md font-weight-bold">
          Impersonating: {{ user?.name }}
          <template v-slot:action>
            <q-btn flat label="Stop" color="red-10" @click="stopImpersonation" />
          </template>
        </q-banner>

        <!-- Role Switcher & Profile Dropdown -->
        <div class="row items-center q-gutter-md">
          <!-- Role Switcher -->
          <q-btn-dropdown
            v-if="user?.roles && user.roles.length > 1"
            flat
            no-caps
            icon="swap_horiz"
            label="Switch Role"
            color="white"
            class="q-px-sm"
          >
            <q-list style="min-width: 150px;">
              <q-item-label header>Select Active Role</q-item-label>
              <q-item
                v-for="r in switchableRoles"
                :key="r"
                clickable
                v-close-popup
                @click="changeRole(r)"
                :active="r === userRole"
                active-class="bg-indigo-1 text-primary"
              >
                <q-item-section>
                  {{ formatRoleName(r) }}
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>

          <q-btn-dropdown flat no-caps icon="account_circle" :label="user?.name" color="white">
            <q-list style="min-width: 200px;">
              <q-item class="q-py-md">
                <q-item-section>
                  <div class="text-subtitle2 font-weight-bold">{{ user?.name }}</div>
                  <div class="text-caption text-grey-7">{{ formatRoleName(userRole) }}</div>
                </q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup to="/app/profile">
                <q-item-section avatar>
                  <q-icon name="settings" color="primary" />
                </q-item-section>
                <q-item-section class="font-weight-medium">Account Settings</q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup @click="handleLogout" class="text-negative">
                <q-item-section avatar>
                  <q-icon name="logout" color="negative" />
                </q-item-section>
                <q-item-section class="font-weight-medium">Logout</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
      </q-toolbar>
    </q-header>

    <!-- Sidebar Drawer -->
    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :mini="miniState"
      @mini-state="val => miniState = val"
      :width="240"
      :mini-width="70"
      class="bg-white"
    >
      <q-scroll-area class="fit">
        <!-- Brand Header inside Sidebar -->
        <div v-if="!miniState" class="q-pa-md text-center bg-indigo-1 text-slate-800 q-mb-md">
          <q-avatar size="50px" class="q-mb-xs">
            <q-icon name="healing" size="36px" class="text-primary" />
          </q-avatar>
          <div class="text-subtitle1 font-weight-bold text-gradient">MedBook Portal</div>
          <div class="text-caption text-indigo-7 font-weight-bold">{{ formatRoleName(userRole) }}</div>
        </div>
        <div v-else class="q-pa-sm text-center bg-indigo-1 text-slate-800 q-mb-md">
          <q-avatar size="36px">
            <q-icon name="healing" size="24px" class="text-primary" />
          </q-avatar>
        </div>

        <q-list padding class="menu-list">
          <q-item-label v-if="!miniState" header class="text-grey-7 font-weight-bold">
            Management
          </q-item-label>

          <!-- Shared Dashboard Link -->
          <q-item clickable @click="navigateToTab('dashboard')" :active="activeTab === 'dashboard'" active-class="text-primary font-weight-bold bg-indigo-0">
            <q-item-section avatar>
              <q-icon name="dashboard" />
            </q-item-section>
            <q-item-section v-if="!miniState">Dashboard</q-item-section>
            <q-tooltip v-if="miniState" anchor="center right" self="center left" :offset="[10, 10]">
              Dashboard
            </q-tooltip>
          </q-item>

          <!-- Super Admin Specific Menu -->
          <template v-if="userRole === 'super_admin'">
            <q-item clickable @click="navigateToTab('clinics')" :active="activeTab === 'clinics'" active-class="text-primary font-weight-bold">
              <q-item-section avatar>
                <q-icon name="local_hospital" />
              </q-item-section>
              <q-item-section v-if="!miniState">Clinics</q-item-section>
              <q-tooltip v-if="miniState" anchor="center right" self="center left" :offset="[10, 10]">
                Clinics
              </q-tooltip>
            </q-item>
            <q-item clickable @click="navigateToTab('settings')" :active="activeTab === 'settings'" active-class="text-primary font-weight-bold">
              <q-item-section avatar>
                <q-icon name="settings" />
              </q-item-section>
              <q-item-section v-if="!miniState">System Settings</q-item-section>
              <q-tooltip v-if="miniState" anchor="center right" self="center left" :offset="[10, 10]">
                System Settings
              </q-tooltip>
            </q-item>
          </template>

          <!-- Clinic Admin Specific Menu -->
          <template v-if="userRole === 'clinic_admin'">
            <q-item clickable @click="navigateToTab('users')" :active="activeTab === 'users'" active-class="text-primary font-weight-bold">
              <q-item-section avatar>
                <q-icon name="people" />
              </q-item-section>
              <q-item-section v-if="!miniState">Doctors & Staff</q-item-section>
              <q-tooltip v-if="miniState" anchor="center right" self="center left" :offset="[10, 10]">
                Doctors & Staff
              </q-tooltip>
            </q-item>
            <q-item clickable @click="navigateToTab('schedules')" :active="activeTab === 'schedules'" active-class="text-primary font-weight-bold">
              <q-item-section avatar>
                <q-icon name="schedule" />
              </q-item-section>
              <q-item-section v-if="!miniState">Configure Schedules</q-item-section>
              <q-tooltip v-if="miniState" anchor="center right" self="center left" :offset="[10, 10]">
                Configure Schedules
              </q-tooltip>
            </q-item>
            <q-item clickable @click="navigateToTab('profile')" :active="activeTab === 'profile'" active-class="text-primary font-weight-bold">
              <q-item-section avatar>
                <q-icon name="business" />
              </q-item-section>
              <q-item-section v-if="!miniState">Clinic Profile</q-item-section>
              <q-tooltip v-if="miniState" anchor="center right" self="center left" :offset="[10, 10]">
                Clinic Profile
              </q-tooltip>
            </q-item>
            <q-item clickable @click="navigateToTab('bookings')" :active="activeTab === 'bookings'" active-class="text-primary font-weight-bold">
              <q-item-section avatar>
                <q-icon name="event" />
              </q-item-section>
              <q-item-section v-if="!miniState">Bookings Ledger</q-item-section>
              <q-tooltip v-if="miniState" anchor="center right" self="center left" :offset="[10, 10]">
                Bookings Ledger
              </q-tooltip>
            </q-item>
          </template>

          <!-- Doctor Specific Menu -->
          <template v-if="userRole === 'doctor'">
            <q-item clickable @click="navigateToTab('appointments')" :active="activeTab === 'appointments'" active-class="text-primary font-weight-bold">
              <q-item-section avatar>
                <q-icon name="event_available" />
              </q-item-section>
              <q-item-section v-if="!miniState">Consultations</q-item-section>
              <q-tooltip v-if="miniState" anchor="center right" self="center left" :offset="[10, 10]">
                Consultations
              </q-tooltip>
            </q-item>
            <q-item clickable @click="navigateToTab('availability')" :active="activeTab === 'availability'" active-class="text-primary font-weight-bold">
              <q-item-section avatar>
                <q-icon name="calendar_month" />
              </q-item-section>
              <q-item-section v-if="!miniState">My Schedule</q-item-section>
              <q-tooltip v-if="miniState" anchor="center right" self="center left" :offset="[10, 10]">
                My Schedule
              </q-tooltip>
            </q-item>
          </template>

          <!-- Receptionist Specific Menu -->
          <template v-if="userRole === 'receptionist'">
            <q-item clickable @click="navigateToTab('lookup')" :active="activeTab === 'lookup'" active-class="text-primary font-weight-bold">
              <q-item-section avatar>
                <q-icon name="search" />
              </q-item-section>
              <q-item-section v-if="!miniState">Patient Lookup</q-item-section>
              <q-tooltip v-if="miniState" anchor="center right" self="center left" :offset="[10, 10]">
                Patient Lookup
              </q-tooltip>
            </q-item>
            <q-item clickable @click="navigateToTab('booking')" :active="activeTab === 'booking'" active-class="text-primary font-weight-bold">
              <q-item-section avatar>
                <q-icon name="add_task" />
              </q-item-section>
              <q-item-section v-if="!miniState">Manual Booking</q-item-section>
              <q-tooltip v-if="miniState" anchor="center right" self="center left" :offset="[10, 10]">
                Manual Booking
              </q-tooltip>
            </q-item>
          </template>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <!-- Page Container -->
    <q-page-container>
      <q-page class="q-pa-lg">
        <slot />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuth } from '~/composables/useAuth';
import { useRoleSwitching } from '~/composables/useRoleSwitching';
import { useQuasar } from 'quasar';
import { useDashboardTab } from '~/composables/useDashboardTab';
import { useRoute } from 'vue-router';
import { useAuthStore } from '~/stores/auth';

const $q = useQuasar();
const route = useRoute();
const { user, userRole, logout, allowedRoles } = useAuth();
const { canSwitchTo, performSwitch } = useRoleSwitching();
const { activeTab } = useDashboardTab();

const leftDrawerOpen = ref(false);
const miniState = ref(false);

const toggleLeftDrawer = () => {
  if ($q.screen.gt.sm) {
    miniState.value = !miniState.value;
  } else {
    leftDrawerOpen.value = !leftDrawerOpen.value;
    miniState.value = false;
  }
};

const navigateToTab = (tabName) => {
  activeTab.value = tabName;
  if (route.path !== '/admin/dashboard') {
    navigateTo('/admin/dashboard');
  }
};

const headerStyle = computed(() => {
  if (userRole.value === 'super_admin') {
    // Red gradient for Super Admin
    return 'background: linear-gradient(135deg, #881337 0%, #dc2626 100%);';
  }
  // Blue gradient for Clinic Admin / Doctors / Receptionist
  return 'background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);';
});

const isImpersonating = computed(() => {
  if (!import.meta.client) return false;
  return !!sessionStorage.getItem('med_admin_original_token');
});

const switchableRoles = computed(() => {
  // Return roles that are switchable (patient is filtered out)
  return allowedRoles.value.filter(r => r !== 'patient' && canSwitchTo(r));
});

const formatRoleName = (r) => {
  if (!r) return '';
  return r.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const changeRole = async (targetRole) => {
  try {
    $q.loading.show({ message: `Switching to ${formatRoleName(targetRole)}...` });
    await performSwitch(targetRole);
    $q.notify({
      type: 'positive',
      message: `Active role changed to ${formatRoleName(targetRole)}`
    });
    // Reset active tab to dashboard
    activeTab.value = 'dashboard';
    navigateTo('/admin/dashboard');
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.message || 'Failed to switch role'
    });
  } finally {
    $q.loading.hide();
  }
};

const stopImpersonation = () => {
  if (import.meta.client) {
    const originalToken = sessionStorage.getItem('med_admin_original_token');
    const originalUser = JSON.parse(sessionStorage.getItem('med_admin_original_user') || 'null');
    
    if (originalToken && originalUser) {
      const authStore = useAuthStore();
      authStore.setSession(originalUser, originalToken);
      sessionStorage.removeItem('med_admin_original_token');
      sessionStorage.removeItem('med_admin_original_user');
      
      $q.notify({
        type: 'positive',
        message: 'Returned to Super Admin session'
      });
      activeTab.value = 'dashboard';
      navigateTo('/admin/dashboard');
    }
  }
};

const handleLogout = async () => {
  await logout();
};
</script>
