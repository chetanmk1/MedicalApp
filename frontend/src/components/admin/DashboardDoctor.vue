<template>
  <div class="q-gutter-y-lg">
    <!-- Navigation Tabs -->
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
        <q-tab name="dashboard" label="Dashboard" icon="dashboard" />
        <q-tab name="appointments" label="My Appointments" icon="event" />
        <q-tab name="availability" label="My Schedule Setup" icon="schedule" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="tab" animated>
        <!-- Empty Dashboard Panel for future analytics -->
        <q-tab-panel name="dashboard" class="q-gutter-y-lg flex flex-center" style="min-height: 400px;">
          <div class="text-center text-grey-6">
            <q-icon name="analytics" size="64px" class="q-mb-md" />
            <div class="text-h6">Dashboard Overview</div>
            <p>Analytics, graphs, and statistics will be displayed here in the future.</p>
          </div>
        </q-tab-panel>

        <!-- Doctor Appointments Panel -->
        <q-tab-panel name="appointments" class="q-gutter-y-md">
          <div class="row justify-between items-center q-mb-md">
            <div class="text-subtitle1 font-weight-bold text-slate-800">Booked Patients List</div>
            <q-btn flat icon="refresh" color="grey-6" label="Reload" @click="fetchAppointments" />
          </div>

          <div v-if="appointments.length === 0" class="text-center q-py-xl text-grey-6">
            No appointments booked with you yet.
          </div>

          <q-list v-else separator bordered style="border-radius: 12px;">
            <q-item v-for="app in appointments" :key="app._id" class="q-py-md">
              <q-item-section>
                <div class="row items-center q-gutter-x-sm">
                  <span class="text-subtitle2 font-weight-bold text-slate-800">{{ app.patientId?.name }}</span>
                  <q-chip size="sm" :color="getAppStatusColor(app.status)" text-color="white" :label="app.status.toUpperCase()" />
                </div>
                <q-item-label caption class="q-mt-xs">
                  <span><strong>Date:</strong> {{ formatDate(app.date) }}</span>
                  <br />
                  <span><strong>Time:</strong> {{ formatTime(app.startTime) }} - {{ formatTime(app.endTime) }}</span>
                  <br />
                  <span><strong>Phone:</strong> {{ app.patientId?.phone }}</span>
                  <br v-if="app.notes" />
                  <span v-if="app.notes"><strong>Reason:</strong> {{ app.notes }}</span>
                </q-item-label>
              </q-item-section>

              <q-item-section side v-if="app.status !== 'cancelled'">
                <div class="row items-center q-gutter-sm">
                  <q-btn unelevated dense color="negative" label="Cancel" size="sm" @click="cancelApp(app._id)" />
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-tab-panel>

        <!-- Availability Schedule Self Configuration Panel -->
        <q-tab-panel name="availability" class="q-gutter-y-md">
          <q-card flat bordered style="border-radius: 12px; background: #f8fafc;">
            <q-card-section>
              <q-form @submit.prevent="saveSchedule" class="q-gutter-y-md">
                <q-input
                  v-model.number="scheduleForm.slotDuration"
                  outlined
                  dense
                  type="number"
                  label="Appointment Slot Duration (Minutes)"
                  required
                />

                <!-- Weekly Shifts -->
                <div>
                  <div class="row justify-between items-center q-mb-sm">
                    <div class="text-subtitle2 font-weight-bold">Weekly shifts</div>
                    <q-btn flat color="primary" dense label="Add Shift" icon="add" @click="addWeeklyShift" />
                  </div>

                  <div v-for="(shift, index) in scheduleForm.weeklyAvailability" :key="index" class="row q-col-gutter-sm items-center q-mb-sm">
                    <div class="col-4">
                      <q-select
                        v-model="shift.dayOfWeek"
                        outlined
                        dense
                        emit-value
                        map-options
                        :options="daysOfWeekOptions"
                        label="Day"
                      />
                    </div>
                    <div class="col-3" v-for="(slot, slotIndex) in shift.slots" :key="slotIndex">
                      <div class="row q-col-gutter-xs">
                        <div class="col-6">
                          <q-input v-model="slot.startTime" outlined dense label="Start" placeholder="HH:MM" />
                        </div>
                        <div class="col-6">
                          <q-input v-model="slot.endTime" outlined dense label="End" placeholder="HH:MM" />
                        </div>
                      </div>
                    </div>
                    <div class="col-2">
                      <q-btn flat color="negative" icon="delete" dense @click="removeWeeklyShift(index)" />
                    </div>
                  </div>
                </div>

                <!-- Holidays Blocking -->
                <div>
                  <div class="row justify-between items-center q-mb-sm">
                    <div class="text-subtitle2 font-weight-bold">Holidays & Closures</div>
                    <q-btn flat color="primary" dense label="Add Holiday" icon="add" @click="addHoliday" />
                  </div>

                  <div v-for="(holiday, index) in scheduleForm.holidays" :key="index" class="row q-col-gutter-sm items-center q-mb-xs">
                    <div class="col-4">
                      <q-input v-model="holiday.date" outlined dense label="Date" readonly>
                        <template v-slot:append>
                          <q-icon name="event" class="cursor-pointer" />
                        </template>
                        <q-popup-proxy transition-show="scale" transition-hide="scale" :breakpoint="9999">
                          <q-date v-model="holiday.date" mask="YYYY-MM-DD" class="full-width">
                            <div class="row items-center justify-end">
                              <q-btn v-close-popup label="Close" color="primary" flat />
                            </div>
                          </q-date>
                        </q-popup-proxy>
                      </q-input>
                    </div>
                    <div class="col-6">
                      <q-input v-model="holiday.description" outlined dense label="Description / Reason" />
                    </div>
                    <div class="col-2">
                      <q-btn flat color="negative" icon="delete" dense @click="removeHoliday(index)" />
                    </div>
                  </div>
                </div>

                <!-- Leaves Blocking -->
                <div>
                  <div class="row justify-between items-center q-mb-sm">
                    <div class="text-subtitle2 font-weight-bold">Leave Blocking</div>
                    <q-btn flat color="primary" dense label="Add Leave" icon="add" @click="addLeave" />
                  </div>

                  <div v-for="(leave, index) in scheduleForm.leaves" :key="index" class="row q-col-gutter-sm items-center q-mb-xs">
                    <div class="col-4">
                      <q-input v-model="leave.startDate" outlined dense label="Start Date" readonly>
                        <template v-slot:append>
                          <q-icon name="event" class="cursor-pointer" />
                        </template>
                        <q-popup-proxy transition-show="scale" transition-hide="scale" :breakpoint="9999">
                          <q-date v-model="leave.startDate" mask="YYYY-MM-DD" class="full-width">
                            <div class="row items-center justify-end">
                              <q-btn v-close-popup label="Close" color="primary" flat />
                            </div>
                          </q-date>
                        </q-popup-proxy>
                      </q-input>
                    </div>
                    <div class="col-4">
                      <q-input v-model="leave.endDate" outlined dense label="End Date" readonly>
                        <template v-slot:append>
                          <q-icon name="event" class="cursor-pointer" />
                        </template>
                        <q-popup-proxy transition-show="scale" transition-hide="scale" :breakpoint="9999">
                          <q-date v-model="leave.endDate" mask="YYYY-MM-DD" class="full-width">
                            <div class="row items-center justify-end">
                              <q-btn v-close-popup label="Close" color="primary" flat />
                            </div>
                          </q-date>
                        </q-popup-proxy>
                      </q-input>
                    </div>
                    <div class="col-2">
                      <q-btn flat color="negative" icon="delete" dense @click="removeLeave(index)" />
                    </div>
                  </div>
                </div>

                <div class="text-right q-pt-md">
                  <q-btn unelevated color="primary" type="submit" label="Save My Schedule" :loading="savingSchedule" />
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
import { ref, onMounted, watch } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useQuasar } from 'quasar';
import { useDashboardTab } from '~/composables/useDashboardTab';
import { useFormat } from '~/composables/useFormat';

