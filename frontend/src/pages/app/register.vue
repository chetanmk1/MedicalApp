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
              label="Full Name *"
              required
              lazy-rules
              :rules="[ val => val && val.trim().length > 0 || 'Name is required' ]"
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
              label="Email Address (Optional)"
              lazy-rules
              :rules="[ val => !val || val.trim().length > 0 || 'Please enter a valid email' ]"
            >
              <template v-slot:prepend>
                <q-icon name="email" color="grey-6" />
              </template>
            </q-input>

            <q-input
              v-model="phone"
              outlined
              dense
              label="Phone Number *"
              required
              lazy-rules
              :rules="[ val => val && val.trim().length > 0 || 'Phone number is required' ]"
            >
              <template v-slot:prepend>
                <q-icon name="phone" color="grey-6" />
              </template>
            </q-input>

            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-input
                  v-model.number="age"
                  outlined
                  dense
                  type="number"
                  label="Age (Optional)"
                  :rules="[ val => !val || (val > 0 && val <= 150) || 'Age must be between 1 and 150' ]"
                >
                  <template v-slot:prepend>
                    <q-icon name="cake" color="grey-6" />
                  </template>
                </q-input>
              </div>
              <div class="col-6">
                <q-select
                  v-model="gender"
                  :options="['Male', 'Female', 'Other', 'Prefer not to say']"
                  outlined
                  dense
                  label="Gender (Optional)"
                >
                  <template v-slot:prepend>
                    <q-icon name="wc" color="grey-6" />
                  </template>
                </q-select>
              </div>
            </div>

            <q-input
              v-model="password"
              outlined
              dense
              :type="showPassword ? 'text' : 'password'"
              label="Password *"
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
import { useAuth } from '~/composables/useAuth';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const { register } = useAuth();

const name = ref('');
const email = ref('');
const phone = ref('');
const age = ref('');
const gender = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);

const handleRegister = async () => {
  loading.value = true;
  try {
    await register(name.value, email.value, phone.value, password.value, age.value, gender.value);
    
    $q.notify({
      type: 'positive',
      message: 'Account created! Please verify your email with the OTP sent.'
    });

    navigateTo(`/app/otp-verification?email=${encodeURIComponent(email.value)}`);
  } catch (err) {
    console.error('Registration failed:', err);
    $q.notify({
      type: 'negative',
      message: err._data?.message || 'Registration failed. Email might be in use.'
    });
  } finally {
    loading.value = false;
  }
};
</script>
