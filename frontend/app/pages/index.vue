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
        <div class="col-12 col-sm-5">
          <q-input
            v-model="searchDistrict"
            outlined
            dense
            label="Search by District"
            icon="place"
            color="primary"
          >
            <template v-slot:prepend>
              <q-icon name="explore" color="grey-6" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-sm-5">
          <q-input
            v-model="searchCity"
            outlined
            dense
            label="Search by City"
            color="primary"
          >
            <template v-slot:prepend>
              <q-icon name="location_city" color="grey-6" />
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
    <div class="row q-col-gutter-lg">
      <!-- Clinic list (Left Side) -->
      <div class="col-12 col-md-5">
        <div class="text-h6 font-weight-bold text-slate-800 q-mb-md">
          Clinics ({{ clinics.length }})
        </div>
        
        <q-scroll-area style="height: 500px;" class="q-pr-sm">
          <div v-if="clinics.length === 0" class="text-center q-py-xl text-grey-6">
            <q-icon name="local_hospital" size="48px" class="q-mb-md" />
            <div>No active clinics found. Try searching.</div>
          </div>
          
          <div v-else class="q-gutter-y-md">
            <q-card
              v-for="clinic in clinics"
              :key="clinic._id"
              flat
              bordered
              class="hover-lift cursor-pointer"
              :class="{ 'border-primary': selectedClinic?._id === clinic._id }"
              @click="selectClinic(clinic)"
              style="border-radius: 12px;"
            >
              <q-card-section>
                <div class="row justify-between items-center q-mb-xs">
                  <div class="text-subtitle1 font-weight-bold text-slate-800">{{ clinic.name }}</div>
                  <q-chip size="sm" color="green-1" text-color="green" label="Active" />
                </div>
                <div class="text-caption text-grey-7 row items-center q-mb-xs">
                  <q-icon name="place" size="14px" class="q-mr-xs" />
                  {{ clinic.address }}, {{ clinic.city }}, {{ clinic.district }}
                </div>
                <div class="text-caption text-grey-7 row items-center">
                  <q-icon name="phone" size="14px" class="q-mr-xs" />
                  {{ clinic.phone }}
                </div>
              </q-card-section>
            </q-card>
          </div>
        </q-scroll-area>
      </div>

      <!-- Doctors and availability (Right Side) -->
      <div class="col-12 col-md-7">
        <template v-if="selectedClinic">
          <div class="text-h6 font-weight-bold text-slate-800 q-mb-md">
            Doctors at {{ selectedClinic.name }}
          </div>

          <div class="q-gutter-y-md">
            <!-- Filter doctor by specialization -->
            <div class="row q-gutter-sm items-center">
              <q-select
                v-model="selectedSpecialization"
                outlined
                dense
                emit-value
                map-options
                :options="specializationOptions"
                label="Specialization Filter"
                class="col"
                @update:model-value="filterDoctors"
              />
              <q-btn flat dense icon="refresh" color="grey-6" @click="fetchDoctors" />
            </div>

            <!-- Doctor List -->
            <div v-if="doctors.length === 0" class="text-center q-py-xl text-grey-6 glass-card">
              <q-icon name="person_off" size="48px" class="q-mb-md" />
              <div>No doctors available with these filters.</div>
            </div>

            <div v-else class="q-gutter-y-md">
              <q-card
                v-for="doctor in doctors"
                :key="doctor._id"
                flat
                bordered
                style="border-radius: 12px;"
              >
                <q-card-section>
                  <div class="row justify-between items-start">
                    <div>
                      <div class="text-subtitle1 font-weight-bold text-indigo-7">Dr. {{ doctor.name }}</div>
                      <div class="text-caption font-weight-medium text-cyan-8 q-mb-sm">{{ doctor.specialization }}</div>
                      <div class="text-caption text-grey-7 row items-center q-mb-xs">
                        <q-icon name="phone" size="14px" class="q-mr-xs" /> {{ doctor.phone }}
                      </div>
                    </div>
                    <q-btn
                      unelevated
                      color="primary"
                      label="View Availability"
                      no-caps
                      size="sm"
                      @click="showAvailability(doctor)"
                    />
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </template>

        <div v-else class="text-center q-py-xl text-grey-6 glass-card height-100 flex flex-center" style="min-height: 350px;">
          <div>
            <q-icon name="arrow_back" size="48px" class="q-mb-md text-primary" />
            <div class="text-subtitle1 font-weight-medium">Select a Clinic to View Available Doctors</div>
            <p class="text-caption q-mt-xs">Availability and appointment slots will load automatically.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Availability & Booking Dialog -->
    <q-dialog v-model="availabilityDialog" max-width="500px">
      <q-card class="glass-card" style="width: 500px; border-radius: 16px;">
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
            type="date"
            label="Appointment Date"
            @update:model-value="fetchSlots"
            :min="todayStr"
          />

          <!-- Slots Display -->
          <div>
            <div class="text-subtitle2 font-weight-bold q-mb-sm">Available Slots</div>
            
            <div v-if="loadingSlots" class="text-center q-py-md">
              <q-spinner-dots color="primary" size="30px" />
            </div>

            <div v-else-if="slots.length === 0" class="text-center q-py-md text-grey-6">
              No slots available for this date.
            </div>

            <div v-else class="row q-col-gutter-xs">
              <div v-for="slot in slots" :key="slot.startTime" class="col-4">
                <q-btn
                  outline
                  dense
                  no-caps
                  class="full-width"
                  :color="slot.available ? 'primary' : 'grey-5'"
                  :disable="!slot.available"
                  :label="slot.startTime"
                  @click="selectSlot(slot)"
                />
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Slot Confirmation Dialog -->
    <q-dialog v-model="confirmBookingDialog">
      <q-card style="width: 400px; border-radius: 16px;">
        <q-card-section class="bg-indigo-6 text-white">
          <div class="text-h6 font-weight-bold">Confirm Booking</div>
        </q-card-section>

        <q-card-section class="q-gutter-y-md q-pt-md">
          <div v-if="selectedDoctor && selectedSlot">
            <p>You are booking an appointment with <strong>Dr. {{ selectedDoctor.name }}</strong>.</p>
            <p><strong>Date:</strong> {{ bookingDate }}</p>
            <p><strong>Time:</strong> {{ selectedSlot.startTime }} - {{ selectedSlot.endTime }}</p>
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

