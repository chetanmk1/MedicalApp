<template>
  <div class="q-gutter-y-lg">
    <div class="row justify-between items-center">
      <div>
        <h1 class="text-h4 font-weight-bold text-slate-800 q-mb-none">Platform Management</h1>
        <p class="text-subtitle2 text-grey-7">Super Admin control center</p>
      </div>
      
      <!-- Maintenance Mode Control -->
      <q-card flat bordered class="q-pa-sm bg-amber-1" style="border-radius: 12px; border-color: #fef08a;">
        <div class="row items-center q-gutter-md">
          <div class="row items-center">
            <q-icon name="warning" color="amber-8" size="24px" class="q-mr-sm" />
            <div>
              <div class="text-caption font-weight-bold text-slate-800">Global Maintenance Mode</div>
              <div class="text-caption text-grey-7">{{ maintenanceMode ? 'Active (Regular users blocked)' : 'Inactive (System fully online)' }}</div>
            </div>
          </div>
          <q-toggle
            v-model="maintenanceMode"
            color="amber-8"
            @update:model-value="toggleMaintenance"
            :loading="togglingMaintenance"
          />
        </div>
      </q-card>
    </div>

    <!-- Main Navigation Tabs -->
    <q-card flat bordered style="border-radius: 16px;">
      <q-tabs
        v-model="tab"
        dense
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        narrow-indicator
      >
        <q-tab name="clinics" label="Clinics Onboarding" icon="local_hospital" />
        <q-tab name="admins" label="Clinic Admins" icon="admin_panel_settings" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="tab" animated>
        <!-- Onboard & Manage Clinics Panel -->
        <q-tab-panel name="clinics" class="q-gutter-y-lg">
          <!-- Create Clinic Form -->
          <q-card flat bordered class="bg-grey-1" style="border-radius: 12px;">
            <q-card-section>
              <div class="text-subtitle1 font-weight-bold text-slate-800 q-mb-md">Onboard New Clinic</div>
              <q-form @submit.prevent="submitClinic" class="row q-col-gutter-sm">
                <div class="col-12 col-sm-6">
                  <q-input v-model="newClinic.name" outlined dense label="Clinic Name" required />
                </div>
                <div class="col-12 col-sm-3">
                  <q-input v-model="newClinic.city" outlined dense label="City" required />
                </div>
                <div class="col-12 col-sm-3">
                  <q-input v-model="newClinic.district" outlined dense label="District" required />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input v-model="newClinic.address" outlined dense label="Full Address" required />
                </div>
                <div class="col-12 col-sm-3">
                  <q-input v-model="newClinic.phone" outlined dense label="Phone" required />
                </div>
                <div class="col-12 col-sm-3">
                  <q-input v-model="newClinic.email" outlined dense type="email" label="Contact Email" required />
                </div>
                <div class="col-12 text-right q-pt-md">
                  <q-btn unelevated color="primary" type="submit" label="Register Clinic" :loading="submittingClinic" />
                </div>
              </q-form>
            </q-card-section>
          </q-card>

          <!-- List of Clinics -->
          <div>
            <div class="text-subtitle1 font-weight-bold text-slate-800 q-mb-md">Existing Clinics</div>
            <div v-if="clinics.length === 0" class="text-center q-py-xl text-grey-6">
              No clinics onboarded yet.
            </div>
            
            <q-list v-else separator bordered style="border-radius: 12px;">
              <q-item v-for="clinic in clinics" :key="clinic._id" class="q-py-md">
                <q-item-section>
                  <q-item-label class="text-subtitle2 font-weight-bold text-slate-800">{{ clinic.name }}</q-item-label>
                  <q-item-label caption class="row items-center q-gutter-x-sm">
                    <span>{{ clinic.address }}, {{ clinic.city }}, {{ clinic.district }}</span>
                    <span>•</span>
                    <span>{{ clinic.email }}</span>
                    <span>•</span>
                    <span>{{ clinic.phone }}</span>
                  </q-item-label>
                </q-item-section>
                
                <q-item-section side>
                  <div class="row items-center q-gutter-sm">
                    <q-chip
                      size="sm"
                      :color="getStatusColor(clinic.status)"
                      text-color="white"
                      :label="clinic.status.toUpperCase()"
                    />
                    
                    <q-btn-dropdown flat dense color="grey-8" icon="more_vert">
                      <q-list style="min-width: 150px;">
                        <q-item clickable v-close-popup @click="changeClinicStatus(clinic._id, 'active')">
                          <q-item-section>Activate</q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="changeClinicStatus(clinic._id, 'inactive')">
                          <q-item-section>Deactivate</q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="changeClinicStatus(clinic._id, 'suspended')">
                          <q-item-section class="text-negative">Suspend</q-item-section>
                        </q-item>
                      </q-list>
                    </q-btn-dropdown>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-tab-panel>

        <!-- Clinic Admins Panel -->
        <q-tab-panel name="admins" class="q-gutter-y-lg">
          <!-- Create Admin Form -->
          <q-card flat bordered class="bg-grey-1" style="border-radius: 12px;">
            <q-card-section>
              <div class="text-subtitle1 font-weight-bold text-slate-800 q-mb-md">Create Clinic Admin Account</div>
              
              <q-form @submit.prevent="submitAdmin" class="row q-col-gutter-sm">
                <div class="col-12 col-sm-6">
                  <q-select
                    v-model="newAdmin.clinicId"
                    outlined
                    dense
                    emit-value
                    map-options
                    :options="clinicOptions"
                    label="Select Clinic Binding"
                    required
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input v-model="newAdmin.name" outlined dense label="Admin Full Name" required />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input v-model="newAdmin.email" outlined dense type="email" label="Email Address" required />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input v-model="newAdmin.password" outlined dense type="password" label="Admin Password" required />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input v-model="newAdmin.phone" outlined dense label="Phone" required />
                </div>
                <div class="col-12 text-right q-pt-md">
                  <q-btn unelevated color="primary" type="submit" label="Create Admin" :loading="submittingAdmin" />
                </div>
              </q-form>
            </q-card-section>
          </q-card>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';

