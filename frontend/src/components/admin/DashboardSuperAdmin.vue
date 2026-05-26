<template>
  <div class="q-gutter-y-lg">
    <!-- Maintenance and Stats Header -->
    <div class="row q-col-gutter-md">
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

      <!-- Stats Cards -->
      <div class="col-12 col-md-6">
        <div class="row q-col-gutter-sm">
          <div class="col-6">
            <q-card flat bordered class="text-center q-pa-sm" style="border-radius: 12px;">
              <div class="text-grey-6 text-caption">Active Clinics</div>
              <div class="text-h5 font-weight-bold text-indigo-9">{{ activeClinicsCount }}</div>
            </q-card>
          </div>
          <div class="col-6">
            <q-card flat bordered class="text-center q-pa-sm" style="border-radius: 12px;">
              <div class="text-grey-6 text-caption">Pending Requests</div>
              <div class="text-h5 font-weight-bold text-amber-9">{{ pendingRequestsCount }}</div>
            </q-card>
          </div>
        </div>
      </div>
    </div>

    <!-- Onboarding Approvals -->
    <q-card flat bordered style="border-radius: 16px;">
      <q-card-section class="bg-indigo-0 text-slate-800 row justify-between items-center">
        <div class="text-h6 font-weight-bold row items-center">
          <q-icon name="fact_check" class="q-mr-sm text-primary" />
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
              <q-item-label caption>
                <div><strong>Location:</strong> {{ c.address }}, {{ c.city }}, {{ c.district }}</div>
                <div><strong>Contact:</strong> {{ c.email }} • {{ c.phone }}</div>
                <div class="text-primary">
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

    <!-- Clinic Directory Management -->
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
              <q-item-label caption>
                {{ c.address }}, {{ c.city }}, {{ c.district }} • {{ c.email }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="row items-center q-gutter-sm">
                <!-- Impersonation Trigger -->
                <q-btn
                  unelevated
                  color="cyan-8"
                  text-color="white"
                  icon="login"
                  label="Impersonate Admin"
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

    <!-- Subscription Module Placeholder -->
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
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useClinics } from '~/composables/useClinics';
import { useAuth } from '~/composables/useAuth';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const { clinics, fetchClinics, approveClinic, rejectClinic, updateClinicStatus } = useClinics();
const { impersonate, token, user } = useAuth();

const maintenanceMode = ref(false);
const togglingMaintenance = ref(false);

const pendingClinics = computed(() => clinics.value.filter(c => c.status === 'pending'));
const nonPendingClinics = computed(() => clinics.value.filter(c => c.status !== 'pending'));
const activeClinicsCount = computed(() => clinics.value.filter(c => c.status === 'active').length);
const pendingRequestsCount = computed(() => pendingClinics.value.length);

onMounted(() => {
  loadClinics();
  fetchMaintenanceStatus();
});

const loadClinics = async () => {
  try {
    // Super admins fetch all clinics by supplying no params or passing isSuperAdmin context
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
    // First lookup user by email to get user id
    const { $api } = useNuxtApp();
    const userData = await $api('/users', {
      params: { clinicId: clinic._id }
    });
    // Find the clinic admin user
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
    
    // Save original token for rollback
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
