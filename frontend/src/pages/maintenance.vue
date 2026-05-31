<template>
  <div class="row justify-center items-center" style="min-height: 80vh;">
    <div class="col-12 col-sm-10 col-md-7 text-center">
      <q-card class="dark-glass-card q-pa-xl">
        <q-card-section>
          <q-avatar size="100px" class="bg-amber-1 q-mb-lg">
            <q-icon name="handyman" size="64px" color="amber-9" />
          </q-avatar>
          <h1 class="text-h4 font-weight-bold q-mb-md text-gradient-purple">System Under Maintenance</h1>
          <p class="text-subtitle1 text-slate-300 max-width-md q-mx-auto" style="max-width: 500px; line-height: 1.6;">
            We are performing scheduled infrastructure upgrades. The booking platform will return shortly. Thank you for your patience!
          </p>
        </q-card-section>

        <q-separator dark class="q-my-lg" />

        <q-card-section class="row justify-center q-gutter-md">
          <div class="col-auto text-left row items-center text-slate-400">
            <q-icon name="update" size="20px" class="q-mr-sm" />
            <span>Estimated return: <strong>Soon</strong></span>
          </div>
          <div class="col-auto text-left row items-center text-slate-400">
            <q-icon name="support_agent" size="20px" class="q-mr-sm" />
            <span>Emergency Support: <strong>support@medbook.com</strong></span>
          </div>
        </q-card-section>

        <!-- Admin Bypass Hint -->
        <q-card-section class="q-pt-md">
          <q-btn
            outline
            dense
            color="amber-7"
            label="Super Admin Bypass"
            to="/admin/login"
            no-caps
            class="q-px-md"
            style="border-radius: 8px;"
          />
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup>
// No layout is applied to maintenance page
definePageMeta({
  layout: false
});
</script>
