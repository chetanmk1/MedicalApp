<template>
  <q-layout view="hHh Lpr lFf" class="bg-mesh-gradient">
    <!-- Header -->
    <q-header elevated :style="patientHeaderStyle">
      <q-toolbar class="q-px-lg" style="height: 70px;">
        <!-- Logo -->
        <q-btn flat no-caps class="q-mr-sm" to="/">
          <q-avatar size="42px" class="q-mr-sm">
            <q-icon name="healing" size="32px" class="text-white" />
          </q-avatar>
          <div class="text-h6 font-weight-bold text-white" style="font-size: 1.4rem; letter-spacing: -0.5px;">
            MedCare
          </div>
        </q-btn>

        <q-space />

        <!-- Navigation Links -->
        <div class="gt-xs row q-gutter-md items-center">
          <!-- Dark Mode Toggle -->
          <q-btn flat round dense color="white" :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'" @click="$q.dark.toggle()" :title="$q.dark.isActive ? 'Switch to Light Mode' : 'Switch to Dark Mode'" />

          <!-- Notification Bell -->
          <q-btn v-if="authStore.isLoggedIn" flat round dense color="white" icon="notifications" @click="rightDrawerOpen = !rightDrawerOpen">
            <q-badge v-if="unreadCount > 0" color="red" floating>{{ unreadCount }}</q-badge>
          </q-btn>

          <q-btn flat no-caps color="white" label="Find Clinic" to="/" />
          
          <template v-if="authStore.isLoggedIn">
            <q-btn flat no-caps color="white" label="Dashboard" :to="dashboardLink" />
            
            <q-btn-dropdown flat no-caps color="white" icon="account_circle" :label="authStore.user?.name">
              <q-list style="min-width: 200px;">
                <q-item class="q-py-md">
                  <q-item-section>
                    <div class="text-subtitle2 font-weight-bold text-slate-800">{{ authStore.user?.name }}</div>
                    <div class="text-caption text-grey-7">{{ formatRole(authStore.user?.role) }}</div>
                  </q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-close-popup to="/app/profile">
                  <q-item-section avatar>
                    <q-icon name="settings" color="primary" />
                  </q-item-section>
                  <q-item-section class="font-weight-medium text-slate-800">Account Settings</q-item-section>
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
            <q-btn flat no-caps color="white" label="Login" to="/app/login" />
            <q-btn unelevated no-caps :color="$q.dark.isActive ? 'primary' : 'white'" :text-color="$q.dark.isActive ? 'white' : 'teal-9'" label="Sign Up" to="/app/register" class="q-px-md font-weight-bold" style="border-radius: 8px;" />
          </template>
        </div>

        <!-- Mobile Menu Button -->
        <q-btn
          flat
          dense
          round
          class="lt-sm text-white"
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
        
        <q-separator />

        <!-- Dark Mode Toggle (Mobile) -->
        <q-item clickable v-close-popup @click="$q.dark.toggle()">
          <q-item-section avatar>
            <q-icon :name="$q.dark.isActive ? 'light_mode' : 'dark_mode'" />
          </q-item-section>
          <q-item-section class="font-weight-medium">Toggle Theme</q-item-section>
        </q-item>

      </q-list>
    </q-drawer>

    <!-- Notification Drawer (Right) -->
    <q-drawer
      v-model="rightDrawerOpen"
      side="right"
      bordered
      :width="350"
      class="bg-white"
    >
      <div class="row items-center justify-between q-pa-md bg-emerald-1">
        <div class="text-subtitle1 font-weight-bold text-teal-9">Notifications</div>
        <q-btn flat dense round icon="done_all" color="teal-9" @click="markAllAsRead" title="Mark all as read" />
      </div>
      <q-separator />
      <q-scroll-area style="height: calc(100% - 60px);">
        <q-list separator>
          <q-item v-if="notifications.length === 0" class="text-center q-pa-lg text-grey">
            No notifications yet.
          </q-item>
          <q-item
            v-for="notif in notifications"
            :key="notif._id"
            clickable
            @click="markAsRead(notif._id)"
            :class="{ 'bg-teal-50': !notif.isRead }"
            class="q-py-md"
          >
            <q-item-section avatar>
              <q-icon :name="getNotifIcon(notif.type)" :color="getNotifColor(notif.type)" size="md" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="font-weight-bold" :class="{'text-black': !notif.isRead, 'text-grey-8': notif.isRead}">
                {{ notif.title }}
              </q-item-label>
              <q-item-label caption lines="2">{{ notif.message }}</q-item-label>
              <q-item-label caption class="q-mt-xs text-grey-5">{{ new Date(notif.createdAt).toLocaleString() }}</q-item-label>
            </q-item-section>
            <q-item-section side v-if="!notif.isRead">
              <q-badge rounded color="teal-9" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
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
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useNotifications } from '~/composables/useNotifications';

const authStore = useAuthStore();
const leftDrawerOpen = ref(false);
const rightDrawerOpen = ref(false);
const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();

onMounted(() => {
  if (authStore.isLoggedIn) {
    fetchNotifications();
  }
});

const getNotifIcon = (type) => {
  switch(type) {
    case 'success': return 'check_circle';
    case 'warning': return 'warning';
    case 'error': return 'error';
    default: return 'info';
  }
};

const getNotifColor = (type) => {
  switch(type) {
    case 'success': return 'positive';
    case 'warning': return 'warning';
    case 'error': return 'negative';
    default: return 'primary';
  }
};

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};

const patientHeaderStyle = computed(() => {
  // Premium emerald/teal gradient for patients
  return 'background: linear-gradient(135deg, #064e3b 0%, #10b981 100%);';
});

const dashboardLink = computed(() => {
  const role = authStore.userRole;
  switch (role) {
    case 'super_admin':
    case 'clinic_admin':
    case 'doctor':
    case 'staff':
    case 'receptionist':
      return '/admin/dashboard';
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
