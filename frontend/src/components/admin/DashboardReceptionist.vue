<template>
  <div class="q-gutter-y-lg">
    <div class="row justify-between items-center">
      <div>
        <h1 class="text-h4 font-weight-bold text-slate-800 q-mb-none">Reception Workflow</h1>
        <p class="text-subtitle2 text-grey-7">Patient check-in, lookup, and walk-in scheduling</p>
      </div>
      <q-btn flat icon="refresh" color="primary" label="Reload Ledger" @click="loadAppointments" />
    </div>

    <!-- Tab Panels for Receptionist -->
    <q-tab-panels v-model="tab" animated class="bg-transparent" style="overflow: visible;">
      <!-- Patient Lookup & Ledger Tab -->
      <q-tab-panel name="lookup" class="q-pa-none">
        <q-card flat bordered style="border-radius: 16px;">
          <q-card-section class="row justify-between items-center text-subtitle1 font-weight-bold text-slate-800">
            <div>Appointments Ledger</div>
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
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pa-none">
            <div v-if="filteredAppointments.length === 0" class="text-center q-py-xl text-grey-6">
              <div v-if="filterDate">No appointments found for the selected date.</div>
              <div v-else>No appointments recorded.</div>
            </div>

            <q-list separator v-else style="border-radius: 12px;">
              <q-item v-for="app in filteredAppointments" :key="app._id" class="q-py-md">
                <q-item-section>
                  <div class="row items-center q-gutter-x-sm">
                    <span class="text-subtitle2 font-weight-bold text-slate-800">{{ app.patientId?.name }}</span>
                    <q-chip size="sm" :color="getAppStatusColor(app.status)" text-color="white" :label="app.status.toUpperCase()" />
                  </div>
                  <q-item-label caption class="q-mt-xs">
                    <strong>Doctor:</strong> Dr. {{ app.doctorId?.name }} ({{ app.doctorId?.specialization }})<br>
                    <strong>Slot:</strong> {{ formatDate(app.date) }} at {{ formatTime(app.startTime) }} - {{ formatTime(app.endTime) }}<br>
                    <strong>Phone:</strong> {{ app.patientId?.phone }}
                    <template v-if="app.notes">
                      <br><strong>Visit Reason:</strong> {{ app.notes }}
                    </template>
                    <template v-if="app.status === 'cancelled'">
                      <br>
                      <span class="text-negative">
                        <strong>Cancelled By:</strong> {{ app.cancelledBy?.name || 'Unknown' }}
                        <span v-if="app.cancelledBy?.role">({{ app.cancelledBy.role }})</span>
                      </span>
                      <br>
                      <span class="text-negative"><strong>Cancel Reason:</strong> {{ app.cancellationReason || 'Not provided' }}</span>
                    </template>
                  </q-item-label>
                </q-item-section>

                <q-item-section side>
                  <div class="row items-center q-gutter-sm">
                    <!-- Check-in Management -->
                    <q-btn
                      unelevated
                      color="teal-8"
                      label="Check In"
                      size="sm"
                      @click="handleCheckIn(app._id)"
                      v-if="app.status === 'confirmed'"
                    />
                    
                    <q-btn-dropdown flat dense color="grey-8" icon="more_vert">
                      <q-list style="min-width: 150px;">
                        <q-item clickable v-close-popup @click="openReschedule(app)">
                          <q-item-section>Reschedule</q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="confirmCancelApp(app)" class="text-negative">
                          <q-item-section>Cancel</q-item-section>
                        </q-item>
                      </q-list>
                    </q-btn-dropdown>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </q-tab-panel>

      <!-- Walk-in Booking Tab -->
      <q-tab-panel name="booking" class="q-pa-none">
        <q-card flat bordered style="border-radius: 16px;" class="q-pa-md glass-card">
          <q-card-section class="q-pb-none">
            <div class="text-h6 font-weight-bold text-slate-800">Walk-in Booking Desk</div>
            <div class="text-caption text-grey-6 q-mb-md">Search patient and schedule a new appointment</div>
            
            <!-- Patient Search -->
            <div class="row q-col-gutter-xs">
              <div class="col-9">
                <q-input
                  v-model="searchQuery"
                  outlined
                  dense
                  placeholder="Search by patient name/email/phone..."
                  @keyup.enter="handleSearch"
                />
              </div>
              <div class="col-3">
                <q-btn unelevated color="primary" label="Search" class="full-width" @click="handleSearch" :loading="searching" />
              </div>
            </div>
          </q-card-section>

          <!-- Search Results -->
          <q-card-section v-if="patients.length > 0">
            <div class="text-subtitle2 font-weight-bold text-slate-800 q-mb-xs">Matches Found:</div>
            <q-list bordered separator style="border-radius: 8px;">
              <q-item
                v-for="p in patients"
                :key="p._id"
                clickable
                @click="selectPatient(p)"
                :active="selectedPatient?._id === p._id"
                active-class="bg-indigo-1"
              >
                <q-item-section>
                  <q-item-label class="font-weight-bold">{{ p.name }}</q-item-label>
                  <q-item-label caption>{{ p.phone }} • {{ p.email }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>

          <!-- Booking Details Form -->
          <q-card-section v-if="selectedPatient" class="q-gutter-y-md border-top q-mt-md">
            <div class="bg-indigo-0 q-pa-sm rounded row items-center justify-between">
              <div>
                <div class="text-caption text-grey-7">Selected Patient:</div>
                <div class="text-subtitle2 font-weight-bold text-indigo-9">{{ selectedPatient.name }}</div>
              </div>
              <q-btn flat round dense icon="close" color="grey-6" @click="selectedPatient = null" />
            </div>

            <!-- Doctor Selector -->
            <q-select
              v-model="bookingForm.doctorId"
              outlined
              dense
              emit-value
              map-options
              :options="doctorOptions"
              label="Select Doctor"
              required
              @update:model-value="fetchSlots"
            />

            <!-- Date Selector -->
            <q-input
              v-model="bookingForm.date"
              outlined
              dense
              label="Appointment Date"
              readonly
              :min="todayStr"
              required
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer" />
              </template>
              <q-popup-proxy transition-show="scale" transition-hide="scale" :breakpoint="9999">
                <q-date v-model="bookingForm.date" mask="YYYY-MM-DD" @update:model-value="fetchSlots" :options="(date) => date >= todayStr.replace(/-/g, '/')" class="full-width">
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="Close" color="primary" flat />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-input>

            <!-- Slots Picker -->
            <div v-if="bookingForm.doctorId && bookingForm.date">
              <div class="text-subtitle2 font-weight-bold q-mb-xs">Select Time Slot</div>
              <div v-if="loadingSlots" class="text-center q-py-sm">
                <q-spinner-dots color="primary" size="20px" />
              </div>
              <div v-else-if="slots.length === 0" class="text-center q-py-sm text-grey-6 text-caption">
                No slots available on this date.
              </div>
              <div v-else class="row q-col-gutter-xs">
                <div v-for="slot in slots" :key="slot.startTime" class="col-4">
                  <q-btn
                    outline
                    dense
                    no-caps
                    class="full-width"
                    :color="bookingForm.startTime === slot.startTime ? 'secondary' : (slot.available ? 'primary' : 'grey-5')"
                    :disable="!slot.available"
                    :label="formatTime(slot.startTime)"
                    @click="bookingForm.startTime = slot.startTime"
                  />
                </div>
              </div>
            </div>

            <q-input
              v-model="bookingForm.notes"
              outlined
              dense
              type="textarea"
              label="Consultation Notes / Reason (Optional)"
              rows="2"
            />

            <q-btn
              unelevated
              color="positive"
              label="Submit Walk-in Booking"
              class="full-width font-weight-bold"
              :disable="!bookingForm.doctorId || !bookingForm.date || !bookingForm.startTime"
              :loading="submittingBooking"
              @click="submitBooking"
            />
          </q-card-section>
        </q-card>
      </q-tab-panel>
    </q-tab-panels>

    <!-- Reschedule Dialog -->
    <q-dialog v-model="rescheduleDialog">
      <q-card style="width: 400px; border-radius: 16px;">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6 font-weight-bold">Reschedule Appointment</div>
        </q-card-section>

        <q-card-section class="q-gutter-y-md q-pt-md">
          <q-input v-model="rescheduleForm.date" outlined dense label="New Date" readonly>
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer" />
            </template>
            <q-popup-proxy transition-show="scale" transition-hide="scale" :breakpoint="9999">
              <q-date v-model="rescheduleForm.date" mask="YYYY-MM-DD" class="full-width">
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="Close" color="primary" flat />
                </div>
              </q-date>
            </q-popup-proxy>
          </q-input>
          <q-input v-model="rescheduleForm.startTime" outlined dense label="New Start Time (HH:MM)" />
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md bg-grey-1">
            <q-btn flat label="Cancel" color="grey-8" v-close-popup />
            <q-btn unelevated color="primary" label="Save Changes" @click="submitReschedule" :loading="savingReschedule" />
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
              Are you sure you want to cancel the appointment for <strong class="text-primary">{{ appToCancel.patientId?.name || 'Unknown Patient' }}</strong> on <strong>{{ formatDateWithDay(appToCancel.date) }}</strong> at <strong>{{ formatTime(appToCancel.startTime) }}</strong>?
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
              placeholder="e.g. Patient requested, Doctor unavailable, etc."
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
import { ref, onMounted, computed, watch } from 'vue';
import { usePatients } from '~/composables/usePatients';
import { useAppointments } from '~/composables/useAppointments';
import { useDoctors } from '~/composables/useDoctors';
import { useQuasar } from 'quasar';
import { useDashboardTab } from '~/composables/useDashboardTab';
import { useFormat } from '~/composables/useFormat';

const $q = useQuasar();
const { patients, searchPatients } = usePatients();
const { appointments, fetchAppointments, createAppointment, cancelAppointment, rescheduleAppointment, checkInAppointment } = useAppointments();
const { fetchDoctors, getAvailableSlots } = useDoctors();
const { formatDate, formatTime, formatDateWithDay } = useFormat();

const { activeTab: tab } = useDashboardTab();

watch(tab, (newVal) => {
  if (newVal === 'dashboard') {
    tab.value = 'lookup';
  }
});

const searchQuery = ref('');
const searching = ref(false);
const selectedPatient = ref(null);

const doctors = ref([]);
const slots = ref([]);
const loadingSlots = ref(false);

const bookingForm = ref({
  doctorId: '',
  date: '',
  startTime: '',
  notes: ''
});
const submittingBooking = ref(false);

// Reschedule Dialog State
const rescheduleDialog = ref(false);
const rescheduleAppId = ref(null);
const rescheduleForm = ref({ date: '', startTime: '' });
const savingReschedule = ref(false);

const cancelDialog = ref(false);
const cancelReason = ref('');
const appToCancel = ref(null);

const filterDate = ref('');

const filteredAppointments = computed(() => {
  let list = [...appointments.value];
  if (filterDate.value) {
    const filterParts = filterDate.value.split('-');
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

const doctorOptions = computed(() => {
  return doctors.value.map(d => ({
    label: `Dr. ${d.name} (${d.specialization})`,
    value: d._id
  }));
});

onMounted(() => {
  if (tab.value === 'dashboard' || !['lookup', 'booking'].includes(tab.value)) {
    tab.value = 'lookup';
  }
  loadAppointments();
  loadClinicDoctors();
});

const loadAppointments = async () => {
  try {
    await fetchAppointments();
  } catch (err) {
    console.error(err);
  }
};

const loadClinicDoctors = async () => {
  try {
    doctors.value = await fetchDoctors();
  } catch (err) {
    console.error(err);
  }
};

const handleSearch = async () => {
  if (!searchQuery.value) return;
  searching.value = true;
  selectedPatient.value = null;
  try {
    await searchPatients(searchQuery.value);
    if (patients.value.length === 0) {
      $q.notify({
        type: 'warning',
        message: 'No patients found matching query.'
      });
    }
  } catch (err) {
    console.error(err);
  } finally {
    searching.value = false;
  }
};

const selectPatient = (p) => {
  selectedPatient.value = p;
  bookingForm.value = {
    doctorId: '',
    date: todayStr.value,
    startTime: '',
    notes: ''
  };
  slots.value = [];
};

const fetchSlots = async () => {
  if (!bookingForm.value.doctorId || !bookingForm.value.date) return;
  loadingSlots.value = true;
  bookingForm.value.startTime = '';
  try {
    slots.value = await getAvailableSlots(bookingForm.value.doctorId, bookingForm.value.date);
  } catch (err) {
    console.error(err);
  } finally {
    loadingSlots.value = false;
  }
};

const submitBooking = async () => {
  if (!selectedPatient.value || !bookingForm.value.doctorId) return;
  submittingBooking.value = true;
  try {
    await createAppointment({
      patientId: selectedPatient.value._id,
      doctorId: bookingForm.value.doctorId,
      date: bookingForm.value.date,
      startTime: bookingForm.value.startTime,
      notes: bookingForm.value.notes
    });
    $q.notify({
      type: 'positive',
      message: 'Walk-in booking created successfully!'
    });
    selectedPatient.value = null;
    searchQuery.value = '';
    patients.value = [];
    loadAppointments();
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.message || 'Failed to book appointment'
    });
  } finally {
    submittingBooking.value = false;
  }
};

const handleCheckIn = async (appId) => {
  try {
    await checkInAppointment(appId);
    $q.notify({
      type: 'positive',
      message: 'Patient marked as checked in.'
    });
    loadAppointments();
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.message || 'Check-in failed'
    });
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
      message: 'Appointment cancelled.'
    });
    cancelDialog.value = false;
    cancelReason.value = '';
    appToCancel.value = null;
    loadAppointments();
  } catch (err) {
    console.error(err);
  }
};

const openReschedule = (app) => {
  rescheduleAppId.value = app._id;
  rescheduleForm.value = {
    date: new Date(app.date).toISOString().split('T')[0],
    startTime: app.startTime
  };
  rescheduleDialog.value = true;
};

const submitReschedule = async () => {
  savingReschedule.value = true;
  try {
    await rescheduleAppointment(rescheduleAppId.value, rescheduleForm.value.date, rescheduleForm.value.startTime);
    $q.notify({
      type: 'positive',
      message: 'Appointment rescheduled.'
    });
    rescheduleDialog.value = false;
    loadAppointments();
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.message || 'Rescheduling failed'
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