const $q = useQuasar();
const authStore = useAuthStore();
const { $api } = useNuxtApp();

const { activeTab: tab } = useDashboardTab();
const { formatDate, formatTime } = useFormat();


const appointments = ref([]);
const savingSchedule = ref(false);

const scheduleForm = ref({
  slotDuration: 30,
  weeklyAvailability: [],
  holidays: [],
  leaves: []
});

const daysOfWeekOptions = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 }
];

onMounted(() => {
  if (tab.value === 'dashboard' || !['appointments', 'availability'].includes(tab.value)) {
    tab.value = 'appointments';
  }
  fetchAppointments();
  fetchMySchedule();
});

const fetchAppointments = async () => {
  try {
    const data = await $api('/appointments');
    appointments.value = data.appointments || [];
  } catch (err) {
    console.error('Fetch appointments failed:', err);
  }
};

const cancelApp = async (appId) => {
  try {
    await $api(`/appointments/${appId}/cancel`, {
      method: 'PATCH'
    });
    $q.notify({
      type: 'positive',
      message: 'Appointment cancelled. Notification sent to patient.'
    });
    fetchAppointments();
  } catch (err) {
    console.error('Cancel failed:', err);
  }
};

const fetchMySchedule = async () => {
  try {
    const doctorId = authStore.user.id;
    const data = await $api(`/schedules/doctor/${doctorId}`);
    
    // Normalize dates for inputs
    const leaves = (data.leaves || []).map(l => ({
      startDate: new Date(l.startDate).toISOString().split('T')[0],
      endDate: new Date(l.endDate).toISOString().split('T')[0]
    }));

    const holidays = (data.holidays || []).map(h => ({
      date: new Date(h.date).toISOString().split('T')[0],
      description: h.description
    }));

    scheduleForm.value = {
      slotDuration: data.slotDuration || 30,
      weeklyAvailability: data.weeklyAvailability || [],
      leaves,
      holidays
    };
  } catch (err) {
    console.error('Fetch schedule failed:', err);
  }
};

