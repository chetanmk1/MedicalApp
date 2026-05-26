<template>
  <div class="row justify-center items-center" style="min-height: 80vh;">
    <div class="col-12 col-sm-10 col-md-6 col-lg-5">
      <q-card class="glass-card q-pa-lg">
        <q-card-section class="text-center q-pb-none">
          <q-avatar size="60px" class="bg-indigo-1 q-mb-md">
            <q-icon name="lock_reset" size="36px" class="text-primary" />
          </q-avatar>
          <h2 class="text-h5 font-weight-bold text-slate-800 q-my-none">Forgot Password?</h2>
          <p class="text-caption text-grey-7 q-mt-sm">
            Enter your email address and we'll send you a simulation link to reset your password.
          </p>
        </q-card-section>

        <q-card-section v-if="successMsg" class="q-py-md">
          <q-banner dense rounded class="bg-green-1 text-green q-pa-md">
            <template v-slot:avatar>
              <q-icon name="check_circle" color="green" />
            </template>
            <div class="text-weight-bold">{{ successMsg }}</div>
            <div class="text-caption q-mt-xs">Note: Transactional emails are simulated in the backend logs console.</div>
          </q-banner>
        </q-card-section>

        <q-card-section v-else>
          <q-form @submit.prevent="handleSubmit" class="q-gutter-y-md">
            <q-input
              v-model="email"
              outlined
              dense
              type="email"
              label="Email Address"
              required
              lazy-rules
              :rules="[ val => val && val.length > 0 || 'Email is required', val => isValidEmail(val) || 'Invalid email format' ]"
            >
              <template v-slot:prepend>
                <q-icon name="email" color="grey-6" />
              </template>
            </q-input>

            <div class="q-pt-md">
              <q-btn
                unelevated
                color="primary"
                type="submit"
                label="Send Reset Link"
                class="full-width q-py-sm font-weight-bold"
                style="border-radius: 8px; font-size: 1rem;"
                :loading="loading"
              />
            </div>
          </q-form>
        </q-card-section>

        <q-card-section class="text-center q-pt-none">
          <p class="text-caption text-grey-7">
            Remember your password?
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
import { ref } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const { $api } = useNuxtApp();

const email = ref('');
const loading = ref(false);
const successMsg = ref('');

const isValidEmail = (val) => {
  const pattern = /^(?=[A-Za-z0-9@._%+-]{6,254}$)[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
  return pattern.test(val);
};

const handleSubmit = async () => {
  loading.value = true;
  successMsg.value = '';
  try {
    const data = await $api('/auth/forgot-password', {
      method: 'POST',
      body: { email: email.value },
    });

    successMsg.value = data.message || 'Password reset link sent to your email.';
    $q.notify({
      type: 'positive',
      message: 'Reset email triggered successfully.',
    });
  } catch (err) {
    console.error('Request reset failed:', err);
    $q.notify({
      type: 'negative',
      message: err._data?.message || 'Failed to send reset link. Please try again.',
    });
  } finally {
    loading.value = false;
  }
};
</script>
