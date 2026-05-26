<template>
  <div class="q-gutter-y-lg">
    <div class="row justify-between items-center">
      <div>
        <h1 class="text-h4 font-weight-bold text-slate-800 q-mb-none">Reception Workflow</h1>
        <p class="text-subtitle2 text-grey-7">Patient check-in, lookup, and walk-in scheduling</p>
      </div>
      <q-btn flat icon="refresh" color="primary" label="Reload Ledger" @click="loadAppointments" />
    </div>

    <div class="row q-col-gutter-lg">
      <!-- Left side: Patient Lookup & Booking Desk -->
      <div class="col-12 col-md-5">
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
              type="date"
              outlined
              dense
              label="Appointment Date"
              :min="todayStr"
              required
              @update:model-value="fetchSlots"
            />

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
                    :label="slot.startTime"
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
      </div>

      <!-- Right side: Ledger & Check-in Manager -->
      <div class="col-12 col-md-7">
        <q-card flat bordered style="border-radius: 16px;">
          <q-card-section class="text-subtitle1 font-weight-bold text-slate-800">
            Appointments Ledger
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pa-none">
            <div v-if="appointments.length === 0" class="text-center q-py-xl text-grey-6">
              No appointments recorded for today.
            </div>

            <q-list separator v-else>
              <q-item v-for="app in appointments" :key="app._id" class="q-py-md">
                <q-item-section>
                  <div class="row items-center q-gutter-x-sm">
                    <span class="text-subtitle2 font-weight-bold text-slate-800">{{ app.patientId?.name }}</span>
                    <q-chip size="sm" :color="getAppStatusColor(app.status)" text-color="white" :label="app.status.toUpperCase()" />
                  </div>
                  <q-item-label caption class="q-mt-xs">
                    <strong>Doctor:</strong> Dr. {{ app.doctorId?.name }} ({{ app.doctorId?.specialization }})<br>
                    <strong>Slot:</strong> {{ formatDate(app.date) }} at {{ app.startTime }} - {{ app.endTime }}<br>
                    <strong>Phone:</strong> {{ app.patientId?.phone }}
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
                        <q-item clickable v-close-popup @click="cancelApp(app._id)" class="text-negative">
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
      </div>
    </div>

    <!-- Reschedule Dialog -->
    <q-dialog v-model="rescheduleDialog">
      <q-card style="width: 400px; border-radius: 16px;">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6 font-weight-bold">Reschedule Appointment</div>
        </q-card-section>

        <q-card-section class="q-gutter-y-md q-pt-md">
          <q-input v-model="rescheduleForm.date" type="date" outlined dense label="New Date" />
          <q-input v-model="rescheduleForm.startTime" outlined dense label="New Start Time (HH:MM)" />
        </q-card-section>

        <q-card-actions align="right" class="q-pb-md q-px-md">
          <q-btn flat label="Back" color="grey-7" v-close-popup />
          <q-btn unelevated label="Save Changes" color="primary" @click="submitReschedule" :loading="savingReschedule" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { usePatients } from '~/composables/usePatients';
import { useAppointments } from '~/composables/useAppointments';
import { useDoctors } from '~/composables/useDoctors';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const { patients, searchPatients } = usePatients();
const { appointments, fetchAppointments, createAppointment, cancelAppointment, rescheduleAppointment, checkInAppointment } = useAppointments();
const { fetchDoctors, getAvailableSlots } = useDoctors();

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
const rescheduleForm = ref({
  date: '',
  startTime: ''
});
const savingReschedule = ref(false);

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
    // Fetches doctors tied to the receptionist's clinic (automatic on backend based on token)
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

const cancelApp = async (appId) => {
  try {
    await cancelAppointment(appId);
    $q.notify({
      type: 'positive',
      message: 'Appointment cancelled.'
    });
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

const formatDate = (dateStr) => {
  return new Date(dateStr).toDateString();
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
