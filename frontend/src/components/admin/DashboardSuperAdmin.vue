<template>
  <div class="q-gutter-y-lg">
    <!-- Tab Panel Layout -->
    <q-tab-panels v-model="activeTab" animated class="bg-transparent" style="overflow: visible;">
      <!-- Dashboard View (Overview) -->
      <q-tab-panel name="dashboard" class="q-pa-none q-gutter-y-lg">
        <div class="row justify-between items-center">
          <div>
            <h1 class="text-h4 font-weight-bold text-slate-800 q-mb-none">Platform Overview</h1>
            <p class="text-subtitle2 text-grey-7">Super Admin control center</p>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6 col-lg-3">
            <q-card flat bordered class="q-pa-md" style="border-radius: 12px;">
              <div class="row items-center justify-between">
                <div>
                  <div class="text-grey-6 text-caption">Active Clinics</div>
                  <div class="text-h4 font-weight-bold text-indigo-9 q-mt-xs">{{ activeClinicsCount }}</div>
                </div>
                <q-avatar color="indigo-1" text-color="indigo" icon="local_hospital" />
              </div>
            </q-card>
          </div>
          <div class="col-12 col-md-6 col-lg-3">
            <q-card flat bordered class="q-pa-md" style="border-radius: 12px;">
              <div class="row items-center justify-between">
                <div>
                  <div class="text-grey-6 text-caption">Pending Requests</div>
                  <div class="text-h4 font-weight-bold text-amber-9 q-mt-xs">{{ pendingRequestsCount }}</div>
                </div>
                <q-avatar color="amber-1" text-color="amber-9" icon="pending_actions" />
              </div>
            </q-card>
          </div>
        </div>

        <!-- Onboarding Approvals -->
        <q-card flat bordered style="border-radius: 16px;">
          <q-card-section class="bg-indigo-0 text-slate-800 row justify-between items-center">
            <div class="text-h6 font-weight-bold row items-center">
              <q-icon name="fact_check" class="q-mr-sm text-primary" size="24px" />
              Pending Clinic Registrations ({{ pendingClinics.length }})
            </div>
            <q-btn flat dense icon="refresh" color="primary" label="Refresh" @click="loadClinics" />
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pa-none">
            <q-list separator v-if="pendingClinics.length > 0">
              <q-item v-for="c in pendingClinics" :key="c._id" class="q-py-md">
                <q-item-section>
                  <div class="text-subtitle1 font-weight-bold text-slate-800">{{ c.name }}</div>
                  <q-item-label caption class="q-mt-xs">
                    <div><strong>Location:</strong> {{ c.address }}, {{ c.city }}, {{ c.district }}</div>
                    <div><strong>Contact:</strong> {{ c.email }} • {{ c.phone }}</div>
                    <div class="text-primary q-mt-xs">
                      <strong>Requested Admin:</strong> {{ c.adminName }} ({{ c.adminEmail }} • {{ c.adminPhone }})
                    </div>
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="row q-gutter-sm">
                    <q-btn unelevated color="positive" label="Approve" size="sm" @click="handleApprove(c._id)" />
                    <q-btn outline color="negative" label="Reject" size="sm" @click="handleReject(c._id)" />
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
            <div v-else class="text-center q-py-xl text-grey-6">
              <q-icon name="check_circle" size="48px" color="green-2" class="q-mb-md" />
              <div>No pending clinic registration requests at this time.</div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Clinic Directory -->
        <q-card flat bordered style="border-radius: 16px;">
          <q-card-section class="text-subtitle1 font-weight-bold text-slate-800">
            Registered Clinics Directory
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pa-none">
            <q-list separator v-if="nonPendingClinics.length > 0">
              <q-item v-for="c in nonPendingClinics" :key="c._id" class="q-py-md">
                <q-item-section>
                  <div class="row items-center q-gutter-x-sm">
                    <span class="text-subtitle1 font-weight-bold text-slate-800">{{ c.name }}</span>
                    <q-chip size="sm" :color="getStatusColor(c.status)" text-color="white" :label="c.status.toUpperCase()" />
                  </div>
                  <q-item-label caption class="q-mt-xs">
                    {{ c.address }}, {{ c.city }}, {{ c.district }} • {{ c.email }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="row items-center q-gutter-sm">
                    <q-btn
                      unelevated
                      color="cyan-8"
                      text-color="white"
                      icon="login"
                      label="Impersonate"
                      size="sm"
                      @click="handleImpersonate(c)"
                      v-if="c.status === 'active'"
                    />
                    <q-btn-dropdown flat dense color="grey-8" icon="more_vert">
                      <q-list style="min-width: 150px;">
                        <q-item clickable v-close-popup @click="changeStatus(c._id, 'active')">
                          <q-item-section>Activate</q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="changeStatus(c._id, 'inactive')">
                          <q-item-section>Deactivate</q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="changeStatus(c._id, 'suspended')">
                          <q-item-section class="text-negative">Suspend</q-item-section>
                        </q-item>
                      </q-list>
                    </q-btn-dropdown>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
            <div v-else class="text-center q-py-xl text-grey-6">
              No registered clinics found.
            </div>
          </q-card-section>
        </q-card>
      </q-tab-panel>

      <!-- Clinics Management Tab (Create & Directory) -->
      <q-tab-panel name="clinics" class="q-pa-none q-gutter-y-lg">
        <div>
          <h1 class="text-h4 font-weight-bold text-slate-800 q-mb-none">Onboard Clinics</h1>
          <p class="text-subtitle2 text-grey-7">Onboard clinics manually and create administrative credentials</p>
        </div>

        <!-- Onboard Clinic & Admin Forms -->
        <div class="row q-col-gutter-lg">
          <!-- Register Clinic -->
          <div class="col-12 col-md-6">
            <q-card flat bordered style="border-radius: 12px; background: #f8fafc; height: 100%;">
              <q-card-section>
                <div class="text-subtitle1 font-weight-bold text-slate-800 q-mb-md">Onboard New Clinic</div>
                <q-form @submit.prevent="submitClinic" class="row q-col-gutter-sm">
                  <div class="col-12 col-sm-6">
                    <q-input v-model="newClinic.name" outlined dense label="Clinic Name" required autocomplete="off" />
                  </div>
                  <div class="col-12 col-sm-3">
                    <q-input v-model="newClinic.city" outlined dense label="City" required autocomplete="off" />
                  </div>
                  <div class="col-12 col-sm-3">
                    <q-input v-model="newClinic.district" outlined dense label="District" required autocomplete="off" />
                  </div>
                  <div class="col-12">
                    <q-input v-model="newClinic.address" outlined dense label="Full Address" required autocomplete="off" />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input v-model="newClinic.phone" outlined dense label="Phone" required autocomplete="off" />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input v-model="newClinic.email" outlined dense type="email" label="Contact Email" required autocomplete="off" />
                  </div>
                  <div class="col-12 text-right q-pt-md">
                    <q-btn unelevated color="primary" type="submit" label="Register Clinic" :loading="submittingClinic" />
                  </div>
                </q-form>
              </q-card-section>
            </q-card>
          </div>

          <!-- Create Admin Form -->
          <div class="col-12 col-md-6">
            <q-card flat bordered style="border-radius: 12px; background: #f8fafc; height: 100%;">
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
                    <q-input v-model="newAdmin.name" outlined dense label="Admin Full Name" required autocomplete="off" />
                  </div>
                  <div class="col-12 col-sm-4">
                    <q-input v-model="newAdmin.email" outlined dense type="email" label="Email Address" required autocomplete="off" />
                  </div>
                  <div class="col-12 col-sm-4">
                    <q-input v-model="newAdmin.password" outlined dense type="password" label="Admin Password" required autocomplete="new-password" />
                  </div>
                  <div class="col-12 col-sm-4">
                    <q-input v-model="newAdmin.phone" outlined dense label="Phone" required autocomplete="off" />
                  </div>
                  <div class="col-12 text-right q-pt-md">
                    <q-btn unelevated color="primary" type="submit" label="Create Admin" :loading="submittingAdmin" />
                  </div>
                </q-form>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Directory list -->
        <q-card flat bordered style="border-radius: 16px;">
          <q-card-section class="text-subtitle1 font-weight-bold text-slate-800">
            Registered Clinics Directory
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pa-none">
            <q-list separator v-if="nonPendingClinics.length > 0">
              <q-item v-for="c in nonPendingClinics" :key="c._id" class="q-py-md">
                <q-item-section>
                  <div class="row items-center q-gutter-x-sm">
                    <span class="text-subtitle1 font-weight-bold text-slate-800">{{ c.name }}</span>
                    <q-chip size="sm" :color="getStatusColor(c.status)" text-color="white" :label="c.status.toUpperCase()" />
                  </div>
                  <q-item-label caption class="q-mt-xs">
                    {{ c.address }}, {{ c.city }}, {{ c.district }} • {{ c.email }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="row items-center q-gutter-sm">
                    <q-btn
                      unelevated
                      color="cyan-8"
                      text-color="white"
                      icon="login"
                      label="Impersonate"
                      size="sm"
                      @click="handleImpersonate(c)"
                      v-if="c.status === 'active'"
                    />
                    <q-btn-dropdown flat dense color="grey-8" icon="more_vert">
                      <q-list style="min-width: 150px;">
                        <q-item clickable v-close-popup @click="changeStatus(c._id, 'active')">
                          <q-item-section>Activate</q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="changeStatus(c._id, 'inactive')">
                          <q-item-section>Deactivate</q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="changeStatus(c._id, 'suspended')">
                          <q-item-section class="text-negative">Suspend</q-item-section>
                        </q-item>
                      </q-list>
                    </q-btn-dropdown>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
            <div v-else class="text-center q-py-xl text-grey-6">
              No registered clinics found.
            </div>
          </q-card-section>
        </q-card>
      </q-tab-panel>

      <!-- System Settings Tab (Maintenance Mode, Billing placeholder) -->
      <q-tab-panel name="settings" class="q-pa-none q-gutter-y-lg">
        <div>
          <h1 class="text-h4 font-weight-bold text-slate-800 q-mb-none">System Settings</h1>
          <p class="text-subtitle2 text-grey-7">Global configuration toggles and system maintenance parameters</p>
        </div>

        <div class="row q-col-gutter-lg">
          <!-- Maintenance mode card -->
          <div class="col-12 col-md-6">
            <q-card flat bordered class="q-pa-md" style="border-radius: 12px; background: #fffdf5; border-color: #fef08a;">
              <div class="row items-center justify-between">
                <div class="row items-center">
                  <q-icon name="warning" color="amber-8" size="32px" class="q-mr-md" />
                  <div>
                    <div class="text-subtitle1 font-weight-bold text-slate-800">Global Maintenance Mode</div>
                    <div class="text-caption text-grey-7">
                      {{ maintenanceMode ? 'ENABLED (Regular patient/staff access blocked)' : 'DISABLED (Platform fully online)' }}
                    </div>
                  </div>
                </div>
                <q-toggle
                  v-model="maintenanceMode"
                  color="amber-8"
                  @update:model-value="toggleMaintenance"
                  :loading="togglingMaintenance"
                  size="lg"
                />
              </div>
            </q-card>
          </div>

          <!-- Subscription module -->
          <div class="col-12">
            <q-card flat bordered style="border-radius: 16px; border-style: dashed; background: #fafafa;">
              <q-card-section class="text-center q-py-xl text-grey-6">
                <q-icon name="subscriptions" size="48px" class="q-mb-sm" />
                <div class="text-subtitle1 font-weight-bold text-slate-800">SaaS Subscriptions & Billing Module</div>
                <p class="text-caption max-width-sm q-mx-auto q-mt-xs" style="max-width: 400px;">
                  Placeholder for V2. System will allow pricing plans, stripe invoice syncing, automatic billing, and clinic subscription gating.
                </p>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useClinics } from '~/composables/useClinics';
import { useAuth } from '~/composables/useAuth';
import { useQuasar } from 'quasar';
import { useDashboardTab } from '~/composables/useDashboardTab';

const $q = useQuasar();
const { clinics, fetchClinics, approveClinic, rejectClinic, updateClinicStatus } = useClinics();
const { impersonate, token, user } = useAuth();
const { activeTab } = useDashboardTab();

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

const pendingClinics = computed(() => clinics.value.filter(c => c.status === 'pending'));
const nonPendingClinics = computed(() => clinics.value.filter(c => c.status !== 'pending'));
const activeClinicsCount = computed(() => clinics.value.filter(c => c.status === 'active').length);
const pendingRequestsCount = computed(() => pendingClinics.value.length);

onMounted(() => {
  if (activeTab.value === 'dashboard' || !['dashboard', 'clinics', 'settings'].includes(activeTab.value)) {
    activeTab.value = 'dashboard';
  }
  loadClinics();
  fetchMaintenanceStatus();
});

const loadClinics = async () => {
  try {
    await fetchClinics();
  } catch (err) {
    console.error(err);
  }
};

const fetchMaintenanceStatus = async () => {
  try {
    const { $api } = useNuxtApp();
    const data = await $api('/settings/maintenance');
    maintenanceMode.value = data ? data.maintenanceMode : false;
  } catch (err) {
    console.error(err);
  }
};

const toggleMaintenance = async (val) => {
  togglingMaintenance.value = true;
  try {
    const { $api } = useNuxtApp();
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
    maintenanceMode.value = !val; // revert
    $q.notify({
      type: 'negative',
      message: err.message || 'Failed to toggle maintenance'
    });
  } finally {
    togglingMaintenance.value = false;
  }
};

const handleApprove = async (id) => {
  try {
    $q.loading.show({ message: 'Approving clinic request...' });
    const res = await approveClinic(id);
    $q.notify({
      type: 'positive',
      message: `Clinic request approved! Created admin user: ${res.admin.email} (Password: ${res.admin.tempPassword})`
    });
    loadClinics();
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.message || 'Approval failed'
    });
  } finally {
    $q.loading.hide();
  }
};

