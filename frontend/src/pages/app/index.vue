<template>
  <div class="q-gutter-y-xl">
    <!-- Hero Section -->
    <div class="text-center q-py-lg">
      <h1 class="text-h3 font-weight-bold text-slate-800 q-mb-md" style="font-size: 3rem; font-weight: 800; letter-spacing: -1px; line-height: 1.1;">
        Book Your <span class="text-gradient">Doctor Appointment</span> Instantly
      </h1>
      <p class="text-subtitle1 text-grey-7 max-width-md q-mx-auto" style="font-size: 1.1rem; max-width: 600px;">
        Search clinics, filter doctors by specialization, view real-time slot availability, and book appointments securely.
      </p>
    </div>

    <!-- Search Section -->
    <div class="glass-card q-pa-lg">
      <div class="row q-col-gutter-md items-center">
        <div class="col-12 col-sm-10">
          <q-input
            v-model="searchClinicName"
            outlined
            dense
            label="Search by Clinic Name"
            color="primary"
            @keyup.enter="fetchClinics"
            @clear="fetchClinics"
            @update:model-value="(val) => !val && fetchClinics()"
            clearable
          >
            <template v-slot:prepend>
              <q-icon name="local_hospital" color="grey-6" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-sm-2">
          <q-btn
            unelevated
            color="primary"
            icon="search"
            label="Search"
            class="full-width q-py-sm"
            @click="fetchClinics"
            style="border-radius: 8px;"
          />
        </div>
      </div>
    </div>

    <!-- Main Content Row -->
    <div v-if="!selectedClinic" class="q-pt-md">
      <div class="row justify-between items-center q-mb-lg">
        <div class="text-h5 font-weight-bold text-slate-800">
          Available Clinics
        </div>
        <q-chip color="primary" text-color="white" :label="clinics.length + ' found'" class="font-weight-bold" />
      </div>

      <!-- Skeletons -->
      <div v-if="loadingClinics" class="row q-col-gutter-lg">
        <div v-for="i in 6" :key="i" class="col-12 col-sm-6 col-md-4">
          <q-card flat bordered style="border-radius: 16px; height: 100%;">
            <q-card-section>
              <q-skeleton type="text" width="60%" class="text-subtitle1 q-mb-sm" />
              <q-skeleton type="text" width="40%" class="q-mb-xs" />
              <q-skeleton type="text" width="80%" />
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="clinics.length === 0" class="text-center q-py-xl glass-card" style="border-radius: 16px;">
        <q-icon name="domain_disabled" size="64px" color="grey-4" class="q-mb-md" />
        <div class="text-h6 text-grey-7 font-weight-bold">No active clinics found.</div>
        <div class="text-grey-6 q-mt-sm">Try searching for a different clinic name.</div>
      </div>

      <!-- Grid -->
      <div v-else class="row q-col-gutter-lg">
        <div v-for="clinic in clinics" :key="clinic._id" class="col-12 col-sm-6 col-md-4">
          <q-card
            flat
            bordered
            class="hover-lift cursor-pointer full-height column justify-between"
            @click="selectClinic(clinic)"
            style="border-radius: 16px; transition: transform 0.2s, box-shadow 0.2s;"
          >
            <q-card-section>
              <div class="row justify-between items-start q-mb-sm">
                <div class="text-h6 font-weight-bold text-slate-800 line-clamp-1" style="max-width: 80%;">{{ clinic.name }}</div>
                <q-chip size="sm" color="green-1" text-color="green" label="Active" icon="check_circle" class="q-ma-none font-weight-bold" />
              </div>
              <div class="text-body2 text-grey-7 row items-start q-mb-sm">
                <q-icon name="place" size="16px" color="primary" class="q-mr-sm q-mt-xs" />
                <div style="flex: 1;">{{ clinic.address }}<br>{{ clinic.city }}, {{ clinic.district }}</div>
              </div>
              <div class="text-body2 text-grey-7 row items-center">
                <q-icon name="phone" size="16px" color="primary" class="q-mr-sm" />
                {{ clinic.phone }}
              </div>
            </q-card-section>
            
            <q-card-actions align="right" class="q-pt-none q-px-md q-pb-md">
              <q-btn flat color="primary" label="View Doctors" icon-right="arrow_forward" @click.stop="selectClinic(clinic)" />
            </q-card-actions>
          </q-card>
        </div>
      </div>
    </div>

    <div v-else class="q-pt-md">
      <div class="row justify-between items-center q-mb-md">
        <div>
          <q-btn flat color="primary" icon="arrow_back" label="Back to Clinics" @click="selectedClinic = null; searchClinicName = ''; fetchClinics();" class="q-mb-sm q-pl-none font-weight-bold" />
          <div class="text-h5 font-weight-bold text-slate-800">
            Doctors at {{ selectedClinic.name }}
          </div>
        </div>
        
        <div style="min-width: 200px;">
          <q-select
            v-model="selectedSpecialization"
            outlined
            dense
            emit-value
            map-options
            :options="specializationOptions"
            label="Filter Specialization"
            @update:model-value="filterDoctors"
            bg-color="white"
          >
            <template v-slot:prepend>
              <q-icon name="filter_alt" color="grey-6" />
            </template>
          </q-select>
        </div>
      </div>

      <!-- Skeletons -->
      <div v-if="loadingDoctors" class="row q-col-gutter-lg">
        <div v-for="i in 4" :key="i" class="col-12 col-sm-6 col-md-4 col-lg-3">
          <q-card flat bordered style="border-radius: 16px;">
            <q-card-section class="text-center">
              <q-skeleton type="QAvatar" size="80px" class="q-mx-auto q-mb-md" />
              <q-skeleton type="text" width="70%" class="q-mx-auto q-mb-sm text-subtitle1" />
              <q-skeleton type="text" width="50%" class="q-mx-auto" />
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="doctors.length === 0" class="text-center q-py-xl glass-card" style="border-radius: 16px;">
        <q-icon name="person_off" size="64px" color="grey-4" class="q-mb-md" />
        <div class="text-h6 text-grey-7 font-weight-bold">No doctors found.</div>
        <div class="text-grey-6 q-mt-sm">Try changing the specialization filter.</div>
      </div>

      <!-- Grid -->
      <div v-else class="row q-col-gutter-lg">
        <div v-for="doctor in doctors" :key="doctor._id" class="col-12 col-sm-6 col-md-4 col-lg-3">
          <q-card
            flat
            bordered
            class="full-height column justify-between text-center hover-lift"
            style="border-radius: 16px; transition: transform 0.2s, box-shadow 0.2s;"
          >
            <q-card-section class="q-pt-xl">
              <q-avatar size="80px" color="indigo-1" text-color="primary" class="q-mb-md shadow-2">
                <span class="text-h4 font-weight-bold">{{ doctor.name.charAt(0).toUpperCase() }}</span>
              </q-avatar>
              <div class="text-h6 font-weight-bold text-slate-800 line-clamp-1">Dr. {{ doctor.name }}</div>
              <div class="text-subtitle2 text-cyan-8 font-weight-medium q-mb-sm">{{ doctor.specialization }}</div>
              <div class="text-caption text-grey-7 row items-center justify-center">
                <q-icon name="phone" size="14px" class="q-mr-xs" /> {{ doctor.phone }}
              </div>
            </q-card-section>
            
            <q-card-actions align="center" class="q-pb-lg">
              <q-btn
                unelevated
                color="primary"
                label="Check Availability"
                icon="event_available"
                class="full-width q-mx-md font-weight-bold"
                style="border-radius: 8px;"
                @click="showAvailability(doctor)"
              />
            </q-card-actions>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Availability & Booking Dialog -->
    <q-dialog v-model="availabilityDialog">
      <q-card class="glass-card" style="width: 700px; max-width: 90vw; border-radius: 16px;">
        <q-card-section class="bg-primary text-white row items-center q-pb-md">
          <div class="text-h6">Book Appointment</div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-card-section class="q-gutter-y-md">
          <!-- Doctor details -->
          <div v-if="selectedDoctor">
            <div class="text-subtitle1 font-weight-bold">Dr. {{ selectedDoctor.name }}</div>
            <div class="text-caption text-indigo-7 font-weight-medium">{{ selectedDoctor.specialization }}</div>
          </div>

          <!-- Date Selection -->
          <q-input
            v-model="bookingDate"
            outlined
            dense
            label="Appointment Date"
            readonly
            :min="todayStr"
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer" />
            </template>
            <q-popup-proxy transition-show="scale" transition-hide="scale" :breakpoint="9999">
              <q-date v-model="bookingDate" mask="YYYY-MM-DD" @update:model-value="fetchSlots" :options="(date) => date >= todayStr.replace(/-/g, '/')" class="full-width">
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="Close" color="primary" flat />
                </div>
              </q-date>
            </q-popup-proxy>
          </q-input>

          <!-- Slots Display -->
          <div>
            <div class="text-subtitle2 font-weight-bold q-mb-sm">Available Slots</div>
            
            <div v-if="loadingSlots" class="text-center q-py-md">
              <q-spinner-dots color="primary" size="30px" />
            </div>

            <div v-else-if="slots.length === 0" class="text-center q-py-lg glass-card" style="border-radius: 12px; border: 1px solid rgba(255, 0, 0, 0.2);">
              <q-icon name="event_busy" size="48px" color="negative" class="q-mb-sm" />
              <div class="text-subtitle1 font-weight-bold text-negative">No slots available for this date.</div>
              <div class="text-caption text-grey-8 q-mt-xs">Please try checking availability for another date.</div>
            </div>

            <div v-else class="row q-col-gutter-xs">
              <div v-for="slot in slots" :key="slot.startTime" class="col-4">
                <div :title="!slot.available ? 'The selected time slot is already booked.' : ''" class="full-width">
                  <q-btn
                    :outline="slot.available"
                    :flat="!slot.available"
                    dense
                    no-caps
                    class="full-width font-weight-bold"
                    :color="slot.available ? 'primary' : 'negative'"
                    :disable="!slot.available"
                    :label="formatTime(slot.startTime)"
                    @click="selectSlot(slot)"
                    :style="!slot.available ? 'opacity: 0.6; text-decoration: line-through; cursor: not-allowed;' : ''"
                  />
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Slot Confirmation Dialog -->
    <q-dialog v-model="confirmBookingDialog">
      <q-card style="width: 700px; max-width: 95vw; border-radius: 16px;">
        <q-card-section class="bg-indigo-6 text-white">
          <div class="text-h6 font-weight-bold">Confirm Booking</div>
        </q-card-section>

        <q-card-section class="q-gutter-y-md q-pt-md">
          <div v-if="selectedDoctor && selectedSlot">
            <p class="text-subtitle1">You are booking an appointment with <strong>Dr. {{ selectedDoctor.name }}</strong>.</p>
            <p class="text-subtitle1"><strong>Date:</strong> {{ formatDateWithDay(bookingDate) }}</p>
            <p class="text-subtitle1"><strong>Time:</strong> {{ formatTime(selectedSlot.startTime) }} - {{ formatTime(selectedSlot.endTime) }}</p>
          </div>

          <q-input
            v-model="bookingNotes"
            outlined
            dense
            type="textarea"
            label="Reason for Visit / Notes (Optional)"
            rows="3"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pb-md q-px-md">
          <q-btn flat label="Cancel" color="grey-7" v-close-popup />
          <q-btn unelevated label="Confirm Book" color="primary" @click="submitBooking" :loading="submittingBooking" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useQuasar } from 'quasar';
