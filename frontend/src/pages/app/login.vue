<template>
  <div class="row justify-center items-center" style="min-height: 80vh;">
    <div class="col-12 col-sm-10 col-md-6 col-lg-5">
      <q-card class="glass-card q-pa-lg">
        <q-card-section class="text-center q-pb-none">
          <q-avatar size="60px" class="bg-indigo-1 q-mb-md">
            <q-icon name="lock" size="36px" class="text-primary" />
          </q-avatar>
          <h2 class="text-h5 font-weight-bold text-slate-800 q-my-none">Patient Sign In</h2>
          <p class="text-caption text-grey-7 q-mt-sm">
            Sign in to access your dashboard and manage appointments.
          </p>
        </q-card-section>

        <q-card-section>
          <q-form @submit.prevent="handleSubmit" class="q-gutter-y-md">
            <q-input
              v-model="email"
              outlined
              dense
              type="email"
              label="Email Address"
              required
              lazy-rules
              :rules="[ val => val && val.length > 0 || 'Email is required' ]"
            >
              <template v-slot:prepend>
                <q-icon name="email" color="grey-6" />
              </template>
            </q-input>

            <q-input
              v-model="password"
              outlined
              dense
              :type="showPassword ? 'text' : 'password'"
              label="Password"
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

            <div class="text-right q-mt-xs">
              <router-link to="/app/forgot-password" class="text-primary text-caption font-weight-medium text-decoration-none">
                Forgot Password?
              </router-link>
            </div>

            <div class="q-pt-md">
              <q-btn
                unelevated
                color="primary"
                type="submit"
                label="Sign In"
                class="full-width q-py-sm font-weight-bold"
                style="border-radius: 8px; font-size: 1rem;"
                :loading="loading"
              />
            </div>
          </q-form>
        </q-card-section>

        <q-card-section class="text-center q-pt-none">
          <p class="text-caption text-grey-7">
            New to MedBook?
            <router-link to="/app/register" class="text-primary font-weight-bold text-decoration-none">
              Create a Patient Account
            </router-link>
          </p>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuth } from '~/composables/useAuth';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const { login } = useAuth();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);

const handleSubmit = async () => {
  loading.value = true;
  try {
    const data = await login(email.value, password.value);
    
    $q.notify({
      type: 'positive',
      message: `Welcome back, ${data.user.name}!`
    });

    const role = data.user.role;
    if (role === 'patient') {
      navigateTo('/app');
    } else {
      navigateTo('/admin/dashboard');
    }
  } catch (err) {
    console.error('Login failed:', err);
    
    // Check if unverified patient tries to login
    if (err.status === 403 && err._data?.status === 'pending_otp') {
      $q.notify({
        type: 'warning',
        message: 'Account not verified. Redirecting to OTP verification...'
      });
      navigateTo(`/app/otp-verification?email=${encodeURIComponent(err._data.email)}`);
      return;
    }

    $q.notify({
      type: 'negative',
      message: err._data?.message || 'Invalid email or password'
    });
  } finally {
    loading.value = false;
  }
};
</script>
