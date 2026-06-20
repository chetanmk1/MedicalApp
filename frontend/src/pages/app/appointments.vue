<template>
  <div class="q-gutter-y-lg">
    <div class="row justify-between items-center">
      <div>
        <h1 class="text-h4 font-weight-bold text-slate-800 q-mb-none">My Consultations</h1>
        <p class="text-subtitle2 text-grey-7">Manage your active and historic clinic appointments</p>
      </div>
      <q-btn unelevated color="primary" icon="search" label="Book New Appointment" to="/app" style="border-radius: 8px;" />
    </div>

    <!-- Appointment Ledger -->
    <q-card flat bordered style="border-radius: 16px;">
      <q-card-section class="row justify-between items-center q-pb-none">
        <div class="text-h6 font-weight-bold text-slate-800">Booking History</div>
        <div class="row q-gutter-x-sm items-center">
          <q-select
            v-model="filterStatus"
            :options="[{label: 'All', value: 'all'}, {label: 'Confirmed', value: 'confirmed'}, {label: 'Pending', value: 'pending'}, {label: 'Completed', value: 'completed'}, {label: 'Cancelled', value: 'cancelled'}]"
            dense outlined bg-color="white"
            emit-value map-options
            style="min-width: 130px;"
          />
          <q-input v-model="filterDate" dense outlined bg-color="white" style="max-width: 150px; cursor: pointer;" readonly placeholder="Filter by date">
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer" :color="$q.dark.isActive ? 'grey-3' : 'grey-8'" />
            </template>
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-date v-model="filterDate" mask="YYYY-MM-DD">
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="Close" color="primary" flat />
                </div>
              </q-date>
            </q-popup-proxy>
          </q-input>
          <q-btn v-if="filterDate || filterStatus !== 'all'" outline color="primary" label="Reset" @click="filterDate = ''; filterStatus = 'all'" />
          <q-btn flat icon="refresh" color="grey-6" @click="loadAppointments">
            <q-tooltip>Reload</q-tooltip>
          </q-btn>
        </div>
      </q-card-section>

      <q-card-section>
        <div v-if="loading && appointments.length === 0" class="text-center q-py-xl">
          <q-spinner-dots color="primary" size="40px" />
        </div>

        <div v-else-if="filteredAppointments.length === 0" class="text-center q-py-xl text-grey-6">
          <div v-if="filterDate">No appointments found for the selected date.</div>
          <div v-else>
            <q-icon name="event_busy" size="48px" class="q-mb-md" />
            <div>You have no registered appointments.</div>
            <q-btn outline color="primary" label="Find a Clinic" to="/app" class="q-mt-md" />
          </div>
        </div>

        <div class="relative-position" v-else>
          <q-scroll-area ref="appointmentScrollArea" @scroll="onAppointmentScroll" :style="{ height: 'calc(100vh - 290px)', minHeight: '450px', borderRadius: '12px', backgroundColor: $q.dark.isActive ? '#181818' : '#f8fafc' }">
          <div class="q-pa-md">
            <q-card 
              v-for="app in filteredAppointments" 
              :key="app._id" 
              flat 
              bordered 
              :class="['q-mb-md appointment-card shadow-sm hover-shadow cursor-pointer relative-position transition-all duration-300', $q.dark.isActive ? 'bg-grey-9 text-grey-2' : 'bg-white text-slate-800']"
              :style="{ borderLeft: `5px solid ${getStatusHexColor(app.status)}`, borderRadius: '12px' }"
              v-ripple
              @click="openDetails(app)"
            >
              <q-card-section class="q-pa-md">
                <div class="row items-center justify-between q-col-gutter-y-sm">
                  <!-- Left: Doctor Avatar & Info -->
                  <div class="row items-center col-12 col-sm-6 q-gutter-x-md">
                    <q-avatar color="primary" text-color="white" size="42px" class="font-weight-bold shadow-1">
                      {{ getInitials(app.doctorId?.name) }}
                    </q-avatar>
                    <div>
                      <div :class="['text-subtitle1 font-weight-bold', $q.dark.isActive ? 'text-white' : 'text-slate-900']">Dr. {{ app.doctorId?.name }}</div>
                      <div class="text-caption text-grey-6 row items-center q-gutter-x-xs">
                        <q-icon name="medical_services" size="14px" />
                        <span>{{ app.doctorId?.specialization || 'General' }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Right: Status Badge & Actions -->
                  <div class="row items-center col-12 col-sm-6 justify-end q-gutter-sm">
                    <q-chip 
                      size="sm" 
                      :color="getAppStatusColor(app.status)" 
                      text-color="white" 
                      class="text-weight-bold q-px-md"
                      :label="app.status.toUpperCase().replace('_', ' ')" 
                    />
                    
                    <div class="row items-center q-gutter-xs" v-if="app.status !== 'cancelled' && app.status !== 'completed'">
                      <q-btn outline dense color="primary" icon="calendar_today" label="Reschedule" size="sm" class="q-px-sm" @click.stop="openReschedule(app)" />
                      <q-btn unelevated dense color="negative" icon="cancel" label="Cancel" size="sm" class="q-px-sm" @click.stop="confirmCancelApp(app)" />
                    </div>
                  </div>
                </div>

                <q-separator class="q-my-md" />

                <!-- Details Grid -->
                <div :class="['row q-col-gutter-md', $q.dark.isActive ? 'text-grey-3' : 'text-slate-800']">
                  <div class="col-12 col-sm-4 row items-center q-gutter-x-sm">
                    <q-icon name="local_hospital" size="20px" color="teal-6" />
                    <div>
                      <div class="text-caption text-grey-6">Clinic Location</div>
                      <div class="text-weight-medium">{{ app.clinicId?.name }}</div>
                      <div class="text-caption text-grey-5">{{ app.clinicId?.city }}, {{ app.clinicId?.district }}</div>
                    </div>
                  </div>

                  <div class="col-12 col-sm-4 row items-center q-gutter-x-sm">
                    <q-icon name="schedule" size="20px" color="secondary" />
                    <div>
                      <div class="text-caption text-grey-6">Date & Time Slot</div>
                      <div class="text-weight-medium">{{ formatDate(app.date) }}</div>
                      <div class="text-caption text-secondary text-weight-bold">
                        {{ formatTime(app.startTime) }} - {{ formatTime(app.endTime) }}
                      </div>
                    </div>
                  </div>

                  <div class="col-12 col-sm-4 row items-center q-gutter-x-sm" v-if="app.notes">
                    <q-icon name="assignment" size="20px" color="amber-8" />
                    <div>
                      <div class="text-caption text-grey-6">Visit Reason</div>
                      <div class="text-weight-medium text-italic">"{{ app.notes }}"</div>
                    </div>
                  </div>
                </div>

                <!-- Cancellation Details Banner -->
                <div 
                  v-if="app.status === 'cancelled'" 
                  :class="['q-mt-md q-pa-md border-radius-8 row items-start q-gutter-x-sm', $q.dark.isActive ? 'bg-red-950 text-red-100' : 'bg-red-50 text-red-900']"
                  :style="{ borderRadius: '8px', border: $q.dark.isActive ? '1px solid #7f1d1d' : '1px solid #fecaca' }"
                >
                  <q-icon name="info" size="20px" color="negative" class="q-mt-xs" />
                  <div>
                    <div class="text-weight-bold">Cancellation Audit Details</div>
                    <div class="text-caption">
                      <strong>Cancelled By:</strong> {{ app.cancelledBy?.name || 'Unknown' }} 
                      <span v-if="app.cancelledBy?.role" class="text-weight-medium">({{ app.cancelledBy.role.replace('_', ' ') }})</span>
                    </div>
                    <div class="text-caption">
                      <strong>Reason:</strong> {{ app.cancellationReason || 'No reason provided.' }}
                    </div>
                  </div>
                </div>

              </q-card-section>
            </q-card>
          </div>
          </q-scroll-area>
          
          <transition appear enter-active-class="animated fadeIn" leave-active-class="animated fadeOut">
            <q-btn
              v-show="showScrollTop"
              round
              size="md"
              icon="keyboard_arrow_up"
              color="primary"
              class="absolute-bottom-right shadow-10 transition-all"
              style="z-index: 10; margin: 0 24px 24px 0;"
              @click="scrollToTop"
            >
              <q-tooltip class="bg-primary text-body2 shadow-4" :offset="[10, 10]">Scroll to top</q-tooltip>
            </q-btn>
          </transition>
        </div>
      </q-card-section>
    </q-card>

    <!-- Reschedule Wizard Dialog -->
    <q-dialog v-model="rescheduleDialog" max-width="500px">
      <q-card style="width: 500px; border-radius: 16px;">
        <q-card-section class="bg-primary text-white row items-center">
          <div class="text-h6">Reschedule Consultation</div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-card-section class="q-gutter-y-md q-pt-md">
          <div v-if="targetApp">
            <p class="q-mb-xs">Rescheduling consultation with <strong>Dr. {{ targetApp.doctorId?.name }}</strong>.</p>
            <p class="text-caption text-grey-7">Current Slot: {{ formatDate(targetApp.date) }} at {{ formatTime(targetApp.startTime) }}</p>
          </div>

          <!-- Date Selector -->
          <q-input
            v-model="rescheduleDate"
            outlined
            dense
            label="Pick New Date"
            readonly
            :min="todayStr"
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer" />
            </template>
            <q-popup-proxy transition-show="scale" transition-hide="scale" :breakpoint="9999">
              <q-date v-model="rescheduleDate" mask="YYYY-MM-DD" @update:model-value="fetchSlots" :options="(date) => date >= todayStr.replace(/-/g, '/')" class="full-width">
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="Close" color="primary" flat />
                </div>
              </q-date>
            </q-popup-proxy>
          </q-input>

          <!-- Slots Ledger -->
          <div>
            <div class="text-subtitle2 font-weight-bold q-mb-sm">Available Slots</div>

            <div v-if="loadingSlots" class="text-center q-py-md">
              <q-spinner-dots color="primary" size="30px" />
            </div>

            <div v-else-if="slots.length === 0" class="text-center q-py-md text-grey-6">
              No available shifts configured for this date.
            </div>

            <div v-else class="row q-col-gutter-xs">
              <div v-for="slot in slots" :key="slot.startTime" class="col-4">
                <q-btn
                  outline
                  dense
                  no-caps
                  class="full-width"
                  :color="selectedSlot?.startTime === slot.startTime ? 'secondary' : (slot.available ? 'primary' : 'grey-5')"
                  :disable="!slot.available"
                  :label="formatTime(slot.startTime)"
                  @click="selectSlot(slot)"
                />
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pb-md q-px-md">
          <q-btn flat label="Cancel" color="grey-8" v-close-popup />
          <q-btn unelevated label="Confirm Reschedule" color="primary" @click="submitReschedule" :loading="savingReschedule" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Appointment Details Dialog -->
    <q-dialog v-model="detailsDialog">
      <q-card style="width: 650px; max-width: 95vw; border-radius: 16px;">
        <q-card-section class="bg-primary text-white row justify-between items-center">
          <div class="text-h6 font-weight-bold">Appointment Details</div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        
        <q-card-section class="q-pt-lg" v-if="selectedApp">
          <div class="row items-center q-mb-md">
            <q-avatar size="64px" color="indigo-1" text-color="primary" class="q-mr-md font-weight-bold" style="font-size: 24px;">
              {{ selectedApp.doctorId?.name ? selectedApp.doctorId.name.charAt(0).toUpperCase() : '?' }}
            </q-avatar>
            <div>
              <div class="text-h6 font-weight-bold text-slate-800">Dr. {{ selectedApp.doctorId?.name || 'Unknown Doctor' }}</div>
              <q-chip size="sm" :color="getAppStatusColor(selectedApp.status)" text-color="white" :label="selectedApp.status.toUpperCase()" class="q-ma-none" />
            </div>
          </div>
          
          <q-separator class="q-my-md" />
          
          <div class="q-gutter-y-md">
            <div class="row q-pb-sm" style="border-bottom: 1px solid #e2e8f0;">
              <div class="col-4 text-grey-7 font-weight-bold">Doctor:</div>
              <div class="col-8 text-slate-800 font-weight-bold">Dr. {{ selectedApp.doctorId?.name }} ({{ selectedApp.doctorId?.specialization }})</div>
            </div>

            <div class="row q-pb-sm" style="border-bottom: 1px solid #e2e8f0;">
              <div class="col-4 text-grey-7 font-weight-bold">Clinic:</div>
              <div class="col-8 text-slate-800">{{ selectedApp.clinicId?.name }} ({{ selectedApp.clinicId?.city }}, {{ selectedApp.clinicId?.district }})</div>
            </div>

            <div class="row q-pb-sm" style="border-bottom: 1px solid #e2e8f0;">
              <div class="col-4 text-grey-7 font-weight-bold">Date & Time:</div>
              <div class="col-8 text-slate-800">
                {{ formatDate(selectedApp.date) }}<br/>
                {{ formatTime(selectedApp.startTime) }} - {{ formatTime(selectedApp.endTime) }}
              </div>
            </div>

            <div class="row" :class="{'q-pb-sm': selectedApp.status === 'cancelled', 'border-bottom': selectedApp.status === 'cancelled'}" :style="selectedApp.status === 'cancelled' ? 'border-bottom: 1px solid #e2e8f0;' : ''">
              <div class="col-4 text-grey-7 font-weight-bold">Visit Reason:</div>
              <div class="col-8 text-slate-800">{{ selectedApp.notes || 'Not provided' }}</div>
            </div>

            <template v-if="selectedApp.status === 'cancelled'">
              <div class="row q-pb-sm q-pt-sm" style="border-bottom: 1px solid #e2e8f0;">
                <div class="col-4 text-negative font-weight-bold">Cancelled By:</div>
                <div class="col-8 text-negative font-weight-bold">
                  {{ selectedApp.cancelledBy?.name || 'Unknown' }}
                  <span v-if="selectedApp.cancelledBy?.role">({{ selectedApp.cancelledBy.role }})</span>
                </div>
              </div>
              <div class="row q-pt-sm">
                <div class="col-4 text-negative font-weight-bold">Cancel Reason:</div>
                <div class="col-8 text-negative">{{ selectedApp.cancellationReason || 'Not provided' }}</div>
              </div>
            </template>
          </div>
        </q-card-section>
        
        <q-card-actions align="right" class="q-pa-md">
          <q-btn v-if="selectedApp && selectedApp.status !== 'cancelled' && selectedApp.status !== 'completed'" outline color="primary" label="Reschedule" @click="openReschedule(selectedApp)" />
          <q-btn v-if="selectedApp && selectedApp.status !== 'cancelled' && selectedApp.status !== 'completed'" unelevated color="negative" label="Cancel Appointment" @click="confirmCancelApp(selectedApp)" />
          <q-btn unelevated color="primary" label="Close" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Cancellation Dialog -->
    <q-dialog v-model="cancelDialog">
      <q-card style="width: 550px; max-width: 95vw; border-radius: 16px;">
        <q-card-section class="bg-negative text-white row justify-between items-center">
          <div class="text-h6 font-weight-bold">Cancel Appointment</div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-md" v-if="appToCancel">
          <div class="q-mb-md text-slate-800" style="font-size: 15px;">
            Are you sure you want to cancel your appointment with <strong class="text-primary">Dr. {{ appToCancel.doctorId?.name || 'Unknown' }}</strong> on <strong>{{ formatDate(appToCancel.date) }}</strong> at <strong>{{ formatTime(appToCancel.startTime) }}</strong>?
          </div>
          <q-input v-model="cancelReason" filled autogrow label="Reason for cancellation (Optional)" :rules="[val => !!val || 'Reason is required to cancel']" />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Keep Appointment" color="grey-7" v-close-popup />
          <q-btn unelevated color="negative" label="Confirm Cancellation" @click="submitCancelApp" :disable="!cancelReason || !cancelReason.trim()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAppointments } from '~/composables/useAppointments';
import { useDoctors } from '~/composables/useDoctors';
import { useQuasar } from 'quasar';
import { useFormat } from '~/composables/useFormat';

const { formatDate, formatTime, formatDateWithDay } = useFormat();

definePageMeta({
  role: 'patient'
});

const $q = useQuasar();
const { appointments, loading, fetchAppointments, cancelAppointment, rescheduleAppointment } = useAppointments();
const { getAvailableSlots } = useDoctors();

// Reschedule dialog states
const rescheduleDialog = ref(false);
const targetApp = ref(null);
const rescheduleDate = ref('');
const slots = ref([]);
const loadingSlots = ref(false);
const selectedSlot = ref(null);
const savingReschedule = ref(false);

const cancelDialog = ref(false);
const cancelReason = ref('');
const appToCancel = ref(null);

const filterDate = ref('');
const filterStatus = ref('all');

const detailsDialog = ref(false);
const selectedApp = ref(null);

const appointmentScrollArea = ref(null);
const showScrollTop = ref(false);

const onAppointmentScroll = (info) => {
  showScrollTop.value = info.verticalPosition > 200;
};

const scrollToTop = () => {
  if (appointmentScrollArea.value) {
    appointmentScrollArea.value.setScrollPosition('vertical', 0, 300);
  }
};

const openDetails = (app) => {
  selectedApp.value = app;
  detailsDialog.value = true;
};

const filteredAppointments = computed(() => {
  let list = [...appointments.value];
  if (filterDate.value) {
    const filterParts = filterDate.value.split(/[-/]/);
    const filterYear = parseInt(filterParts[0]);
    const filterMonth = parseInt(filterParts[1]) - 1;
    const filterDay = parseInt(filterParts[2]);
    
    list = list.filter(app => {
      if (!app.date) return false;
      const d = new Date(app.date);
      return d.getFullYear() === filterYear && d.getMonth() === filterMonth && d.getDate() === filterDay;
    });
  }
  if (filterStatus.value !== 'all') {
    list = list.filter(app => app.status === filterStatus.value);
  }
  list.sort((a, b) => new Date(a.date) - new Date(b.date));
  return list;
});

const todayStr = computed(() => {
  return new Date().toISOString().split('T')[0];
});

onMounted(() => {
  loadAppointments();
});

const loadAppointments = async () => {
  try {
    await fetchAppointments();
  } catch (err) {
    console.error('Fetch appointments failed:', err);
  }
};

const confirmCancelApp = (app) => {
  appToCancel.value = app;
  cancelReason.value = '';
  cancelDialog.value = true;
};

const submitCancelApp = async () => {
  if (!cancelReason.value.trim() || !appToCancel.value) return;
  try {
    await cancelAppointment(appToCancel.value._id, cancelReason.value.trim());
    $q.notify({
      type: 'positive',
      message: 'Your appointment was cancelled. Clinic notified.'
    });
    cancelDialog.value = false;
    cancelReason.value = '';
    appToCancel.value = null;
    loadAppointments();
  } catch (err) {
    console.error('Cancel failed:', err);
    $q.notify({
      type: 'negative',
      message: err.message || 'Failed to cancel appointment'
    });
  }
};

const openReschedule = (app) => {
  targetApp.value = app;
  rescheduleDate.value = new Date(app.date).toISOString().split('T')[0];
  selectedSlot.value = null;
  slots.value = [];
  rescheduleDialog.value = true;
  fetchSlots();
};

const fetchSlots = async () => {
  if (!targetApp.value || !rescheduleDate.value) return;
  loadingSlots.value = true;
  selectedSlot.value = null;
  try {
    slots.value = await getAvailableSlots(targetApp.value.doctorId._id, rescheduleDate.value);
  } catch (err) {
    console.error('Fetch slots failed:', err);
  } finally {
    loadingSlots.value = false;
  }
};

const selectSlot = (slot) => {
  selectedSlot.value = slot;
};

const submitReschedule = async () => {
  if (!targetApp.value || !selectedSlot.value) return;
  savingReschedule.value = true;
  try {
    await rescheduleAppointment(targetApp.value._id, rescheduleDate.value, selectedSlot.value.startTime);

    $q.notify({
      type: 'positive',
      message: 'Consultation rescheduled successfully! Email updates sent.'
    });

    rescheduleDialog.value = false;
    loadAppointments();
  } catch (err) {
    console.error('Reschedule failed:', err);
    $q.notify({
      type: 'negative',
      message: err.message || 'Rescheduling slot is unavailable'
    });
  } finally {
    savingReschedule.value = false;
  }
};



const getAppStatusColor = (status) => {
  switch (status) {
    case 'confirmed': return 'green-6';
    case 'checked_in': return 'teal-6';
    case 'pending': return 'orange-6';
    case 'completed': return 'blue-6';
    case 'cancelled': return 'red-6';
    default: return 'grey';
  }
};

const getStatusHexColor = (status) => {
  switch (status) {
    case 'confirmed': return '#10b981';
    case 'checked_in': return '#0d9488';
    case 'pending': return '#f97316';
    case 'completed': return '#3b82f6';
    case 'cancelled': return '#ef4444';
    default: return '#9ca3af';
  }
};

const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name[0].toUpperCase();
};
</script>