const addWeeklyShift = () => {
  scheduleForm.value.weeklyAvailability.push({
    dayOfWeek: 1,
    slots: [{ startTime: '09:00', endTime: '13:00' }]
  });
};

const removeWeeklyShift = (index) => {
  scheduleForm.value.weeklyAvailability.splice(index, 1);
};

const addHoliday = () => {
  scheduleForm.value.holidays.push({
    date: new Date().toISOString().split('T')[0],
    description: 'Vacation'
  });
};

const removeHoliday = (index) => {
  scheduleForm.value.holidays.splice(index, 1);
};

const addLeave = () => {
  const today = new Date().toISOString().split('T')[0];
  scheduleForm.value.leaves.push({
    startDate: today,
    endDate: today
  });
};

const removeLeave = (index) => {
  scheduleForm.value.leaves.splice(index, 1);
};

const saveSchedule = async () => {
  savingSchedule.value = true;
  try {
    const doctorId = authStore.user.id;
    await $api(`/schedules/doctor/${doctorId}`, {
      method: 'PUT',
      body: scheduleForm.value
    });

    $q.notify({
      type: 'positive',
      message: 'Your availability schedule has been updated successfully.'
    });
  } catch (err) {
    console.error('Save schedule failed:', err);
    $q.notify({
      type: 'negative',
      message: err._data?.message || 'Failed to update schedule'
    });
  } finally {
    savingSchedule.value = false;
  }
};



const getAppStatusColor = (status) => {
  switch (status) {
    case 'confirmed': return 'green-6';
    case 'pending': return 'orange-6';
    case 'completed': return 'blue-6';
    case 'cancelled': return 'red-6';
    default: return 'grey';
  }
};
</script>
