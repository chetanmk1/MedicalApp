<template>
  <div class="q-gutter-y-lg">
    <div class="row justify-between items-center">
      <div>
        <h1 class="text-h4 font-weight-bold text-slate-800 q-mb-none">
          {{ clinicInfo ? clinicInfo.name : 'Clinic Dashboard' }}
        </h1>
        <p class="text-subtitle2 text-grey-7">Clinic Administration Center</p>
      </div>
    </div>

    <!-- Empty Dashboard Panel for future analytics -->
    <div v-if="activeTab === 'dashboard'" class="q-gutter-y-lg flex flex-center" style="min-height: 400px;">
      <div class="text-center text-grey-6">
        <q-icon name="analytics" size="64px" class="q-mb-md" />
        <div class="text-h6">Dashboard Overview</div>
        <p>Analytics, graphs, and statistics will be displayed here in the future.</p>
      </div>
    </div>

    <!-- Main Navigation Tabs -->
    <q-card v-else flat bordered style="border-radius: 16px;">
      <q-tabs
        v-model="innerTab"
        dense
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        narrow-indicator
      >
        <q-tab name="profile" label="Clinic Profile" icon="business" />
        <q-tab name="users" label="Doctors & Receptionists" icon="people" />
        <q-tab name="schedules" label="Configure Schedules" icon="schedule" />
        <q-tab name="bookings" label="Bookings Ledger" icon="event" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="innerTab" animated>

        <!-- Clinic Profile Panel -->
        <q-tab-panel name="profile" class="q-gutter-y-lg">
          <q-card flat bordered class="bg-grey-1" style="border-radius: 12px;">
            <q-card-section>
              <div class="text-subtitle1 font-weight-bold text-slate-800 q-mb-md">Manage Clinic Info</div>
              <q-form @submit.prevent="handleUpdateProfile" class="row q-col-gutter-sm" v-if="clinicInfo">
                <div class="col-12 col-sm-6">
                  <q-input v-model="clinicInfo.name" outlined dense label="Clinic Name" required />
                </div>
                <div class="col-12 col-sm-3">
                  <q-input v-model="clinicInfo.city" outlined dense label="City" required />
                </div>
                <div class="col-12 col-sm-3">
                  <q-input v-model="clinicInfo.district" outlined dense label="District" required />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input v-model="clinicInfo.address" outlined dense label="Address" required />
                </div>
                <div class="col-12 col-sm-3">
                  <q-input v-model="clinicInfo.phone" outlined dense label="Phone" required />
                </div>
                <div class="col-12 col-sm-3">
                  <q-input v-model="clinicInfo.email" outlined dense type="email" label="Contact Email" required />
                </div>
                <div class="col-12 text-right q-pt-md">
                  <q-btn unelevated color="primary" type="submit" label="Save Changes" :loading="updatingClinic" />
                </div>
              </q-form>
            </q-card-section>
          </q-card>
        </q-tab-panel>

        <!-- Doctors & Receptionists Accounts Panel -->
        <q-tab-panel name="users" class="q-gutter-y-lg">
          <!-- Create Account Form -->
          <q-card flat bordered class="bg-grey-1" style="border-radius: 12px;">
            <q-card-section>
              <div class="text-subtitle1 font-weight-bold text-slate-800 q-mb-md">Add Doctor or Receptionist Account</div>
              <q-form @submit.prevent="submitUser" class="row q-col-gutter-sm">
                <div class="col-12 col-sm-6">
                  <q-select
                    v-model="newUser.role"
                    outlined
                    dense
                    :options="['doctor', 'receptionist']"
                    label="Account Role"
                    required
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input v-model="newUser.name" outlined dense label="User Full Name" required autocomplete="off" />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input v-model="newUser.email" outlined dense type="email" label="Email Address" required autocomplete="off" />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input v-model="newUser.password" outlined dense type="password" label="Password" required autocomplete="new-password" />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input v-model="newUser.phone" outlined dense label="Phone" required autocomplete="off" />
                </div>
                
                <!-- Doctor Specific Field -->
                <div class="col-12" v-if="newUser.role === 'doctor'">
                  <q-input v-model="newUser.specialization" outlined dense label="Doctor Specialization (e.g., Cardiologist, Pediatrician)" required />
                </div>

                <div class="col-12 text-right q-pt-md">
                  <q-btn unelevated color="primary" type="submit" label="Create Account" :loading="submittingUser" />
                </div>
              </q-form>
            </q-card-section>
          </q-card>

          <!-- Accounts Ledger -->
          <div>
            <div class="text-subtitle1 font-weight-bold text-slate-800 q-mb-md">Clinic Directory</div>
            
            <q-list separator bordered style="border-radius: 12px;">
              <q-item v-for="user in staffUsers" :key="user._id" class="q-py-md">
                <q-item-section>
                  <q-item-label class="text-subtitle2 font-weight-bold text-slate-800">
                    {{ user.name }}
                    <span v-if="user.role === 'doctor'" class="text-cyan-8 text-caption q-ml-sm">({{ user.specialization }})</span>
                  </q-item-label>
                  <q-item-label caption>{{ user.email }} • {{ user.phone }}</q-item-label>
                </q-item-section>
                
                <q-item-section side>
                  <div class="row items-center q-gutter-sm">
                    <q-chip
                      size="sm"
                      :color="user.role === 'doctor' ? 'cyan-6' : 'indigo-6'"
                      text-color="white"
                      :label="user.role.toUpperCase()"
                    />
                    <q-chip
                      size="sm"
                      :color="user.status === 'active' ? 'green-6' : 'red-6'"
                      text-color="white"
                      :label="user.status.toUpperCase()"
                    />
                    
                    <q-btn-dropdown flat dense color="grey-8" icon="more_vert">
                      <q-list style="min-width: 150px;">
                        <q-item clickable v-close-popup @click="changeUserStatus(user._id, 'active')">
                          <q-item-section>Activate</q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="changeUserStatus(user._id, 'inactive')">
                          <q-item-section>Deactivate</q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="changeUserStatus(user._id, 'suspended')">
                          <q-item-section class="text-negative">Suspend</q-item-section>
                        </q-item>
                      </q-list>
                    </q-btn-dropdown>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-tab-panel>

        <!-- Availability Schedules Configuration Panel -->
        <q-tab-panel name="schedules" class="q-gutter-y-lg">
          <div class="row q-col-gutter-md">
            <!-- Doctor Selector -->
            <div class="col-12 col-sm-4">
              <div class="text-subtitle2 font-weight-bold q-mb-xs">Select Doctor</div>
              <q-list bordered separator style="border-radius: 12px;">
                <q-item
                  v-for="doc in doctorsList"
                  :key="doc._id"
                  clickable
                  :active="selectedDocForSchedule?._id === doc._id"
                  active-class="bg-indigo-1 text-primary"
                  @click="selectDocSchedule(doc)"
                >
                  <q-item-section>
                    <q-item-label class="font-weight-bold">Dr. {{ doc.name }}</q-item-label>
                    <q-item-label caption>{{ doc.specialization }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>

            <!-- Schedule Form -->
            <div class="col-12 col-sm-8" v-if="selectedDocForSchedule">
              <q-card flat bordered style="border-radius: 12px;">
                <q-card-section>
                  <div class="text-subtitle1 font-weight-bold text-slate-800 q-mb-md">
                    Schedule Setup: Dr. {{ selectedDocForSchedule.name }}
                  </div>
                  
                  <q-form @submit.prevent="handleSaveSchedule" class="q-gutter-y-md">
                    <q-input
                      v-model.number="scheduleForm.slotDuration"
                      outlined
                      dense
                      type="number"
                      label="Slot Duration (Minutes)"
                      required
                    />

                    <!-- Weekly Shifts -->
                    <div>
                      <div class="row justify-between items-center q-mb-sm">
                        <div class="text-subtitle2 font-weight-bold">Weekly Shifts</div>
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
                      <q-btn unelevated color="primary" type="submit" label="Save Doctor Schedule" :loading="savingSchedule" />
                    </div>
                  </q-form>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-sm-8 text-center q-py-xl text-grey-6" v-else>
              Select a doctor from the directory list to edit their calendar schedule.
            </div>
          </div>
        </q-tab-panel>

        <!-- Bookings Ledger Panel -->
        <q-tab-panel name="bookings" class="q-gutter-y-md">
          <div class="row justify-between items-center q-mb-md">
            <div class="text-subtitle1 font-weight-bold text-slate-800">Appointment List</div>
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
                <q-tooltip>Reload Ledger</q-tooltip>
              </q-btn>
            </div>
          </div>

          <div v-if="filteredAppointments.length === 0" class="text-center q-py-xl text-grey-6">
            <div v-if="filterDate">No bookings found for the selected date.</div>
            <div v-else>No bookings recorded.</div>
          </div>

          <q-list v-else separator bordered style="border-radius: 12px;">
            <q-item v-for="app in filteredAppointments" :key="app._id" class="q-py-md">
              <q-item-section>
                <div class="row items-center q-gutter-x-sm">
                  <span class="text-subtitle2 font-weight-bold text-slate-800">{{ app.patientId?.name }}</span>
                  <q-chip size="sm" :color="getAppStatusColor(app.status)" text-color="white" :label="app.status.toUpperCase()" />
                </div>
                <q-item-label caption class="q-mt-xs">
                  <span><strong>Doctor:</strong> Dr. {{ app.doctorId?.name }} ({{ app.doctorId?.specialization }})</span>
                  <br />
                  <span><strong>Slot:</strong> {{ formatDate(app.date) }} at {{ formatTime(app.startTime) }} - {{ formatTime(app.endTime) }}</span>
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
                  <q-btn outline dense color="grey-7" icon="calendar_today" label="Reschedule" size="sm" @click="openReschedule(app)" />
                  <q-btn unelevated dense color="negative" label="Cancel" size="sm" @click="confirmCancelApp(app)" />
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>

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
              <q-date v-model="rescheduleForm.date" mask="YYYY-MM-DD" @update:model-value="fetchSlots" class="full-width">
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="Close" color="primary" flat />
                </div>
              </q-date>
            </q-popup-proxy>
          </q-input>
          <q-input v-model="rescheduleForm.startTime" outlined dense label="New Start Time (HH:MM)" />
        </q-card-section>

        <q-card-actions align="right" class="q-pb-md q-px-md">
          <q-btn flat label="Back" color="grey-7" v-close-popup />
          <q-btn unelevated label="Save Changes" color="primary" @click="submitReschedule" :loading="savingReschedule" />
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
import { useAuthStore } from '~/stores/auth';
import { useDoctors } from '~/composables/useDoctors';
import { useAppointments } from '~/composables/useAppointments';
import { useQuasar } from 'quasar';
import { useDashboardTab } from '~/composables/useDashboardTab';
import { useFormat } from '~/composables/useFormat';

const $q = useQuasar();
const authStore = useAuthStore();
const { fetchSchedule, saveSchedule } = useDoctors();
const { appointments, fetchAppointments, cancelAppointment, rescheduleAppointment } = useAppointments();

const { activeTab } = useDashboardTab();
const { formatDate, formatTime, formatDateWithDay } = useFormat();
const innerTab = ref('profile');

const clinicInfo = ref(null);
const staffUsers = ref([]);

// Update Clinic State
const updatingClinic = ref(false);

// New User State
const newUser = ref({
  role: 'doctor',
  name: '',
  email: '',
  password: '',
  phone: '',
  specialization: ''
});
const submittingUser = ref(false);

// Schedule management state
const selectedDoctorId = ref(null);
const scheduleForm = ref({
  slotDuration: 30,
  weeklyAvailability: [],
  holidays: [],
  leaves: []
});
const loadingSchedule = ref(false);
const savingSchedule = ref(false);

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

const daysOfWeekOptions = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 }
];