const handleReject = async (id) => {
  try {
    await rejectClinic(id);
    $q.notify({
      type: 'positive',
      message: 'Clinic request has been rejected.'
    });
    loadClinics();
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.message || 'Rejection failed'
    });
  }
};

const changeStatus = async (id, status) => {
  try {
    await updateClinicStatus(id, status);
    $q.notify({
      type: 'positive',
      message: `Clinic status set to ${status}`
    });
    loadClinics();
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.message || 'Status change failed'
    });
  }
};

const handleImpersonate = async (clinic) => {
  try {
    $q.loading.show({ message: `Accessing clinic admin context...` });
    const { $api } = useNuxtApp();
    const userData = await $api('/users', {
      params: { clinicId: clinic._id }
    });
    const clinicAdminUser = (userData.users || []).find(u => u.role === 'clinic_admin');
    if (!clinicAdminUser) {
      $q.notify({
        type: 'warning',
        message: 'No clinic admin user account exists to impersonate.'
      });
      return;
    }

    const originalToken = token.value;
    const originalUser = user.value;

    const data = await impersonate(clinicAdminUser._id);
    
    if (import.meta.client) {
      sessionStorage.setItem('med_admin_original_token', originalToken);
      sessionStorage.setItem('med_admin_original_user', JSON.stringify(originalUser));
    }

    $q.notify({
      type: 'positive',
      message: `Impersonation started: Logging in as ${clinicAdminUser.name}`
    });

    navigateTo('/admin/dashboard');
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.message || 'Impersonation failed'
    });
  } finally {
    $q.loading.hide();
  }
};

const submitClinic = async () => {
  submittingClinic.value = true;
  try {
    const { $api } = useNuxtApp();
    await $api('/clinics', {
      method: 'POST',
      body: newClinic.value
    });

    $q.notify({
      type: 'positive',
      message: 'Clinic onboarded successfully.'
    });

    newClinic.value = { name: '', city: '', district: '', address: '', phone: '', email: '' };
    loadClinics();
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

const submitAdmin = async () => {
  submittingAdmin.value = true;
  try {
    const { $api } = useNuxtApp();
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
    case 'active': return 'green-6';
    case 'inactive': return 'warning';
    case 'suspended': return 'negative';
    case 'rejected': return 'grey-8';
    default: return 'grey';
  }
};
</script>
