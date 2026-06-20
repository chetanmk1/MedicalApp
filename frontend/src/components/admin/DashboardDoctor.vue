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
        <q-tab-panel name="appointments" class="q-pa-none">
          <q-card flat bordered style="border-radius: 16px;" class="q-pa-md glass-card">
            <q-card-section class="q-pb-none">
              <div class="row justify-between items-center q-mb-md">
                <div class="text-subtitle1 font-weight-bold text-slate-800">Booked Patients List</div>
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
                  <q-btn flat icon="refresh" color="grey-6" @click="fetchAppointments">
                    <q-tooltip>Reload</q-tooltip>
                  </q-btn>
                </div>
              </div>

              <div v-if="filteredAppointments.length === 0" class="text-center q-py-xl glass-card relative-position q-mt-md" style="border-radius: 16px; min-height: 220px;">
                <div class="q-pt-md">
                  <q-icon name="event_busy" size="64px" color="negative" class="q-mb-md" style="opacity: 0.7;" />
                  <div class="text-h6 text-negative font-weight-bold">No Appointments Found</div>
                  <div class="text-subtitle1 text-grey-7 q-mt-sm" v-if="filterDate">
                    No appointments found for the selected date: <strong class="text-slate-800">{{ formatDateWithDayFallback(filterDate) }}</strong>.
                  </div>
                  <div class="text-subtitle1 text-grey-7 q-mt-sm" v-else>
                    No appointments found in the system.
                  </div>
                </div>
              </div>

              <div class="relative-position" v-else>
                <q-scroll-area ref="appointmentScrollArea" @scroll="onAppointmentScroll" :style="{ height: 'calc(100vh - 230px)', minHeight: '450px', borderRadius: '12px', backgroundColor: $q.dark.isActive ? '#181818' : '#f8fafc' }">
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
                        <!-- Left: Patient Avatar & Initials -->
                        <div class="row items-center col-12 col-sm-6 q-gutter-x-md">
                          <q-avatar color="blue-1" text-color="blue-8" size="42px" class="font-weight-bold shadow-1">
                            {{ getInitials(app.patientId?.name) }}
                          </q-avatar>
                          <div>
                            <div :class="['text-subtitle1 font-weight-bold', $q.dark.isActive ? 'text-white' : 'text-slate-900']">{{ app.patientId?.name || 'Unknown Patient' }}</div>
                            <div class="text-caption text-grey-6 row items-center q-gutter-x-xs">
                              <q-icon name="phone" size="14px" />
                              <span>{{ app.patientId?.phone || 'No phone' }}</span>
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
                          
                          <div v-if="app.status !== 'cancelled' && app.status !== 'completed'">
                            <q-btn unelevated dense color="negative" icon="cancel" label="Cancel" size="sm" class="q-px-sm" @click.stop="confirmCancelApp(app)" />
                          </div>
                          <q-icon name="chevron_right" color="grey-6" />
                        </div>
                      </div>

                      <q-separator class="q-my-md" />

                      <!-- Details Grid -->
                      <div :class="['row q-col-gutter-md', $q.dark.isActive ? 'text-grey-3' : 'text-slate-800']">
                        <div class="col-12 col-sm-6 row items-center q-gutter-x-sm">
                          <q-icon name="schedule" size="20px" color="secondary" />
                          <div>
                            <div class="text-caption text-grey-6">Date & Time Slot</div>
                            <div class="text-weight-medium">{{ formatDateWithDay(app.date) }}</div>
                            <div class="text-caption text-secondary text-weight-bold">
                              {{ formatTime(app.startTime) }} - {{ formatTime(app.endTime) }}
                            </div>
                          </div>
                        </div>

                        <div class="col-12 col-sm-6 row items-center q-gutter-x-sm" v-if="app.notes">
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
        </q-tab-panel>

        <!-- Availability Schedule Self Configuration Panel -->
        <q-tab-panel name="availability" class="q-gutter-y-md">
          <q-card flat bordered class="bg-grey-1" style="border-radius: 12px;">
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
                          <q-input :model-value="formatTime(slot.startTime)" outlined dense label="Start" readonly class="cursor-pointer">
                            <template v-slot:append>
                              <q-icon name="access_time" class="cursor-pointer" />
                            </template>
                            <q-popup-proxy transition-show="scale" transition-hide="scale">
                              <q-time v-model="slot.startTime" mask="HH:mm" :format24h="false">
                                <div class="row items-center justify-end">
                                  <q-btn v-close-popup label="Close" color="primary" flat />
                                </div>
                              </q-time>
                            </q-popup-proxy>
                          </q-input>
                        </div>
                        <div class="col-6">
                          <q-input :model-value="formatTime(slot.endTime)" outlined dense label="End" readonly class="cursor-pointer">
                            <template v-slot:append>
                              <q-icon name="access_time" class="cursor-pointer" />
                            </template>
                            <q-popup-proxy transition-show="scale" transition-hide="scale">
                              <q-time v-model="slot.endTime" mask="HH:mm" :format24h="false">
                                <div class="row items-center justify-end">
                                  <q-btn v-close-popup label="Close" color="primary" flat />
                                </div>
                              </q-time>
                            </q-popup-proxy>
                          </q-input>
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
                      <q-input v-model="holiday.date" outlined dense label="Date" readonly class="cursor-pointer">
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
                      <q-input v-model="leave.startDate" outlined dense label="Start Date" readonly class="cursor-pointer">
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
                      <q-input v-model="leave.endDate" outlined dense label="End Date" readonly class="cursor-pointer">
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
              {{ selectedApp.patientId?.name ? selectedApp.patientId.name.charAt(0).toUpperCase() : '?' }}
            </q-avatar>
            <div>
              <div class="text-h6 font-weight-bold text-slate-800">{{ selectedApp.patientId?.name || 'Unknown Patient' }}</div>
              <q-chip size="sm" :color="getAppStatusColor(selectedApp.status)" text-color="white" :label="selectedApp.status.toUpperCase()" class="q-ma-none" />
            </div>
          </div>
          
          <q-separator class="q-my-md" />
          
          <div class="q-gutter-y-md">
            <div class="row q-pb-sm" style="border-bottom: 1px solid #e2e8f0;">
              <div class="col-4 text-grey-7 font-weight-bold">Patient Name:</div>
              <div class="col-8 text-slate-800 font-weight-bold">{{ selectedApp.patientId?.name || 'Unknown Patient' }}</div>
            </div>

            <div class="row q-pb-sm" style="border-bottom: 1px solid #e2e8f0;">
              <div class="col-4 text-grey-7 font-weight-bold">Date & Time:</div>
              <div class="col-8 text-slate-800">
                {{ formatDateWithDay(selectedApp.date) }}<br/>
                {{ formatTime(selectedApp.startTime) }} - {{ formatTime(selectedApp.endTime) }}
              </div>
            </div>
            
            <div class="row q-pb-sm" style="border-bottom: 1px solid #e2e8f0;">
              <div class="col-4 text-grey-7 font-weight-bold">Phone Number:</div>
              <div class="col-8 text-slate-800">{{ selectedApp.patientId?.phone || 'N/A' }}</div>
            </div>
            
            <div class="row q-pb-sm" style="border-bottom: 1px solid #e2e8f0;">
              <div class="col-4 text-grey-7 font-weight-bold">Email:</div>
              <div class="col-8 text-slate-800">{{ selectedApp.patientId?.email || 'N/A' }}</div>
            </div>
            
            <div class="row q-pb-sm" style="border-bottom: 1px solid #e2e8f0;">
              <div class="col-4 text-grey-7 font-weight-bold">Age / Gender:</div>
              <div class="col-8 text-slate-800">
                {{ selectedApp.patientId?.age ? selectedApp.patientId.age + ' yrs' : 'N/A' }} / 
                {{ selectedApp.patientId?.gender ? selectedApp.patientId.gender : 'N/A' }}
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
          <q-btn v-if="selectedApp && selectedApp.status !== 'cancelled'" outline color="negative" label="Cancel Appointment" @click="confirmCancelApp(selectedApp)" />
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
            placeholder="e.g. Doctor is unavailable, emergency, etc."
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
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useQuasar } from 'quasar';
import { useDashboardTab } from '~/composables/useDashboardTab';
import { useFormat } from '~/composables/useFormat';

