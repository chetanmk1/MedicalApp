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
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pa-none">
            <div v-if="filteredAppointments.length === 0" class="text-center q-py-xl text-grey-6">
              <div v-if="filterDate">No appointments found for the selected date.</div>
              <div v-else>No appointments recorded.</div>
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
                      <!-- Left: Patient Avatar & Initials -->
                      <div class="row items-center col-12 col-sm-6 q-gutter-x-md">
                        <q-avatar color="blue-1" text-color="blue-8" size="42px" class="font-weight-bold shadow-1">
                          {{ getInitials(app.patientId?.name) }}
                        </q-avatar>
                        <div>
                          <div :class="['text-subtitle1 font-weight-bold', $q.dark.isActive ? 'text-white' : 'text-slate-900']">{{ app.patientId?.name }}</div>
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
                        
                        <div class="row items-center q-gutter-xs">
                          <q-btn
                            unelevated
                            color="teal-8"
                            label="Check In"
                            size="sm"
                            class="q-px-sm"
                            @click.stop="handleCheckIn(app._id)"
                            v-if="app.status === 'confirmed'"
                          />
                          
                          <q-btn-dropdown flat dense color="grey-8" icon="more_vert" v-if="app.status !== 'cancelled' && app.status !== 'completed'" @click.stop>
                            <q-list style="min-width: 150px;">
                              <q-item clickable v-close-popup @click="openReschedule(app)">
                                <q-item-section avatar>
                                  <q-icon name="edit_calendar" color="primary" />
                                </q-item-section>
                                <q-item-section>Reschedule</q-item-section>
                              </q-item>
                              <q-item clickable v-close-popup @click="confirmCancelApp(app)" class="text-negative">
                                <q-item-section avatar>
                                  <q-icon name="cancel" color="negative" />
                                </q-item-section>
                                <q-item-section>Cancel</q-item-section>
                              </q-item>
                            </q-list>
                          </q-btn-dropdown>
                        </div>
                      </div>
                    </div>

                    <q-separator class="q-my-md" />

                    <!-- Details Grid -->
                    <div :class="['row q-col-gutter-md', $q.dark.isActive ? 'text-grey-3' : 'text-slate-800']">
                      <div class="col-12 col-sm-4 row items-center q-gutter-x-sm">
                        <q-icon name="medication" size="20px" color="primary" />
                        <div>
                          <div class="text-caption text-grey-6">Assigned Doctor</div>
                          <div class="text-weight-medium">Dr. {{ app.doctorId?.name }}</div>
                          <div class="text-caption text-grey-5">{{ app.doctorId?.specialization }}</div>
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
              <div class="col-4 text-grey-7 font-weight-bold">Doctor:</div>
              <div class="col-8 text-slate-800">Dr. {{ selectedApp.doctorId?.name }} ({{ selectedApp.doctorId?.specialization }})</div>
            </div>

            <div class="row q-pb-sm" style="border-bottom: 1px solid #e2e8f0;">
              <div class="col-4 text-grey-7 font-weight-bold">Date & Time:</div>
              <div class="col-8 text-slate-800">
                {{ formatDate(selectedApp.date) }}<br/>
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
          <q-btn v-if="selectedApp && selectedApp.status === 'confirmed'" unelevated color="teal-8" label="Check In" @click="handleCheckIn(selectedApp._id)" />
          <q-btn v-if="selectedApp && selectedApp.status !== 'cancelled' && selectedApp.status !== 'completed'" outline color="primary" label="Reschedule" @click="openReschedule(selectedApp)" />
          <q-btn v-if="selectedApp && selectedApp.status !== 'cancelled' && selectedApp.status !== 'completed'" unelevated color="negative" label="Cancel" @click="confirmCancelApp(selectedApp)" />
          <q-btn unelevated color="primary" label="Close" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

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