import { useFormat } from '~/composables/useFormat';
import { useConfirmDialog } from '~/composables/useConfirmDialog';

const $q = useQuasar();
const authStore = useAuthStore();
const { $api } = useNuxtApp();
const { formatDate, formatDateWithDay, formatTime } = useFormat();
const { confirm } = useConfirmDialog();

// Search / Filtering
const searchClinicName = ref('');
const clinics = ref([]);
const loadingClinics = ref(false);
const selectedClinic = ref(null);
const doctors = ref([]);
const loadingDoctors = ref(false);
const selectedSpecialization = ref('All');
const specializationOptions = ref(['All']);

// Booking State
const selectedDoctor = ref(null);
const availabilityDialog = ref(false);
const bookingDate = ref('');
const slots = ref([]);
const loadingSlots = ref(false);
const selectedSlot = ref(null);
const confirmBookingDialog = ref(false);
const bookingNotes = ref('');
const submittingBooking = ref(false);

const todayStr = computed(() => {
  const d = new Date();
  return d.toISOString().split('T')[0];
});

onMounted(() => {
  fetchClinics();
  // Default to today
  bookingDate.value = todayStr.value;
});

const fetchClinics = async () => {
  loadingClinics.value = true;
  try {
    let url = '/clinics';
    const params = {};
    if (searchClinicName.value) params.name = searchClinicName.value;

    const data = await $api(url, { params });
    clinics.value = data.clinics || [];
    selectedClinic.value = null;
    doctors.value = [];
  } catch (err) {
    console.error('Fetch clinics failed:', err);
  } finally {
    loadingClinics.value = false;
  }
};

