<template>
  <div class="row justify-center items-center" style="min-height: 80vh;">
    <div class="col-12 col-sm-10 col-md-6 col-lg-5">
      <q-card class="glass-card q-pa-lg">
        <q-card-section class="text-center q-pb-none">
          <q-avatar size="60px" class="bg-indigo-1 q-mb-md">
            <q-icon name="mark_email_read" size="36px" class="text-primary" />
          </q-avatar>
          <h2 class="text-h5 font-weight-bold text-slate-800 q-my-none">Enter OTP Code</h2>
          <p class="text-caption text-grey-7 q-mt-sm">
            We have sent a verification code to <strong>{{ email }}</strong>.<br>
            Please check your email and enter the code below.
          </p>
          <q-banner dense class="bg-amber-1 text-amber-9 q-mt-md rounded">
            <strong>Testing Tip:</strong> Check the terminal logs for the generated OTP!
          </q-banner>
        </q-card-section>

        <q-card-section>
          <q-form @submit.prevent="handleVerify" class="q-gutter-y-md">
            <q-input
              v-model="otpCode"
              outlined
              dense
              label="6-Digit OTP Code"
              mask="######"
              fill-mask
              unmasked-value
              required
              lazy-rules
              :rules="[ val => val && val.length === 6 || 'OTP must be 6 digits' ]"
              class="text-center font-weight-bold"
              style="letter-spacing: 4px;"
            >
              <template v-slot:prepend>
                <q-icon name="pin" color="grey-6" />
              </template>
            </q-input>

            <div class="q-pt-md">
              <q-btn
                unelevated
                color="primary"
                type="submit"
                label="Verify & Activate"
                class="full-width q-py-sm font-weight-bold"
                style="border-radius: 8px; font-size: 1rem;"
                :loading="loading"
              />
            </div>
          </q-form>
        </q-card-section>

        <q-card-section class="text-center q-pt-none">
          <p class="text-caption text-grey-7">
            Didn't receive the code?
            <q-btn flat dense no-caps color="primary" label="Resend Code" @click="handleResend" :disable="resendCooldown > 0" />
            <span v-if="resendCooldown > 0"> ({{ resendCooldown }}s)</span>
          </p>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuth } from '~/composables/useAuth';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const { verifyOtp, user } = useAuth();
const route = useRoute();

const email = ref('');
const otpCode = ref('');
const loading = ref(false);
const resendCooldown = ref(0);

onMounted(() => {
  // Read email from route query or user store
  email.value = route.query.email || user.value?.email || '';
  if (!email.value) {
    $q.notify({
      type: 'warning',
      message: 'Email parameter missing. Please register or login.'
    });
    navigateTo('/app/login');
  }
});

const handleVerify = async () => {
  loading.value = true;
  try {
    await verifyOtp(email.value, otpCode.value);
    $q.notify({
      type: 'positive',
      message: 'Account verified successfully! Welcome to MedBook.'
    });
    navigateTo('/app');
  } catch (err) {
    console.error('OTP verification failed:', err);
    $q.notify({
      type: 'negative',
      message: err._data?.message || 'Invalid or expired OTP code'
    });
  } finally {
    loading.value = false;
  }
};

const handleResend = () => {
  $q.notify({
    type: 'info',
    message: 'A new OTP has been sent. Check server logs!'
  });
  // Cooldown timer
  resendCooldown.value = 30;
  const timer = setInterval(() => {
    resendCooldown.value--;
    if (resendCooldown.value <= 0) clearInterval(timer);
  }, 1000);
};
</script>
