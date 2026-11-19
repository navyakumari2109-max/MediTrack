# MediTrack – Single User Medicine Reminder System

> *A modern, responsive, installable Progressive Web App (PWA) medicine reminder system built with HTML5, CSS3, Vanilla JavaScript, and Browser Local Storage.*

---

## 1. Project Overview

**MediTrack** is a single-user healthcare web application designed to help individuals adhere to their prescribed medical regimens. It addresses a common and serious public health challenge: medication non-adherence. 

The application is purposefully designed to be **instantaneous and frictionless**:
- **No Login / Registration Required**: Direct access to the dashboard upon opening.
- **100% Client-Side Privacy**: All prescription details, reminders, and intake logs remain stored entirely inside the user's browser via HTML5 `localStorage`. No data is uploaded to external cloud databases or third-party servers.
- **Real-Time Reminder Engine**: Automated in-app modals, HTML5 Web Audio chimes, and browser desktop notifications.
- **Inventory & Expiry Tracking**: Automatic inventory deduction when doses are marked as "Taken", along with early low-stock warning banners.

---

## 2. Technology Stack

- **Technology Stack**:
  - **Markup & Semantics**: HTML5 (PWA Web App Manifest, offline meta tags)
  - **Styling & Mobile Design**: CSS3 Custom Properties, Responsive Breakpoints, Mobile Bottom Navigation
  - **UI Framework & Icons**: Bootstrap 5.3.3 & Font Awesome 6.5.2
  - **Scripting & Business Logic**: Pure Vanilla JavaScript (ES6+ modular architecture, zero frameworks)
  - **Progressive Web App (PWA)**: Service Worker (`sw.js`), Web App Manifest (`manifest.json`), Offline Caching, `beforeinstallprompt` Install Engine
  - **Data Persistence**: HTML5 Browser `localStorage` with JSON serialization
  - **Audio Synthesis**: HTML5 Web Audio API (`AudioContext`)
  - **System Notifications**: HTML5 Desktop & Mobile `Notification` API

---

## 3. Project Folder Structure

```text
MediTrack/
├── index.html              # Home & Dashboard (Today's schedule, metrics, upcoming queue)
├── add-medicine.html       # Add & Edit medicine form with dynamic time slots
├── medicines.html          # My Medicines (Card directory, search, filter, stock refill)
├── reminders.html          # Real-time reminders timeline & notification permission controls
├── history.html            # Intake audit log with filters and CSV export
├── settings.html           # Sound options, stock thresholds, demo data, and storage tools
├── css/
│   └── style.css           # Healthcare design system, themes, and responsive rules
├── js/
│   ├── storage.js          # LocalStorage CRUD layer, schedule generator, and demo loader
│   ├── app.js              # Global app controller, live clock, audio chime, and timer loop
│   ├── dashboard.js        # Dashboard metrics, adherence progress, and daily schedule
│   ├── medicines.js        # Add/Edit form validation and medicine directory logic
│   ├── reminders.js        # Reminders schedule manager and notification permissions
│   ├── history.js          # Medicine history table, search, filters, and CSV exporter
│   └── settings.js         # Settings manager, storage statistics, and factory reset
├── assets/
│   ├── icons/              # Notification icons and vector graphics
│   └── images/             # App illustrations and graphic assets
└── README.md               # Project documentation and B.Tech viva guide
```

---

## 4. Key Features & Modules

### A. Dashboard (`index.html`)
- **Live Header**: Real-time 24-hour clock and dynamic current date display.
- **Metric Summary Cards**: Total medicines, Today's scheduled doses, Completed doses, Pending doses, Missed doses, and an Adherence Rate Progress bar.
- **No. of Days Completed & Adherence Streak**:
  - Automatically calculates total unique days with completed doses.
  - Active daily streak counter (e.g. `🔥 5-Day Active Streak`) encouraging medication discipline.
- **User Body Weight Vitals Card**:
  - Displays current body weight (kg / lbs) and target weight.
  - Single-click **"+ Log Weight"** modal for recording daily or periodic weigh-ins.
- **Weekly Checkup Reminder Alert Card**:
  - Displays the upcoming weekly routine doctor appointment/consultation with doctor name, scheduled day/time, location, and quick "Attended" action.
- **Low Medicine Stock Banner**: Prominently highlights medications that have dropped below the configured reserve threshold.
- **Today's Medicine Schedule**: Every dose scheduled for today with quick single-click status buttons:
  - `Mark as Taken`: Automatically deducts 1 unit from inventory stock.
  - `Mark as Missed`: Updates the dose status to Missed for clinical adherence tracking.
  - `Keep as Pending`: Keeps the reminder active in the upcoming queue.