const $q = useQuasar();
const authStore = useAuthStore();
const { $api } = useNuxtApp();

const { activeTab: tab } = useDashboardTab();
const { formatDate, formatTime, formatDateWithDay } = useFormat();


const appointments = ref([]);
const filterDate = ref(''); // Default to all
const filterStatus = ref('all'); // Default to all
const detailsDialog = ref(false);
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
const cancelDialog = ref(false);
const selectedApp = ref(null);
const appToCancel = ref(null);
const cancelReason = ref('');
const savingSchedule = ref(false);

const formatDateWithDayFallback = (dateStr) => {
  if (!dateStr) return 'Any Date';
  return formatDateWithDay(dateStr);
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

const openDetails = (app) => {
  selectedApp.value = app;
  detailsDialog.value = true;
};



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

const confirmCancelApp = (app) => {
  appToCancel.value = app;
  cancelReason.value = '';
  cancelDialog.value = true;
};

const submitCancelApp = async () => {
  if (!cancelReason.value.trim() || !appToCancel.value) return;

  try {
    await $api(`/appointments/${appToCancel.value._id}/cancel`, {
      method: 'PATCH',
      body: { reason: cancelReason.value.trim() }
    });
    $q.notify({
      type: 'positive',
      message: 'Appointment cancelled. Notification sent to patient.'
    });
    cancelDialog.value = false;
    detailsDialog.value = false;
    cancelReason.value = '';
    appToCancel.value = null;
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

const validateSchedule = () => {
  const days = scheduleForm.value.weeklyAvailability.map(s => s.dayOfWeek);
  if (days.length !== new Set(days).size) {
    return 'Duplicate days found in Weekly shifts. Each day can only be added once.';
  }

  const holDates = scheduleForm.value.holidays.map(h => h.date);
  if (holDates.length !== new Set(holDates).size) {
    return 'Duplicate dates found in Holidays & Closures.';
  }

  for (let i = 0; i < scheduleForm.value.leaves.length; i++) {
    const l1 = scheduleForm.value.leaves[i];
    const s1 = new Date(l1.startDate).setHours(0,0,0,0);
    const e1 = new Date(l1.endDate).setHours(0,0,0,0);
    
    if (s1 > e1) return 'Leave start date cannot be after end date.';

    for (let j = i + 1; j < scheduleForm.value.leaves.length; j++) {
      const l2 = scheduleForm.value.leaves[j];
      const s2 = new Date(l2.startDate).setHours(0,0,0,0);
      const e2 = new Date(l2.endDate).setHours(0,0,0,0);
      if (s1 <= e2 && s2 <= e1) return 'Overlapping dates found in Leave Blocking.';
    }
  }

  for (const holiday of scheduleForm.value.holidays) {
    const hDate = new Date(holiday.date).setHours(0,0,0,0);
    for (const leave of scheduleForm.value.leaves) {
      const lStart = new Date(leave.startDate).setHours(0,0,0,0);
      const lEnd = new Date(leave.endDate).setHours(0,0,0,0);
      if (hDate >= lStart && hDate <= lEnd) {
        return `Holiday on ${holiday.date} conflicts with a Leave block (${leave.startDate} to ${leave.endDate}).`;
      }
    }
  }

  return null;
};

const saveSchedule = async () => {
  const errorMsg = validateSchedule();
  if (errorMsg) {
    $q.notify({ type: 'negative', message: errorMsg });
    return;
  }
  
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

const getStatusHexColor = (status) => {
  switch (status) {
    case 'confirmed': return '#10b981';
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