const selectClinic = (clinic) => {
  selectedClinic.value = clinic;
  fetchDoctors();
};

const fetchDoctors = async () => {
  if (!selectedClinic.value) return;
  loadingDoctors.value = true;
  try {
    const data = await $api('/users/doctors', {
      params: { clinicId: selectedClinic.value._id }
    });
    doctors.value = data.doctors || [];
    
    // Extract specializations
    const specs = new Set(doctors.value.map(d => d.specialization));
    specializationOptions.value = ['All', ...Array.from(specs)];
    selectedSpecialization.value = 'All';
  } catch (err) {
    console.error('Fetch doctors failed:', err);
  } finally {
    loadingDoctors.value = false;
  }
};

const filterDoctors = async () => {
  if (!selectedClinic.value) return;
  loadingDoctors.value = true;
  try {
    const params = { clinicId: selectedClinic.value._id };
    if (selectedSpecialization.value !== 'All') {
      params.specialization = selectedSpecialization.value;
    }
    const data = await $api('/users/doctors', { params });
    doctors.value = data.doctors || [];
  } catch (err) {
    console.error('Filter doctors failed:', err);
  } finally {
    loadingDoctors.value = false;
  }
};

const showAvailability = (doctor) => {
  selectedDoctor.value = doctor;
  bookingDate.value = todayStr.value; // Reset to today's date
  availabilityDialog.value = true;
  fetchSlots();
};