- **Upcoming Reminders Widget**: Chronological list of today's remaining doses.

### B. Add & Edit Medicine (`add-medicine.html`)
- **Fields Supported**:
  - Medicine Name (e.g., Amoxicillin, Metformin)
  - Dosage Amount (e.g., 1 Capsule, 500 mg, 5 ml)
  - Medicine Type (Tablet, Capsule, Syrup, Injection, Drops, Inhaler, Other)
  - Start Date & Optional End Date (for continuous or acute medications)
  - Frequency (Once daily, Twice daily, Three times daily, Custom)
  - **Dynamic Multiple Reminder Times**: Add/remove multiple specific times per medicine (e.g., `08:00`, `14:00`, `20:00`)
  - Intake Instruction (Before food, After food, With food, Empty stomach, Bedtime, Other)
  - Remaining Stock Quantity (tracked and decremented upon intake)
  - Expiry Date (with expired/expiring warnings)
  - Optional Medical Notes / Doctor's Advice
- **Unified Form**: Handles both creating new records and updating existing ones seamlessly.

### C. My Medicines (`medicines.html`)
- Responsive card view displaying medicine type icon, dosage, scheduled times, remaining quantity, and expiry status.
- **Course Progress & Days Completed**: Displays `Day X of Y completed` with an animated percentage bar for medicines with scheduled end dates, or `Active for X days` for ongoing medications.
- **Live Search**: Instant keyword search by medicine name, dosage, or notes.
- **Filter Controls**: Filter by Medicine Type and Stock Level (Low Stock vs. Available).
- **Stock Refill Modal**: Quick "+ Refill Stock" button to add units when new supplies are purchased.
- **Edit & Delete Actions**: Edit prescription details or delete with a confirmation modal.

### D. Real-Time Reminders & Weekly Checkups (`reminders.html`)
- **Weekly Checkup Reminders Section**:
  - Configure recurring weekly clinical checkups (e.g., *Every Saturday at 10:00 AM with Dr. Ramesh*).
  - Add, edit, delete, and mark checkups as attended.
  - Integrated with the real-time background alarm loop: triggers audio chime, system desktop notification, and modal alert when checkup day and time arrives!
- **System Notification Management**: Request and display real-time permission status (`Granted`, `Denied`, or `Prompt`).
- **Interactive Test Button**: Allows students and evaluators to test sound chimes and desktop notifications on demand.
- **Persistent Alarm Loop**: `app.js` runs a continuous background watcher that checks pending doses every 10 seconds against the system clock.
- **Duplicate Prevention**: A persistent alert cache ensures users are not spammed with duplicate popups for the same scheduled dose.
- **In-App Reminder Modal**: An attractive popup alert with "Mark as Taken", "Mark as Missed", and "Remind Later" actions.

### E. Medicine Intake History (`history.html`)
- Complete audit trail of all past and current doses.
- **Multi-Filter System**: Filter by Status (`All`, `Taken`, `Missed`, `Pending`), Date, or Medicine Name.
- **Status Override**: Ability to change status (e.g., mark a missed dose as taken later).

### F. Settings & Health Profile (`settings.html`)
- **User Health Profile & Weight Configuration**:
  - Configure current body weight, target weight, and unit (`kg` or `lbs`).
  - View weight history logs.
- **Toggle Sound Alerts**: Enable or disable Web Audio synthesized chimes.
- **Customizable Low Stock Threshold**: Adjust alert limit (e.g., warn when $\le 5$ units remain).
- **Storage Metrics**: View real-time count of saved records and local storage footprint in Kilobytes.
- **Factory Reset**: Completely wipe application data with a safety confirmation modal.

---

## 5. Local Storage Schema

All data is structured under namespaced keys in the browser's `window.localStorage`:

### 1. `meditrack_medicines` (Array of Objects)
```json
[
  {
    "id": "med_1732021200000_abc123",
    "medicine_name": "Amoxicillin 500mg",
    "dosage": "1 Capsule",
    "medicine_type": "Capsule",
    "start_date": "2026-11-19",
    "end_date": "2026-11-26",
    "frequency": "Twice daily",
    "reminder_times": ["08:00", "20:00"],
    "instructions": "After food",
    "notes": "Complete full 7-day course",
    "remaining_quantity": 14,
    "expiry_date": "2027-08-15",
    "created_at": "2026-11-19T10:00:00.000Z",
    "updated_at": "2026-11-19T10:00:00.000Z"
  }
]
```

