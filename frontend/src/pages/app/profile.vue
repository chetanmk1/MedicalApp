<template>
  <div class="q-gutter-y-lg q-py-md">
    <!-- Header -->
    <div>
      <h1 class="text-h4 font-weight-bold text-slate-800 q-mb-xs" style="letter-spacing: -0.5px;">
        Account Settings
      </h1>
      <p class="text-caption text-grey-7">
        Manage your profile details and update your password.
      </p>
    </div>

    <div class="row q-col-gutter-lg">
      <!-- Update Profile Section -->
      <div class="col-12 col-md-6">
        <q-card class="glass-card q-pa-md height-100">
          <q-card-section class="row items-center q-pb-none">
            <q-avatar size="40px" class="bg-indigo-1 q-mr-md">
              <q-icon name="person" size="24px" class="text-primary" />
            </q-avatar>
            <div>
              <div class="text-subtitle1 font-weight-bold text-slate-800">Profile Information</div>
              <div class="text-caption text-grey-6">Update your name, email, and contact info</div>
            </div>
          </q-card-section>

          <q-card-section class="q-pt-md">
            <q-form @submit.prevent="handleUpdateProfile" class="q-gutter-y-md">
              <q-input
                v-model="profileForm.name"
                outlined
                dense
                label="Full Name"
                required
                lazy-rules
                :rules="[ val => val && val.length > 0 || 'Name is required' ]"
              />

              <q-input
                v-model="profileForm.email"
                outlined
                dense
                type="email"
                label="Email Address"
                required
                lazy-rules
                :rules="[ 
                  val => val && val.length > 0 || 'Email is required',
                  val => isValidEmail(val) || 'Invalid email format'
                ]"
              />

              <q-input
                v-model="profileForm.phone"
                outlined
                dense
                label="Phone Number"
                required
                lazy-rules
                :rules="[ val => val && val.length > 0 || 'Phone number is required' ]"
              />

              <q-input
                v-if="authStore.isDoctor"
                v-model="profileForm.specialization"
                outlined
                dense
                label="Doctor Specialization"
                required
                lazy-rules
                :rules="[ val => val && val.length > 0 || 'Specialization is required' ]"
              />

              <div class="row justify-end q-pt-sm">
                <q-btn
                  unelevated
                  color="primary"
                  type="submit"
                  label="Save Profile"
                  :loading="profileLoading"
                  style="border-radius: 8px;"
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </div>

      <!-- Update Password Section -->
      <div class="col-12 col-md-6">
        <q-card class="glass-card q-pa-md height-100">
          <q-card-section class="row items-center q-pb-none">
            <q-avatar size="40px" class="bg-amber-1 q-mr-md">
              <q-icon name="lock" size="24px" class="text-warning" />
            </q-avatar>
            <div>
              <div class="text-subtitle1 font-weight-bold text-slate-800">Security Settings</div>
              <div class="text-caption text-grey-6">Update your account password</div>
            </div>
          </q-card-section>

          <q-card-section class="q-pt-md">
            <q-form @submit.prevent="handleUpdatePassword" class="q-gutter-y-md">
              <q-input
                v-model="passwordForm.currentPassword"
                outlined
                dense
                :type="showCurrent ? 'text' : 'password'"
                label="Current Password"
                required
                lazy-rules
                :rules="[ val => val && val.length > 0 || 'Current password is required' ]"
              >
                <template v-slot:append>
                  <q-icon
                    :name="showCurrent ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="showCurrent = !showCurrent"
                  />
                </template>
              </q-input>

              <q-input
                v-model="passwordForm.newPassword"
                outlined
                dense
                :type="showNew ? 'text' : 'password'"
                label="New Password"
                required
                lazy-rules
                :rules="[ val => val && val.length >= 6 || 'New password must be at least 6 characters' ]"
              >
                <template v-slot:append>
                  <q-icon
                    :name="showNew ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="showNew = !showNew"
                  />
                </template>
              </q-input>

              <q-input
                v-model="passwordForm.confirmPassword"
                outlined
                dense
                :type="showConfirm ? 'text' : 'password'"
                label="Confirm New Password"
                required
                lazy-rules
                :rules="[ 
                  val => val && val.length >= 6 || 'Confirm password must be at least 6 characters',
                  val => val === passwordForm.newPassword || 'Passwords do not match'
                ]"
              >
                <template v-slot:append>
                  <q-icon
                    :name="showConfirm ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="showConfirm = !showConfirm"
                  />
                </template>
              </q-input>

              <div class="row justify-end q-pt-sm">
                <q-btn
                  unelevated
                  color="indigo-6"
                  type="submit"
                  label="Update Password"
                  :loading="passwordLoading"
                  style="border-radius: 8px;"
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const authStore = useAuthStore();
const { $api } = useNuxtApp();

const profileLoading = ref(false);
const passwordLoading = ref(false);

const showCurrent = ref(false);
const showNew = ref(false);
const showConfirm = ref(false);

const profileForm = ref({
  name: '',
  email: '',
  phone: '',
  specialization: ''
});

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

onMounted(() => {
  if (authStore.user) {
    profileForm.value.name = authStore.user.name || '';
    profileForm.value.email = authStore.user.email || '';
    profileForm.value.phone = authStore.user.phone || '';
    profileForm.value.specialization = authStore.user.specialization || '';
  }
});

const isValidEmail = (val) => {
  const pattern = /^(?=[A-Za-z0-9@._%+-]{6,254}$)[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
  return pattern.test(val);
};

const handleUpdateProfile = async () => {
  profileLoading.value = true;
  try {
    const data = await $api('/auth/profile', {
      method: 'PUT',
      body: {
        name: profileForm.value.name,
        email: profileForm.value.email,
        phone: profileForm.value.phone,
        specialization: profileForm.value.specialization
      }
    });

    if (data && data.user) {
      // Sync local Pinia store session state
      authStore.user = data.user;
      
      $q.notify({
        type: 'positive',
        message: 'Profile information updated successfully.'
      });
    }
  } catch (err) {
    console.error('Update profile error:', err);
    $q.notify({
      type: 'negative',
      message: err._data?.message || 'Profile update failed. Please check details.'
    });
  } finally {
    profileLoading.value = false;
  }
};

const handleUpdatePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    $q.notify({
      type: 'negative',
      message: 'Passwords do not match.'
    });
    return;
  }

  passwordLoading.value = true;
  try {
    await $api('/auth/update-password', {
      method: 'PUT',
      body: {
        currentPassword: passwordForm.value.currentPassword,
        newPassword: passwordForm.value.newPassword
      }
    });

    $q.notify({
      type: 'positive',
      message: 'Your password was updated successfully.'
    });

    // Reset password inputs
    passwordForm.value.currentPassword = '';
    passwordForm.value.newPassword = '';
    passwordForm.value.confirmPassword = '';
  } catch (err) {
    console.error('Update password error:', err);
    $q.notify({
      type: 'negative',
      message: err._data?.message || 'Password update failed. Make sure current password is correct.'
    });
  } finally {
    passwordLoading.value = false;
  }
};
</script>
