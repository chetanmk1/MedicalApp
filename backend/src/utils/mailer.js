// Simple simulation of transactional emails for appointments and clinic onboarding
export const sendMail = async ({ to, subject, html }) => {
  console.log('\n=================== [EMAIL NOTIFICATION SENT] ===================');
  console.log(`[TO]:      ${to}`);
  console.log(`[SUBJECT]: ${subject}`);
  console.log(`[CONTENT]:\n${html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}`);
  console.log('=================================================================\n');
  return { success: true, messageId: `mock_${Date.now()}` };
};

export const sendBookingNotification = async (appointment, patient, doctor, clinic, action = 'created') => {
  const patientEmail = patient.email;
  const doctorEmail = doctor.email;
  const formattedDate = new Date(appointment.date).toDateString();
  const time = `${appointment.startTime} - ${appointment.endTime}`;

  let subject = '';
  let html = '';

  if (action === 'created') {
    subject = `Appointment Confirmed - ${clinic.name}`;
    html = `
      <h1>Your Appointment is Confirmed</h1>
      <p>Dear ${patient.name},</p>
      <p>Your appointment with Dr. ${doctor.name} at ${clinic.name} has been booked.</p>
      <p><strong>Date:</strong> ${formattedDate}</p>
      <p><strong>Time:</strong> ${time}</p>
      <p>Thank you for using our platform!</p>
    `;
  } else if (action === 'cancelled') {
    subject = `Appointment Cancelled - ${clinic.name}`;
    html = `
      <h1>Appointment Cancellation Notice</h1>
      <p>Dear ${patient.name},</p>
      <p>Your appointment with Dr. ${doctor.name} at ${clinic.name} on ${formattedDate} at ${time} has been cancelled.</p>
    `;
  } else if (action === 'rescheduled') {
    subject = `Appointment Rescheduled - ${clinic.name}`;
    html = `
      <h1>Appointment Rescheduled</h1>
      <p>Dear ${patient.name},</p>
      <p>Your appointment with Dr. ${doctor.name} at ${clinic.name} has been rescheduled.</p>
      <p><strong>New Date:</strong> ${formattedDate}</p>
      <p><strong>New Time:</strong> ${time}</p>
    `;
  }

  // Notify patient
  await sendMail({ to: patientEmail, subject, html });

  // Notify doctor
  const docSubject = `[Doctor Notification] ${subject}`;
  const docHtml = `
    <h2>Appointment Update</h2>
    <p>Doctor ${doctor.name}, your appointment with patient ${patient.name} has been ${action}.</p>
    <p><strong>Date:</strong> ${formattedDate}</p>
    <p><strong>Time:</strong> ${time}</p>
  `;
  await sendMail({ to: doctorEmail, subject: docSubject, html: docHtml });
};