### 2. `meditrack_logs` (Array of Objects)
```json
[
  {
    "id": "log_med_1732021200000_abc123_2026-11-19_0800",
    "medicine_id": "med_1732021200000_abc123",
    "medicine_name": "Amoxicillin 500mg",
    "dosage": "1 Capsule",
    "medicine_type": "Capsule",
    "instructions": "After food",
    "scheduled_date": "2026-11-19",
    "scheduled_time": "08:00",
    "status": "Taken",
    "updated_at": "2026-11-19T08:02:15.000Z"
  }
]
```

### 3. `meditrack_settings` (Object)
```json
{
  "notificationsEnabled": true,
  "soundEnabled": true,
  "lowStockThreshold": 5,
  "autoMissedThresholdMinutes": 120
}
```

---

## 6. Mobile App Installation (Progressive Web App - PWA)

MediTrack is configured as an installable Progressive Web Application (PWA). When installed, it launches full-screen without browser address bars, places an app icon on the mobile home screen or app drawer, and functions offline.

### How to Install on Android (Chrome / Edge):
1. Open the website on your Android phone's Google Chrome or Edge browser.
2. Tap the **"Install App"** button in the header or in Settings, OR tap the Chrome menu (3 dots) &rarr; select **"Install App"** / **"Add to Home screen"**.
3. Confirm installation. The MediTrack icon will appear on your phone's home screen alongside native apps.

### How to Install on iPhone / iPad (Safari):
1. Open the website in **Safari** on your iOS device.
2. Tap the **Share** button (<i class="fas fa-arrow-up-from-bracket"></i> square with upward arrow) in the bottom navigation bar.
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **Add**. MediTrack will launch as a standalone iOS app with full-screen experience.

### How to Install on PC / Laptop (Windows / macOS / Linux):
1. In Google Chrome or Microsoft Edge, look for the **Install Icon** in the right side of the URL address bar.
2. Click **Install**. MediTrack will run in its own clean window as a desktop application.

---

## 7. How to Run the Project Locally

Because MediTrack uses standard HTML5, CSS3, and modern Vanilla JavaScript, it does not require complex build steps, package installations, or database setups.

### Option A: Direct Browser Launch (Simplest)
1. Navigate to the project directory:
   `c:\Users\hp\Desktop\Nvya Project\`
2. Double-click `index.html` to open it in Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari.
3. The application will start immediately on the dashboard.

### Option B: Local Static Server (Recommended for Desktop Notifications)
Modern browsers provide full access to the HTML5 Notification API when served over `http://localhost`:

**Using Python (Pre-installed on most systems):**
```bash
# In the project directory:
python -m http.server 8000
```
Open `http://localhost:8000` in your web browser.

**Using VS Code Live Server:**
1. Open the folder in Visual Studio Code.
2. Right-click `index.html` and select **"Open with Live Server"**.

---

## 7. Academic Viva / Project Defense Questions & Answers

### Q1: Why use LocalStorage instead of a server-side database like MySQL or MongoDB?
> **Answer:** For a dedicated single-user desktop or personal device assistant, `localStorage` provides **zero-latency**, **offline availability**, and **privacy by design**. Medical prescription data is never transmitted across the network, eliminating server attack surfaces, cloud hosting costs, and database synchronization overhead.

### Q2: How does the daily schedule generation avoid duplicate dose records?
> **Answer:** Every dose record has a deterministic unique ID constructed from the medicine ID, the scheduled date, and the scheduled time (e.g., `log_{medId}_{date}_{time}`). During initialization, `StorageManager.ensureTodayLogs()` checks for existing records before inserting new pending logs, guaranteeing idempotency.

### Q3: How do real-time reminders trigger without a backend server?
> **Answer:** The global script `app.js` runs a lightweight heartbeat interval using `setInterval()` every 10 seconds. It compares the current system time (`HH:MM`) against today's pending doses. When a match occurs, it invokes the HTML5 `Notification` API and the synthesized Web Audio chime, while caching the triggered alert in `localStorage` to avoid duplicate firing within the same minute.

### Q4: How is medicine inventory managed?
> **Answer:** Each medicine has a `remaining_quantity` attribute. When a user marks a scheduled dose as "Taken", the system decrements the stock by 1. If a dose is inadvertently marked as taken and changed back to "Pending", the stock is replenished. When stock falls below the user's defined threshold (default: 5 units), an alert banner is triggered.

---

## 8. Academic & Medical Disclaimer

> **Important Notice:**  
> This project was developed solely for academic and educational evaluation in a Final Year Bachelor of Technology (B.Tech) degree program. It demonstrates client-side data persistence, reactive DOM manipulation, and browser APIs. It is not an FDA/regulatory approved medical device, does not provide clinical diagnostic advice, and should not be used as the sole reminder mechanism for critical life-supporting medications.