// Reschedule Dialog State
const rescheduleDialog = ref(false);
const rescheduleAppId = ref(null);
const rescheduleForm = ref({
  date: '',
  startTime: ''
});
const savingReschedule = ref(false);

const doctorsList = computed(() => {
  return staffUsers.value.filter(u => u.role === 'doctor');
});

onMounted(() => {
  if (innerTab.value === 'dashboard' || !['profile', 'users', 'schedules', 'bookings'].includes(innerTab.value)) {
    innerTab.value = 'profile';
  }
  fetchClinicProfile();
  fetchStaffUsers();
  loadAppointments();
});

const fetchClinicProfile = async () => {
  try {
    const { $api } = useNuxtApp();
    const userClinicId = authStore.clinicId;
    if (!userClinicId) return;
    const data = await $api(`/clinics/${userClinicId}`);
    clinicInfo.value = data.clinic;
  } catch (err) {
    console.error('Fetch clinic profile failed:', err);
  }
};

const handleUpdateProfile = async () => {
  updatingClinic.value = true;
  try {
    const { $api } = useNuxtApp();
    const data = await $api(`/clinics/${authStore.clinicId}`, {
      method: 'PUT',
      body: clinicInfo.value
    });
    clinicInfo.value = data.clinic;
    $q.notify({
      type: 'positive',
      message: 'Clinic profile updated successfully.'
    });
  } catch (err) {
    console.error('Update clinic profile failed:', err);
  } finally {
    updatingClinic.value = false;
  }
};