const $q = useQuasar();
const authStore = useAuthStore();
const { $api } = useNuxtApp();

// Search / Filtering
const searchDistrict = ref('');
const searchCity = ref('');
const clinics = ref([]);
const selectedClinic = ref(null);
const doctors = ref([]);
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
  try {
    let url = '/clinics';
    const params = {};
    if (searchCity.value) params.city = searchCity.value;
    if (searchDistrict.value) params.district = searchDistrict.value;

    const data = await $api(url, { params });
    clinics.value = data.clinics || [];
    selectedClinic.value = null;
    doctors.value = [];
  } catch (err) {
    console.error('Fetch clinics failed:', err);
  }
};

const selectClinic = (clinic) => {
  selectedClinic.value = clinic;
  fetchDoctors();
};

const fetchDoctors = async () => {
  if (!selectedClinic.value) return;
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
  }
};

const filterDoctors = async () => {
  if (!selectedClinic.value) return;
  try {
    const params = { clinicId: selectedClinic.value._id };
    if (selectedSpecialization.value !== 'All') {
      params.specialization = selectedSpecialization.value;
    }
    const data = await $api('/users/doctors', { params });
    doctors.value = data.doctors || [];
  } catch (err) {
    console.error('Filter doctors failed:', err);
  }
};

const showAvailability = (doctor) => {
  selectedDoctor.value = doctor;
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
        { label: 'Login', color: 'white', handler: () => navigateTo('/login') }
      ]
    });
    return;
  }
  selectedSlot.value = slot;
  confirmBookingDialog.value = true;
};

const submitBooking = async () => {
  if (!selectedDoctor.value || !selectedSlot.value) return;
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
