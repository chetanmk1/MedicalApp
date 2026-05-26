<template>
  <q-layout view="hHh Lpr lFf" class="bg-mesh-gradient">
    <!-- Header -->
    <q-header elevated class="bg-white text-slate-800" style="backdrop-filter: blur(10px); background: rgba(255, 255, 255, 0.9);">
      <q-toolbar class="q-px-lg" style="height: 70px;">
        <!-- Logo -->
        <q-btn flat no-caps class="q-mr-sm" to="/">
          <q-avatar size="42px" class="q-mr-sm">
            <q-icon name="healing" size="32px" class="text-primary" />
          </q-avatar>
          <div class="text-h6 font-weight-bold text-gradient" style="font-size: 1.4rem; letter-spacing: -0.5px;">
            MedBook
          </div>
        </q-btn>

        <q-space />

        <!-- Navigation Links -->
        <div class="gt-xs row q-gutter-md items-center">
          <q-btn flat no-caps color="grey-8" label="Find Clinic" to="/" />
          
          <template v-if="authStore.isLoggedIn">
            <q-btn flat no-caps color="grey-8" label="Dashboard" :to="dashboardLink" />
            
            <q-btn-dropdown flat no-caps color="primary" icon="account_circle" :label="authStore.user?.name">
              <q-list style="min-width: 180px;">
                <q-item class="q-py-md">
                  <q-item-section>
                    <div class="text-subtitle2 font-weight-bold">{{ authStore.user?.name }}</div>
                    <div class="text-caption text-grey-7">{{ formatRole(authStore.user?.role) }}</div>
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
                <q-item clickable v-close-popup @click="logout">
                  <q-item-section avatar>
                    <q-icon name="logout" color="negative" />
                  </q-item-section>
                  <q-item-section class="text-negative font-weight-medium">Logout</q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
          </template>
          
          <template v-else>
            <q-btn flat no-caps color="primary" label="Login" to="/app/login" />
            <q-btn unelevated no-caps color="primary" label="Sign Up" to="/app/register" class="q-px-md" style="border-radius: 8px;" />
          </template>
        </div>

        <!-- Mobile Menu Button -->
        <q-btn
          flat
          dense
          round
          class="lt-sm text-slate-800"
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />
      </q-toolbar>
    </q-header>

    <!-- Mobile Drawer -->
    <q-drawer
      v-model="leftDrawerOpen"
      side="left"
      bordered
      overlay
      class="bg-white"
    >
      <q-list class="q-pt-md">
        <q-item-label header class="text-gradient font-weight-bold">
          Navigation
        </q-item-label>

        <q-item clickable v-close-popup to="/">
          <q-item-section avatar>
            <q-icon name="search" />
          </q-item-section>
          <q-item-section>Find Clinic</q-item-section>
        </q-item>

        <template v-if="authStore.isLoggedIn">
          <q-item clickable v-close-popup :to="dashboardLink">
            <q-item-section avatar>
              <q-icon name="dashboard" />
            </q-item-section>
            <q-item-section>Dashboard</q-item-section>
          </q-item>
          
          <q-item clickable v-close-popup to="/app/profile">
            <q-item-section avatar>
              <q-icon name="settings" />
            </q-item-section>
            <q-item-section>Account Settings</q-item-section>
          </q-item>
          
          <q-separator class="q-my-sm" />
          
          <q-item clickable v-close-popup @click="logout" class="text-negative">
            <q-item-section avatar>
              <q-icon name="logout" color="negative" />
            </q-item-section>
            <q-item-section>Logout</q-item-section>
          </q-item>
        </template>
        
        <template v-else>
          <q-separator class="q-my-sm" />
          
          <q-item clickable v-close-popup to="/app/login">
            <q-item-section avatar>
              <q-icon name="login" color="primary" />
            </q-item-section>
            <q-item-section>Login</q-item-section>
          </q-item>
          
          <q-item clickable v-close-popup to="/app/register">
            <q-item-section avatar>
              <q-icon name="person_add" color="secondary" />
            </q-item-section>
            <q-item-section>Sign Up</q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-drawer>

    <!-- Page Container -->
    <q-page-container>
      <q-page class="q-pa-md row justify-center">
        <div class="col-12 col-md-10 col-lg-8 q-py-lg">
          <slot />
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();
const leftDrawerOpen = ref(false);

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};

const dashboardLink = computed(() => {
  const role = authStore.userRole;
  switch (role) {
    case 'super_admin':
      return '/dashboard/super-admin';
    case 'clinic_admin':
      return '/dashboard/clinic-admin';
    case 'doctor':
      return '/dashboard/doctor';
    case 'staff':
      return '/dashboard/clinic-admin';
    case 'patient':
      return '/dashboard/patient';
    default:
      return '/';
  }
});

const formatRole = (role) => {
  if (!role) return '';
  return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const logout = () => {
  authStore.logoutUser();
};
</script>