const fetchStaffUsers = async () => {
  try {
    const { $api } = useNuxtApp();
    const data = await $api('/users');
    staffUsers.value = data.users || [];
  } catch (err) {
    console.error('Fetch users error:', err);
  }
};

const submitUser = async () => {
  submittingUser.value = true;
  try {
    const { $api } = useNuxtApp();
    await $api('/users', {
      method: 'POST',
      body: newUser.value
    });

    $q.notify({
      type: 'positive',
      message: 'User account created successfully.'
    });

    // Reset Form
    newUser.value = { role: 'doctor', name: '', email: '', password: '', phone: '', specialization: '' };
    fetchStaffUsers();
  } catch (err) {
    console.error('Submit user failed:', err);
    $q.notify({
      type: 'negative',
      message: err._data?.message || 'Failed to create account'
    });
  } finally {
    submittingUser.value = false;
  }
};

const changeUserStatus = async (userId, status) => {
  try {
    const { $api } = useNuxtApp();
    await $api(`/users/${userId}/status`, {
      method: 'PATCH',
      body: { status }
    });
    $q.notify({
      type: 'positive',
      message: 'User status updated successfully.'
    });
    fetchStaffUsers();
  } catch (err) {
    console.error('Change status failed:', err);
  }
};

// Schedulers
const selectedDocForSchedule = ref(null);
const selectDocSchedule = async (doc) => {
  if (selectedDocForSchedule.value?._id === doc._id) {
    selectedDocForSchedule.value = null;
    return;
  }
  selectedDocForSchedule.value = doc;
  try {
    const data = await fetchSchedule(doc._id);
    
    // Normalize dates to ISO string format YYYY-MM-DD for date inputs
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
    console.error('Load schedule failed:', err);
  }
};

