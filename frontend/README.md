# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.




# MedCare Platform - Premium Features Backlog

This document maintains a catalog of premium, enterprise-grade features proposed to elevate the MedCare application into a top-tier healthcare SaaS platform. Features are grouped by target roles and difficulty.

---

## 📊 Analytics & Reporting (Clinic Admin / Doctor)

### 1. Interactive Operations & Revenue Dashboard
* **Use Case:** Provides clinic administrators and owners with high-level insights into how their business is running.
* **Key Capabilities:**
  * **Weekly Booking Trends:** Visualizing appointment frequencies using a clean area/line chart.
  * **Peak Hour Analysis:** A bar chart showing the busiest hours of the day (e.g., 10 AM - 12 PM is peak booking time).
  * **Cancellation Rate Analytics:** Pie chart detailing reasons for cancellation (e.g., "Personal Emergency", "Late check-in", "Doctor reschedule").
  * **Revenue Estimator:** Aggregates consulting fees to project monthly revenues.
* **Technology Stack:** ApexCharts / ChartJS inside a custom glassmorphism card component.

### 2. Sleek Interactive Audit Log Explorer
* **Use Case:** Clinic Admins can track exactly what events occurred for security, debugging, and audit compliance.
* **Key Capabilities:**
  * Clean vertical timeline view showing appointment bookings, check-ins, status transitions, and cancellations.
  * Detailed logs showing exactly **Who** did it, **When** it occurred, and **What** was changed.
  * Multi-filter search (filter by Patient, Doctor, Date, or Action Type).
* **Technology Stack:** Quasar Timeline component linked to a backend MongoDB Audit Logs collection.

---

## 🔔 Real-time & Collaboration (Clinic Admin / Doctor / Receptionist)

### 3. Live Notification Center & Activity Feed
* **Use Case:** Clinic staff can react to patient check-ins, new bookings, or cancellations immediately without reloading.
* **Key Capabilities:**
  * Floating notification bell with unread badge indicators.
  * Immediate toast notifications (e.g., *"Patient Jane Doe checked in for 2:30 PM"*).
  * Collapsible right-hand side panel showing recent activities.
* **Technology Stack:** Socket.io (WebSockets) or Server-Sent Events (SSE).

### 4. Telehealth Video Consultations
* **Use Case:** Allows patients and doctors to have virtual appointments directly inside the MedCare portal.
* **Key Capabilities:**
  * One-click "Join Virtual Room" button on the appointment detail card.
  * Integrated video, audio, and chat panel in a split-screen view.
  * Screen-sharing for showing reports or prescriptions.
* **Technology Stack:** WebRTC Integration (via Jitsi Meet iframe or custom Daily.co / Twilio Video implementation).

---

## 🎫 Patient Experience & Automation (Patient / Receptionist)

### 5. Smart QR-Code Kiosk Check-In
* **Use Case:** Streamlines the patient check-in flow when walking into a physical clinic.
* **Key Capabilities:**
  * Every confirmed appointment generates a unique QR code in the Patient’s portal (and emailed to them).
  * The clinic receptionist can scan this QR code with a webcam/scanner, instantly updating status to **Checked In**.
  * Alternatively, patients scan the QR code at an iPad kiosk, notifying the doctor immediately.
* **Technology Stack:** `qrcode.vue` on frontend, webcam scanner plugin, and backend status-updating route.

### 6. Stripe Payment Gateway Integration
* **Use Case:** Allows clinics to secure appointments and charge deposit or consultation fees upfront.
* **Key Capabilities:**
  * Checkout sheet displayed during the final step of booking an appointment.
  * Automatic invoice generation (PDF) with clinic details.
  * Refund processing automatically triggered upon cancellation (if within policy limits).
* **Technology Stack:** Stripe SDK, Backend Stripe Webhooks, PDFKit for invoices.

---

## 🧠 Intelligence & AI (Doctor)

### 7. AI-Powered Clinical Notes Summarizer
* **Use Case:** Saves doctors valuable time when writing down complex medical histories or prescriptions.
* **Key Capabilities:**
  * The doctor speaks or types brief shorthand notes (e.g., *"pt reports headache 3d, mild fever, prescribed paracetamol"*).
  * AI expands it into a fully structured, formatted clinical report (History, Diagnosis, Plan).
  * Summarizes patient historical records to give a 3-sentence summary of the patient before they enter the room.
* **Technology Stack:** OpenAI API or Gemini API integration on the backend.


### 8. PDF for Medical Report
* **Use Case:** To generate a PDF of the medical report.
* **Key Capabilities:**
    * Generate PDF of the medical report.
    * Share PDF with patient.
    * Print PDF of the medical report.
* **Technology Stack:** `pdfmake` library.


### 9. Role-Based Feature Visibility to the clinic/Doctor based on subscription 
* **Use Case:** To show features to the clinic/Doctor based on their subscription.
* **Key Capabilities:**
    * Admin will create feature plan and set price and features.
    * Admin can add or remove features from the plan for the clinic/Doctor.
    * Admin can set subscription for the clinic/Doctor.
    * Show features to the clinic based on their subscription.
    * Hide features from the clinic based on their subscription.
* **Technology Stack:** `pdfmake` library.