const fetchSlots = async () => {
  if (!selectedDoctor.value || !bookingDate.value) return;
  loadingSlots.value = true;
  try {
    const data = await $api(`/schedules/doctor/${selectedDoctor.value._id}/slots`, {
      params: { date: bookingDate.value }
    });
    slots.value = data.slots || [];
  } catch (err) {
    console.error('Fetch slots failed:', err);
    slots.value = [];
  } finally {
    loadingSlots.value = false;
  }
};

const selectSlot = (slot) => {
  if (!authStore.isLoggedIn) {
    $q.notify({
      type: 'warning',
      message: 'Please login or register to book an appointment.',
      actions: [
        { label: 'Login', color: 'white', handler: () => navigateTo('/app/login') }
      ]
    });
    return;
  }
  selectedSlot.value = slot;
  confirmBookingDialog.value = true;
};

const submitBooking = async () => {
  if (!selectedDoctor.value || !selectedSlot.value) return;

  const isSure = await confirm({
    title: 'Final Confirmation',
    message: `<div class="text-subtitle1 q-mb-sm">Are you sure you want to finalize this booking?</div>
              <ul class="q-pl-md">
                <li><strong>Doctor:</strong> Dr. ${selectedDoctor.value.name}</li>
                <li><strong>Date:</strong> ${formatDateWithDay(bookingDate.value)}</li>
                <li><strong>Time:</strong> ${formatTime(selectedSlot.value.startTime)} - ${formatTime(selectedSlot.value.endTime)}</li>
              </ul>`,
    html: true,
    okLabel: 'Yes, I am sure',
    cancelLabel: 'Cancel'
  });

  if (!isSure) return;

  submittingBooking.value = true;
  try {
    await $api('/appointments', {
      method: 'POST',
      body: {
        clinicId: selectedClinic.value._id,
        doctorId: selectedDoctor.value._id,
        date: bookingDate.value,
        startTime: selectedSlot.value.startTime,
        notes: bookingNotes.value
      }
    });

    $q.notify({
      type: 'positive',
      message: 'Appointment booked successfully! Email confirmation sent.'
    });

    confirmBookingDialog.value = false;
    availabilityDialog.value = false;
    bookingNotes.value = '';
    // Refresh slots
    fetchSlots();
  } catch (err) {
    console.error('Booking failed:', err);
    $q.notify({
      type: 'negative',
      message: err._data?.message || 'Booking failed'
    });
  } finally {
    submittingBooking.value = false;
  }
};
</script>
