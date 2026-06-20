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
          <q-input v-model="filterDate" dense outlined bg-color="white" style="max-width: 200px; cursor: pointer;" readonly placeholder="Filter by date (All)">
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
          <q-btn v-if="filterDate" outline color="primary" label="Reset" @click="filterDate = ''" />
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

        <q-list v-else separator>
          <q-item v-for="app in filteredAppointments" :key="app._id" class="q-py-md q-px-none">
            <q-item-section>
              <div class="row items-center q-gutter-x-sm">
                <span class="text-subtitle2 font-weight-bold text-slate-800">Dr. {{ app.doctorId?.name }}</span>
                <q-chip size="sm" :color="getAppStatusColor(app.status)" text-color="white" :label="app.status.toUpperCase()" />
              </div>
              <q-item-label caption class="q-mt-xs">
                <span><strong>Specialization:</strong> {{ app.doctorId?.specialization }}</span>
                <br />
                <span><strong>Clinic:</strong> {{ app.clinicId?.name }} ({{ app.clinicId?.city }}, {{ app.clinicId?.district }})</span>
                <br />
                <span><strong>Time:</strong> {{ formatDate(app.date) }} at {{ formatTime(app.startTime) }} - {{ formatTime(app.endTime) }}</span>
                <br v-if="app.notes" />
                <span v-if="app.notes"><strong>Visit Reason:</strong> {{ app.notes }}</span>
                <template v-if="app.status === 'cancelled'">
                  <br />
                  <span class="text-negative">
                    <strong>Cancelled By:</strong> {{ app.cancelledBy?.name || 'Unknown' }}
                    <span v-if="app.cancelledBy?.role">({{ app.cancelledBy.role }})</span>
                  </span>
                  <br />
                  <span class="text-negative"><strong>Cancel Reason:</strong> {{ app.cancellationReason || 'Not provided' }}</span>
                </template>
              </q-item-label>
            </q-item-section>

            <q-item-section side v-if="app.status !== 'cancelled' && app.status !== 'completed'">
              <div class="row items-center q-gutter-sm">
                <q-btn outline color="grey-8" icon="edit_calendar" label="Reschedule" size="sm" @click="openReschedule(app)" />
                <q-btn unelevated color="negative" label="Cancel" size="sm" @click="confirmCancelApp(app)" />
              </div>
            </q-item-section>
          </q-item>
        </q-list>
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

    <!-- Cancellation Dialog -->
    <q-dialog v-model="cancelDialog">
      <q-card style="width: 550px; max-width: 95vw; border-radius: 16px;">
        <q-card-section class="bg-negative text-white row justify-between items-center">
          <div class="text-h6 font-weight-bold">Cancel Appointment</div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-md" v-if="appToCancel">
          <div class="q-mb-md text-slate-800" style="font-size: 15px;">
            Are you sure you want to cancel the appointment with <strong class="text-primary">Dr. {{ appToCancel.doctorId?.name || 'Doctor' }}</strong> on <strong>{{ formatDateWithDay(appToCancel.date) }}</strong> at <strong>{{ formatTime(appToCancel.startTime) }}</strong>?
          </div>
          
          <q-input
            v-model="cancelReason"
            type="textarea"
            outlined
            bg-color="white"
            label="Reason for Cancellation (Required)"
            :rules="[val => !!val || 'Reason is required']"
            class="q-mt-md"
            rows="3"
            placeholder="e.g. Schedule conflict, feeling better, etc."
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md bg-grey-1">
          <q-btn flat label="Keep Appointment" color="grey-8" v-close-popup />
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
</script>