const addWeeklyShift = () => {
  scheduleForm.value.weeklyAvailability.push({
    dayOfWeek: 1, // Monday default
    slots: [{ startTime: '09:00', endTime: '13:00' }]
  });
};

const removeWeeklyShift = (index) => {
  scheduleForm.value.weeklyAvailability.splice(index, 1);
};

const addHoliday = () => {
  scheduleForm.value.holidays.push({
    date: new Date().toISOString().split('T')[0],
    description: 'Clinic Closed'
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

const handleSaveSchedule = async () => {
  if (!selectedDocForSchedule.value) return;
  savingSchedule.value = true;
  try {
    await saveSchedule(selectedDocForSchedule.value._id, scheduleForm.value);
    $q.notify({
      type: 'positive',
      message: 'Schedule configuration saved successfully.'
    });
  } catch (err) {
    console.error('Save schedule failed:', err);
    $q.notify({
      type: 'negative',
      message: err.message || 'Failed to save schedule'
    });
  } finally {
    savingSchedule.value = false;
  }
};

// Appointments
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
      message: 'Appointment cancelled successfully. Email notification sent.'
    });
    cancelDialog.value = false;
    cancelReason.value = '';
    appToCancel.value = null;
    loadAppointments();
  } catch (err) {
    console.error('Cancel failed:', err);
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
      message: 'Appointment rescheduled successfully. Email notification sent.'
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
