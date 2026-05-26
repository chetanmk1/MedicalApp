<template>
  <div class="row justify-center items-center" style="min-height: 80vh;">
    <div class="col-12 col-sm-10 col-md-6 col-lg-5">
      <q-card class="glass-card q-pa-lg">
        <q-card-section class="text-center q-pb-none">
          <q-avatar size="60px" class="bg-indigo-1 q-mb-md">
            <q-icon name="admin_panel_settings" size="36px" class="text-primary" />
          </q-avatar>
          <h2 class="text-h5 font-weight-bold text-slate-800 q-my-none">Admin Login Portal</h2>
          <p class="text-caption text-grey-7 q-mt-sm">
            Sign in to access clinic workflows and platform management.
          </p>
        </q-card-section>

        <q-card-section>
          <q-form @submit.prevent="handleLogin" class="q-gutter-y-md">
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

            <div class="q-pt-md">
              <q-btn
                unelevated
                color="primary"
                type="submit"
                label="Sign In to Portal"
                class="full-width q-py-sm font-weight-bold"
                style="border-radius: 8px; font-size: 1rem;"
                :loading="loading"
              />
            </div>
          </q-form>
        </q-card-section>

        <q-card-section class="text-center q-pt-none text-grey-6 text-caption">
          Private systems access only. Unauthorized attempts are logged.
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

const handleLogin = async () => {
  loading.value = true;
  try {
    const data = await login(email.value, password.value);
    
    // Validate that the user is an admin, not a patient trying to access admin login!
    const role = data.user.role;
    if (role === 'patient') {
      $q.notify({
        type: 'negative',
        message: 'Access denied: Patients must use the consumer login page.'
      });
      // Clear session immediately
      const authStore = useAuthStore();
      authStore.clearSession();
      navigateTo('/app/login');
      return;
    }

    $q.notify({
      type: 'positive',
      message: `Welcome back, ${data.user.name}!`
    });

    navigateTo('/admin/dashboard');
  } catch (err) {
    console.error('Login failed:', err);
    $q.notify({
      type: 'negative',
      message: err._data?.message || 'Invalid email or password'
    });
  } finally {
    loading.value = false;
  }
};
</script>
