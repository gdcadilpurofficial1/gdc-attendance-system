# GDC Adilpur — Attendance Portal
## Complete Production Deployment & Operations Guide

---

## 📌 Deployment Overview

* **Frontend:** Deployed to **Vercel** on subdomain **`attendance.gdcadilpur.edu.pk`** (Root: `client`)
* **Backend:** Deployed to **Render** as a Web Service (Root: `server`)
* **Database:** **MongoDB Atlas** Free Tier M0 (Cluster database: `attendace-site`)
* **Active Working Hours (Keep-Alive):** 7:00 AM to 6:00 PM PKT (Conserves Render 750 free monthly hours)

---

## Step 1: Publish to GitHub via GitHub Desktop

1. Open **GitHub Desktop**.
2. Click **File $\rightarrow$ Add Local Repository...** (or press `Ctrl + O`).
3. Select the project folder:
   ```
   C:\Users\rizwa\Desktop\attendance-system
   ```
4. Click **Add Repository**.
5. Click the blue **"Publish repository"** button in the top bar:
   * **Name:** `gdc-attendance-system` (or your preferred repository name).
   * **Keep this code private:** Checked or Unchecked (your choice).
6. Click **Publish Repository**. Your code is now live on GitHub.

---

## Step 2: Deploy Backend API on Render

1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New + $\rightarrow$ Web Service**.
3. Choose **Build and deploy from a Git repository** $\rightarrow$ Select `gdc-attendance-system`.
4. Configure the service settings:

| Setting | Exact Value to Enter |
| :--- | :--- |
| **Name** | `gdc-attendance-api` *(or your chosen name)* |
| **Region** | Singapore *(Fastest latency for Pakistan)* |
| **Branch** | `master` (or `main`) |
| **Root Directory** | `server` *(Important: Do not leave blank)* |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

5. Scroll down to **Environment Variables** and add the following 6 keys:

| Key | Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MONGO_URI` | `mongodb://gdcadilpur123_db_user:CQ88r7b9k5alYrIZ@ac-ovrpaj3-shard-00-00.vcdro2m.mongodb.net:27017,ac-ovrpaj3-shard-00-01.vcdro2m.mongodb.net:27017,ac-ovrpaj3-shard-00-02.vcdro2m.mongodb.net:27017/attendace-site?ssl=true&replicaSet=atlas-dya9wj-shard-0&authSource=admin&appName=gdc-official` |
| `JWT_SECRET` | `gdc_adilpur_attendance_ultra_secret_jwt_key_2026` |
| `CLIENT_URL` | `https://attendance.gdcadilpur.edu.pk` |
| `RENDER_EXTERNAL_URL` | `https://gdc-attendance-api.onrender.com` *(Replace with your actual Render URL if different)* |

6. Click **Deploy Web Service**.
7. In ~2 minutes, your service will be live. **Copy the Render URL** (e.g. `https://gdc-attendance-api.onrender.com`).

---

## Step 3: Deploy Frontend on Vercel with Subdomain

1. Log in to your [Vercel Dashboard](https://vercel.com/).
2. Click **Add New... $\rightarrow$ Project**.
3. Import your `gdc-attendance-system` GitHub repository.
4. Configure the Project:
   * **Project Name:** `gdc-attendance`
   * **Framework Preset:** `Vite` (Auto-detected)
   * **Root Directory:** Click **Edit** and choose **`client`** *(Essential!)*
5. Under **Environment Variables**, add:
   * **Key:** `VITE_API_URL`
   * **Value:** `https://gdc-attendance-api.onrender.com/api` *(Your Render backend URL followed by `/api`)*
6. Click **Deploy**.
7. **Attach Subdomain:**
   * Once the initial deployment succeeds, go to **Settings $\rightarrow$ Domains**.
   * In the input box, type: `attendance.gdcadilpur.edu.pk`
   * Click **Add**.
   * **DNS Routing:** Because `gdcadilpur.edu.pk` DNS is hosted on your Vercel account, Vercel routes the subdomain and provisions a free SSL certificate automatically within 60 seconds without any PKNIC changes.

---

## Step 4: Login Credentials

### 1. Principal & System Administrator
* **URL:** `https://attendance.gdcadilpur.edu.pk/login`
* **Username / Email:** `admin@attendance.gdcadilpur.edu.pk`
* **Password:** `Admin899199#`
* **Capabilities:** Full management of students (185 enrolled), classes, degrees, faculty accounts, parent messaging hub, and Excel reporting.

### 2. Faculty / Subject Teacher (Prof. Farhan Kalwar)
* **URL:** `https://attendance.gdcadilpur.edu.pk/login`
* **Username / Email:** `farhan@teacher.gdcadilpur.edu.pk`
* **Password:** `FarhanKalwar07@`
* **Assigned Classes:**
  * XI Pre-Medical (Boys) — 57 Students
  * XI Pre-Medical (Girls) — 52 Students
  * XI Pre-Engineering — 76 Students
* **Workflow:** Quick roll call $\rightarrow$ Save Draft or Confirm $\rightarrow$ Automated Parent Notifications.

---

## Step 5: Messaging & Gateway Setup

### A. WhatsApp Web Bot
1. Log in as Admin $\rightarrow$ Go to **Messaging Hub**.
2. Click **"Scan QR to Link"**.
3. Open WhatsApp on the college phone $\rightarrow$ **Linked Devices** $\rightarrow$ Scan the QR code.
4. *To change phone or SIM:* Tap **"Unlink Device"** $\rightarrow$ scan with the new phone. Done in 15 seconds.

### B. Office Android SIM SMS Gateway
1. Insert a Jazz/Zong SIM with an SMS bundle into a spare Android phone connected to office Wi-Fi.
2. Install the free open-source app **Android SMS Gateway** (from GitHub or Play Store).
3. Enter:
   * **Server URL:** `https://gdc-attendance-api.onrender.com/api/sms/poll`
   * **API Key:** `gdc_sms_secret_2026`
4. Tap **"Start Service"**. The phone will dispatch SMS to absentees with the 18-second anti-ban delay.
