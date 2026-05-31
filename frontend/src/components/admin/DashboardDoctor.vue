<template>
  <div class="q-gutter-y-lg">
    <div class="row justify-between items-center">
      <div>
        <h1 class="text-h4 font-weight-bold text-slate-800 q-mb-none">Dr. {{ user?.name }}</h1>
        <p class="text-subtitle2 text-grey-7">Doctor Consultation & Calendar Panel</p>
      </div>
      <q-btn flat icon="refresh" color="grey-6" label="Reload Appointments" @click="loadAppointments" />
    </div>

    <div class="row q-col-gutter-lg">
      <!-- Consultation List -->
      <div class="col-12 col-md-7">
        <q-card flat bordered style="border-radius: 16px;">
          <q-card-section class="text-subtitle1 font-weight-bold text-slate-800">
            Assigned Appointments ({{ appointments.length }})
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pa-none">
            <div v-if="appointments.length === 0" class="text-center q-py-xl text-grey-6">
              No appointments scheduled for you.
            </div>

            <q-list separator v-else>
              <q-item
                v-for="app in appointments"
                :key="app._id"
                clickable
                @click="selectAppointment(app)"
                :active="selectedApp?._id === app._id"
                active-class="bg-indigo-0"
                class="q-py-md"
              >
                <q-item-section>
                  <div class="row items-center q-gutter-x-sm">
                    <span class="text-subtitle2 font-weight-bold text-slate-800">{{ app.patientId?.name }}</span>
                    <q-chip size="sm" :color="getAppStatusColor(app.status)" text-color="white" :label="app.status.toUpperCase()" />
                  </div>
                  <q-item-label caption>
                    <strong>Slot:</strong> {{ formatDate(app.date) }} at {{ app.startTime }} - {{ app.endTime }}<br>
                    <strong>Phone:</strong> {{ app.patientId?.phone }}
                    <div v-if="app.notes" class="q-mt-xs text-grey-7">
                      <strong>Notes:</strong> {{ app.notes }}
                    </div>
                  </q-item-label>
                </q-item-section>
                <q-item-section side v-if="app.status === 'checked_in'">
                  <q-badge color="teal" label="READY" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>

      <!-- Consultation Actions & Notes Desk -->
      <div class="col-12 col-md-5">
        <q-card flat bordered style="border-radius: 16px; min-height: 300px;" class="glass-card">
          <template v-if="selectedApp">
            <q-card-section class="bg-indigo-9 text-white">
              <div class="text-subtitle1 font-weight-bold">Consultation Desk</div>
              <div class="text-caption text-indigo-1">Patient: {{ selectedApp.patientId?.name }}</div>
            </q-card-section>

            <q-card-section class="q-gutter-y-md q-pt-md">
              <div>
                <strong>Appointment Time:</strong><br>
                {{ formatDate(selectedApp.date) }} at {{ selectedApp.startTime }} - {{ selectedApp.endTime }}
              </div>

              <div>
                <strong>Reason for Visit:</strong><br>
                <span class="text-grey-7">{{ selectedApp.notes || 'None provided' }}</span>
              </div>

              <div v-if="selectedApp.status === 'completed'">
                <q-banner dense rounded class="bg-green-1 text-green-9 q-mb-md">
                  Consultation completed! Notes are locked.
                </q-banner>
                <strong>Consultation Notes:</strong><br>
                <p class="text-grey-8 bg-grey-1 q-pa-sm rounded">{{ selectedApp.notes }}</p>
              </div>

              <q-form v-else @submit.prevent="handleComplete" class="q-gutter-y-md">
                <q-input
                  v-model="consultationNotes"
                  type="textarea"
                  outlined
                  label="Enter Consultation & Prescription Notes"
                  rows="5"
                  required
                  placeholder="Record diagnoses, details of visit, and treatment plans..."
                />
                
                <q-btn
                  unelevated
                  color="positive"
                  label="Mark Consultation Complete"
                  type="submit"
                  class="full-width font-weight-bold"
                  :loading="completing"
                  :disable="selectedApp.status === 'cancelled'"
                />
              </q-form>
            </q-card-section>
          </template>

          <div v-else class="flex flex-center height-100 text-center text-grey-6 q-pa-xl" style="min-height: 300px;">
            <div>
              <q-icon name="assignment" size="48px" class="q-mb-md text-indigo-3" />
              <div class="text-subtitle1 font-weight-bold">No Consultation Selected</div>
              <div class="text-caption">Select an appointment from the list to view details, write consultation notes, and complete check-up.</div>
            </div>
          </div>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuth } from '~/composables/useAuth';
import { useAppointments } from '~/composables/useAppointments';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const { user } = useAuth();
const { appointments, fetchAppointments, completeAppointment } = useAppointments();

const selectedApp = ref(null);
const consultationNotes = ref('');
const completing = ref(false);

onMounted(() => {
  loadAppointments();
});

const loadAppointments = async () => {
  try {
    await fetchAppointments();
    // Keep selection if still valid
    if (selectedApp.value) {
      const found = appointments.value.find(a => a._id === selectedApp.value._id);
      selectedApp.value = found || null;
    }
  } catch (err) {
    console.error(err);
  }
};

const selectAppointment = (app) => {
  selectedApp.value = app;
  consultationNotes.value = app.status === 'completed' ? app.notes : '';
};

const handleComplete = async () => {
  if (!selectedApp.value) return;
  completing.value = true;
  try {
    await completeAppointment(selectedApp.value._id, consultationNotes.value);
    $q.notify({
      type: 'positive',
      message: 'Consultation marked completed successfully.'
    });
    consultationNotes.value = '';
    selectedApp.value = null;
    loadAppointments();
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.message || 'Failed to complete consultation'
    });
  } finally {
    completing.value = false;
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
