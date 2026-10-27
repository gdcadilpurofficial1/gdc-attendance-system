# GDC Adilpur — Attendance Management System (AMS)
### Official Attendance Portal for Government Degree College Adilpur, Sindh

---

## 🚀 System Architecture Overview

* **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4 PWA (Installable on mobile).
* **Offline Engine:** IndexedDB (Dexie.js) + Service Worker with Idempotency Key sync.
* **Backend:** Node.js + Express (ESM) + Mongoose + JWT Auth (HTTP-only secure cookies) + NoSQL sanitization.
* **Automated Messaging:**
  * **WhatsApp Web Bot:** Lightweight WebSocket engine (`@whiskeysockets/baileys`). QR scan once to link; 1-click unlink to change phone/SIM.
  * **Office Android SIM Gateway:** Integrates with free *Android SMS Gateway* APK on a spare office phone with an unlimited cellular SMS bundle.
  * **Anti-Ban Pacer:** 15–20 second configurable delay between dispatches.
* **Chronic Truancy Detector:** Automatically flags students with $\ge 3$ consecutive absences for immediate administrative intervention.
* **2-Year Rolling Retention:** Automatically purges daily attendance logs older than 730 days (2 years) every month to keep MongoDB Atlas free tier ($\le 512\text{ MB}$) headroom above 90% forever.

---

## 🛠️ Local Development Setup

### 1. Prerequisites
* Node.js v18+ or v22+
* MongoDB running locally (`mongodb://127.0.0.1:27017/gdc_attendance`) or a MongoDB Atlas connection string.

### 2. Configure Environment Variables
Inside `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/gdc_attendance?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### 3. Seed Initial Accounts & Academic Programs
Run from the root directory:
```bash
npm run seed
```
This sets up:
* **Admin Login:** Username: `admin` | Password: `Admin@GDC2026!`
* **Principal Login:** Username: `principal` | Password: `Principal@GDC2026!`
* **Teacher Login:** Username: `tariq_science` | Password: `Teacher@GDC2026!`
* **Programs:** FSC Pre-Med, FSC Pre-Eng, ICS, I.Com, Arts, BS English, BS Zoology.
* **Classes:** XI Pre-Medical A, XI Pre-Engineering A, XI Computer Science A, XII Pre-Medical A.
* **Sample Students:** 10 sample students enrolled in XI Pre-Medical A.

### 4. Start the Application
* **Backend:**
  ```bash
  cd server && npm run dev
  ```
* **Frontend:**
  ```bash
  cd client && npm run dev
  ```
Open `http://localhost:5173` in your browser or phone on the same Wi-Fi.

---

## 📱 Teacher Roll Call & Confirmation Workflow

1. Teacher logs in on mobile PWA (`/login`).
2. Taps assigned class (e.g. *XI Pre-Medical A*).
3. Roll call loads with all students set to **PRESENT** by default.
4. Tapping any student row toggles status: **PRESENT $\rightarrow$ ABSENT $\rightarrow$ LEAVE**.
5. Students with $\ge 2$ consecutive absences display a warning badge: `⚠️ 2 Days Absent`.
6. **Save Draft:** Teacher can save progress at any time without triggering messages.
7. **Confirm & Finalize:**
   * Teacher clicks **"Confirm & Finalize"**.
   * A confirmation modal displays the count of absentees.
   * Upon clicking **"Yes, Confirm & Queue Notices"**, the attendance session is permanently locked and absentees enter the automated dispatch queue.

---

## 💬 Automated Parent Messaging Setup

### Option 1: WhatsApp Bot (Direct from College Number)
1. Go to **Admin Dashboard $\rightarrow$ Messaging Hub**.
2. Click **"Scan QR to Link"**.
3. On the college phone, open WhatsApp $\rightarrow$ **Linked Devices** $\rightarrow$ **Link a Device** $\rightarrow$ Scan the QR code.
4. **Changing Number / SIM:** Click **"Unlink"** $\rightarrow$ scan with the new phone. Done in 15 seconds.

### Option 2: Office Android SIM SMS Gateway (Reaches Basic Keypad Phones)
1. Insert a Jazz/Zong SIM with an SMS bundle into a spare Android phone connected to office Wi-Fi.
2. Install the free **Android SMS Gateway** APK (from GitHub or Play Store).
3. In the app settings:
   * **Server URL:** `https://gdc-attendance-api.onrender.com/api/sms/poll`
   * **API Key:** Copy the secret key from your **Messaging Hub** screen.
4. Tap **"Start Service"**. The phone will automatically dispatch cellular SMS to absentees with the 18-second delay.

---

## 🌐 Subdomain & Production Deployment

### 1. Frontend on Vercel (`attendance.gdcadilpur.edu.pk`)
1. In your existing Vercel account, create a new project importing the `client` directory.
2. In **Project Settings $\rightarrow$ Domains**, add: `attendance.gdcadilpur.edu.pk`.
3. Vercel automatically manages the DNS and provisions SSL within 60 seconds.

### 2. Backend on Render
1. Create a new Render Web Service using a **new college Gmail** (giving you an independent 750 free hours/month).
2. Set Environment Variables:
   * `CLIENT_URL=https://attendance.gdcadilpur.edu.pk`
   * `MONGO_URI=mongodb+srv://...`
   * `JWT_SECRET=...`
   * `RENDER_EXTERNAL_URL=https://gdc-attendance-api.onrender.com`
3. The built-in **Keep-Alive ping** automatically runs from 7:15 AM to 4:30 PM PKT, eliminating midday sleep cycles while conserving monthly free hours.