definePageMeta({
  role: 'super_admin'
});

const $q = useQuasar();
const { $api } = useNuxtApp();

const tab = ref('clinics');
const clinics = ref([]);
const maintenanceMode = ref(false);
const togglingMaintenance = ref(false);

// New Clinic Form State
const newClinic = ref({
  name: '',
  city: '',
  district: '',
  address: '',
  phone: '',
  email: ''
});
const submittingClinic = ref(false);

// New Admin Form State
const newAdmin = ref({
  clinicId: '',
  name: '',
  email: '',
  password: '',
  phone: ''
});
const submittingAdmin = ref(false);

const clinicOptions = computed(() => {
  return clinics.value.map(c => ({
    label: c.name,
    value: c._id
  }));
});

onMounted(() => {
  fetchClinics();
  fetchMaintenanceStatus();
});

const fetchClinics = async () => {
  try {
    const data = await $api('/clinics');
    clinics.value = data.clinics || [];
  } catch (err) {
    console.error('Fetch clinics error:', err);
  }
};

const fetchMaintenanceStatus = async () => {
  try {
    const data = await $api('/settings/maintenance');
    maintenanceMode.value = data ? data.maintenanceMode : false;
  } catch (err) {
    console.error('Fetch maintenance status error:', err);
  }
};

const toggleMaintenance = async (val) => {
  togglingMaintenance.value = true;
  try {
    const data = await $api('/settings/maintenance', {
      method: 'POST',
      body: { maintenanceMode: val }
    });
    maintenanceMode.value = data.maintenanceMode;
    $q.notify({
      type: 'positive',
      message: `Global Maintenance Mode is now ${val ? 'ENABLED' : 'DISABLED'}.`
    });
  } catch (err) {
    console.error('Toggle maintenance error:', err);
    maintenanceMode.value = !val; // Revert toggle on error
    $q.notify({
      type: 'negative',
      message: err._data?.message || 'Failed to toggle maintenance mode'
    });
  } finally {
    togglingMaintenance.value = false;
  }
};

const submitClinic = async () => {
  submittingClinic.value = true;
  try {
    await $api('/clinics', {
      method: 'POST',
      body: newClinic.value
    });

    $q.notify({
      type: 'positive',
      message: 'Clinic onboarded successfully.'
    });

    // Clear form
    newClinic.value = { name: '', city: '', district: '', address: '', phone: '', email: '' };
    fetchClinics();
  } catch (err) {
    console.error('Submit clinic error:', err);
    $q.notify({
      type: 'negative',
      message: err._data?.message || 'Failed to onboard clinic'
    });
  } finally {
    submittingClinic.value = false;
  }
};

const changeClinicStatus = async (clinicId, status) => {
  try {
    await $api(`/clinics/${clinicId}/status`, {
      method: 'PATCH',
      body: { status }
    });

    $q.notify({
      type: 'positive',
      message: `Clinic status changed to ${status}.`
    });

    fetchClinics();
  } catch (err) {
    console.error('Change clinic status error:', err);
    $q.notify({
      type: 'negative',
      message: err._data?.message || 'Failed to change clinic status'
    });
  }
};

const submitAdmin = async () => {
  submittingAdmin.value = true;
  try {
    await $api('/users', {
      method: 'POST',
      body: {
        ...newAdmin.value,
        role: 'clinic_admin'
      }
    });

    $q.notify({
      type: 'positive',
      message: 'Clinic Admin account created successfully.'
    });

    // Clear form
    newAdmin.value = { clinicId: '', name: '', email: '', password: '', phone: '' };
  } catch (err) {
    console.error('Submit admin error:', err);
    $q.notify({
      type: 'negative',
      message: err._data?.message || 'Failed to create clinic admin'
    });
  } finally {
    submittingAdmin.value = false;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'positive';
    case 'inactive': return 'warning';
    case 'suspended': return 'negative';
    default: return 'grey';
  }
};
</script>
