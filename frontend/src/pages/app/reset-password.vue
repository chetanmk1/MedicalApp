<template>
  <div class="row justify-center items-center" style="min-height: 80vh;">
    <div class="col-12 col-sm-10 col-md-6 col-lg-5">
      <q-card class="glass-card q-pa-lg">
        <q-card-section class="text-center q-pb-none">
          <q-avatar size="60px" class="bg-indigo-1 q-mb-md">
            <q-icon name="password" size="36px" class="text-primary" />
          </q-avatar>
          <h2 class="text-h5 font-weight-bold text-slate-800 q-my-none">Reset Password</h2>
          <p class="text-caption text-grey-7 q-mt-sm">
            Enter your new secure password below to complete the reset process.
          </p>
        </q-card-section>

        <q-card-section v-if="!token" class="q-py-md">
          <q-banner dense rounded class="bg-red-1 text-red q-pa-md">
            <template v-slot:avatar>
              <q-icon name="error" color="red" />
            </template>
            <div class="text-weight-bold">Invalid Reset Request</div>
            <div class="text-caption q-mt-xs">No password reset token was detected in the URL. Please request a new link.</div>
          </q-banner>
        </q-card-section>

        <q-card-section v-else>
          <q-form @submit.prevent="handleSubmit" class="q-gutter-y-md">
            <q-input
              v-model="password"
              outlined
              dense
              :type="showPassword ? 'text' : 'password'"
              label="New Password"
              required
              lazy-rules
              :rules="[ val => val && val.length >= 6 || 'Password must be at least 6 characters' ]"
            >
              <template v-slot:prepend>
                <q-icon name="vpn_key" color="grey-6" />
              </template>
              <template v-slot:append>
                <q-icon
                  :name="showPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showPassword = !showPassword"
                />
              </template>
            </q-input>

            <q-input
              v-model="confirmPassword"
              outlined
              dense
              :type="showConfirmPassword ? 'text' : 'password'"
              label="Confirm New Password"
              required
              lazy-rules
              :rules="[ 
                val => val && val.length >= 6 || 'Confirm password must be at least 6 characters',
                val => val === password || 'Passwords do not match'
              ]"
            >
              <template v-slot:prepend>
                <q-icon name="vpn_key" color="grey-6" />
              </template>
              <template v-slot:append>
                <q-icon
                  :name="showConfirmPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showConfirmPassword = !showConfirmPassword"
                />
              </template>
            </q-input>

            <div class="q-pt-md">
              <q-btn
                unelevated
                color="primary"
                type="submit"
                label="Save New Password"
                class="full-width q-py-sm font-weight-bold"
                style="border-radius: 8px; font-size: 1rem;"
                :loading="loading"
              />
            </div>
          </q-form>
        </q-card-section>

        <q-card-section class="text-center q-pt-none">
          <p class="text-caption text-grey-7">
            Back to
            <router-link to="/app/login" class="text-primary font-weight-bold text-decoration-none">
              Sign In
            </router-link>
          </p>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const route = useRoute();
const { $api } = useNuxtApp();

const token = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const loading = ref(false);

onMounted(() => {
  if (route.query.token) {
    token.value = route.query.token;
  }
});

const handleSubmit = async () => {
  if (password.value !== confirmPassword.value) {
    $q.notify({
      type: 'negative',
      message: 'Passwords do not match.',
    });
    return;
  }

  loading.value = true;
  try {
    await $api('/auth/reset-password', {
      method: 'POST',
      body: {
        token: token.value,
        password: password.value,
      },
    });

    $q.notify({
      type: 'positive',
      message: 'Your password has been reset successfully! You can now log in.',
    });
    navigateTo('/app/login');
  } catch (err) {
    console.error('Password reset failed:', err);
    $q.notify({
      type: 'negative',
      message: err._data?.message || 'Password reset failed. Token may be invalid or expired.',
    });
  } finally {
    loading.value = false;
  }
};
</script>
