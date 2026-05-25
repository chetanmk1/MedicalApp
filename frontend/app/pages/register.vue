<template>
  <div class="row justify-center items-center" style="min-height: 80vh;">
    <div class="col-12 col-sm-10 col-md-6 col-lg-5">
      <q-card class="glass-card q-pa-lg">
        <q-card-section class="text-center q-pb-none">
          <q-avatar size="60px" class="bg-indigo-1 q-mb-md">
            <q-icon name="person_add" size="36px" class="text-primary" />
          </q-avatar>
          <h2 class="text-h5 font-weight-bold text-slate-800 q-my-none">Create Patient Account</h2>
          <p class="text-caption text-grey-7 q-mt-sm">
            Sign up to book and manage appointments with your doctors instantly.
          </p>
        </q-card-section>

        <q-card-section>
          <q-form @submit.prevent="handleRegister" class="q-gutter-y-md">
            <q-input
              v-model="name"
              outlined
              dense
              label="Full Name"
              required
              lazy-rules
              :rules="[ val => val && val.length > 0 || 'Name is required' ]"
            >
              <template v-slot:prepend>
                <q-icon name="person" color="grey-6" />
              </template>
            </q-input>

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

            <q-input
              v-model="phone"
              outlined
              dense
              label="Phone Number"
              required
              lazy-rules
              :rules="[ val => val && val.length > 0 || 'Phone number is required' ]"
            >
              <template v-slot:prepend>
                <q-icon name="phone" color="grey-6" />
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
                label="Register"
                class="full-width q-py-sm font-weight-bold"
                style="border-radius: 8px; font-size: 1rem;"
                :loading="loading"
              />
            </div>
          </q-form>
        </q-card-section>

        <q-card-section class="text-center q-pt-none">
          <p class="text-caption text-grey-7">
            Already have an account?
            <router-link to="/login" class="text-primary font-weight-bold text-decoration-none">
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
import { useAuthStore } from '~/stores/auth';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const authStore = useAuthStore();
const { $api } = useNuxtApp();

const name = ref('');
const email = ref('');
const phone = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);

const isValidEmail = (val) => {
  const pattern = /^(?=[A-Za-z0-9@._%+-]{6,254}$)[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
  return pattern.test(val);
};

const handleRegister = async () => {
  loading.value = true;
  try {
    const data = await $api('/auth/register', {
      method: 'POST',
      body: {
        name: name.value,
        email: email.value,
        phone: phone.value,
        password: password.value,
      },
    });

    if (data && data.token) {
      // Save credentials in Pinia auth state
      authStore.setSession(data.user, data.token);

      $q.notify({
        type: 'positive',
        message: `Welcome, ${data.user.name}! Your account has been registered.`,
      });

      navigateTo('/dashboard/patient');
    }
  } catch (err) {
    console.error('Registration failed:', err);
    $q.notify({
      type: 'negative',
      message: err._data?.message || 'Registration failed. Email might be in use.',
    });
  } finally {
    loading.value = false;
  }
};
</script>
