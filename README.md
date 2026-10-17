# 🚀 Swiggy Instamart — Rack Audit Management App & Android App

A secure, mobile-first warehouse rack auditing and discrepancy tracking platform built specifically for **Swiggy Instamart dark store operations**. 

The app includes:
1. **Android App (Native Capacitor project + 1-Tap PWA install)** for warehouse pickers on Android smartphones, Zebra, and Honeywell scanner PDA terminals.
2. **Executive Admin Dashboard with Deep Picker Performance Tracking** to monitor individual picker accuracy, audit velocity, shift goals, and discrepancy discovery rates.

---

## 📱 Live Application Access

The server is active and running locally at:
👉 **`http://localhost:5000`**

Tap the top bar's **"📲 Android App"** button at any time to open the Android installer and scanner terminal guide!

---

## 🤖 Android App: Two Deployment Options

### Option A: Instant 1-Tap Android PWA Installation (Zero Build Setup)
Warehouse pickers can install the application directly onto any Android device (Chrome, Edge, Samsung Internet, or Zebra Enterprise Browser):
1. Connect the Android phone / RF scanner terminal to the warehouse local Wi-Fi.
2. In Android Chrome, navigate to the server IP (e.g. `http://<your-ip>:5000`).
3. Tap **"Install App"** from the banner or tap Chrome's menu (`⋮`) ➔ **"Add to Home screen"**.
4. The app installs as a standalone Android app with the official Swiggy Instamart app icon, full-screen viewport (no address bar), optical camera barcode scanner, vibration haptics, and audio beep feedback!

### Option B: Native Capacitor Android APK Project (`/client/android`)
The native Android Studio project is in `client/android`. Build a real, signed debug APK with the Android SDK installed and configured (`ANDROID_HOME` or `client/android/local.properties`):
- **Package ID:** `com.swiggy.instamart.audit`
- **Permissions configured in `AndroidManifest.xml`:**
  - `CAMERA` (Optical barcode scanning)
  - `FLASHLIGHT` (Dark warehouse shelf illumination)
  - `VIBRATE` (Haptic scan confirmation)
  - `ACCESS_NETWORK_STATE` & `INTERNET`
  - `usesCleartextTraffic="true"` (Direct communication with dark store local network servers)
- **To build native APK:**
  ```bash
  # Open in Android Studio:
  npx cap open android

  # Or build the web assets, sync Capacitor, and compile the APK:
  build-apk.bat
  # APK output: client/android/app/build/outputs/apk/debug/app-debug.apk
  ```

---

## 🏆 Using the Dashboard to Track Picker Performance

The Admin Dashboard includes a dedicated **Picker Performance & Productivity Tracker** mode (switchable via the top toggle pills):

### 1. 🥇 Team Productivity Leaderboard
- Real-time ranking of all warehouse pickers by completed audits and inventory accuracy.
- Displays Gold, Silver, and Bronze tier badges (`Elite Master`, `Silver Pro`, `Active Picker`).
- Compares Today's Audits, Total Audits, and Total SKUs Scanned side-by-side.

### 2. 🎯 Individual Picker Deep-Dive Selector
Select any picker (e.g., *Ramesh Kumar*, *Priya Sharma*, *Amit Verma*) from the dropdown to inspect their full scorecard:
- **Total Audits & Shift Velocity**: Audits completed today vs. all-time.
- **Inventory Accuracy Rate %**: Percentage of audits completed with zero negative discrepancies.
- **Discrepancies Discovered**: Missing items detected and reported by this picker.
- **Daily Auditing Trend (14 Days)**: Day-by-day audit volume and negative items discovered.
- **Warehouse Zone Coverage**: Heatmap of zones audited by this picker (`Ambient`, `FMCG`, `Chilled`, `Frozen`, `High-Value`).
- **Individual Audit Manifest Feed**: Chronological list of every audit submitted by this picker with one-click details.

### 3. 📱 Picker Self-Tracking View ("My Performance" Tab)
Pickers can tap the **"Performance"** tab directly on their Android app or scanner bottom bar:
- **Shift Audit Goal Progress Bar**: Visual progress towards the daily 20-rack audit shift target (e.g., `14 / 20 Racks — 70%`).
- **Accuracy Score Gauge**: Real-time feedback on their personal audit accuracy.
- **Discrepancies Reported Count**: Total missing units identified.
- **Past 7 Days History**: Visual daily trend of completed audits.

---

## 🔑 Default User Accounts & Credentials

| Role | Picker ID | Name | Password | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `SURYA` | Surya | `6382` | Full access: dashboard, user management, Location Master CSV, reports export, negative items resolution |
| **Picker 1** | `PKR-101` | Ramesh Kumar (Zone A Picker) | `picker123` | New audits, personal audit history, personal performance score, negative items, shift logs |
| **Picker 2** | `PKR-102` | Priya Sharma (Zone B Picker) | `picker123` | New audits, personal audit history, personal performance score, negative items, shift logs |
| **Picker 3** | `PKR-103` | Amit Verma (Cold Room Picker) | `picker123` | New audits, personal audit history, personal performance score, negative items, shift logs |
| **Picker 4** | `PKR-104` | Kavita Nair | `picker123` | *Deactivated test account* (demonstrates blocked login) |

> 💡 **Quick Switcher**: The app includes a **1-Tap Demo Switcher** directly in the top navigation bar and on the login page for effortless testing between Admin and Picker accounts.

---

## 🌟 Complete System Architecture

1. **Authentication & Shift Logging**: Secure JWT + bcrypt auth, auto-logging of login/logout timestamps, duration, IP, user-agent, and 30-second heartbeat active daemon.
2. **Strict Location Master Flow**: 4-step sequential dependent dropdowns (Floor ➔ Aisle ➔ Rack ➔ Bin), auto-generated Location ID `{Floor}-{Aisle}-{Rack}-{Bin}` (e.g. `0-A-1-S`), and auto-filled attributes (`Rank`, `ZoneType`, `PrimaryFcOperationType`, `RackType`, `SpaceType`, `StorageType`).
3. **Mobile-First Rack Audit**: Optical camera barcode scanner, synthetic Web Audio API scanner beep, 1-tap demo barcodes, multi-SKU manifests, mandatory discrepancy remarks, photo proof capture, and pre-submission review modal.
4. **My Audit History**: Filter by date, rack, SKU, and status (`Completed` vs `Flagged`) with full manifest drawer.
5. **Negative Items Hub**: Discrepancy tracking with photo proof lightboxes and 3-step supervisor resolution workflow (`Open` ➔ `Under Review` ➔ `Resolved`).
6. **Executive Dashboard & Analytics**: 8 summary cards, picker comparison charts, warehouse heatmaps, frequently audited racks, and active floor pickers.
7. **User & Picker Management**: Provision Picker IDs, edit names, toggle activation, reset passwords, and view picker performance.
8. **Location Master CSV Management**: Upload CSV in `Replace Entire Warehouse` or `Append / Upsert` modes with header validation and duplicate protection.
9. **Reports & Data Export**: One-click download of Microsoft Excel (`.xlsx`) and CSV files for 6 datasets.
10. **Activity Audit Trail**: Automated timestamped event log for every administrative and operational action.

---

## 🏃 Running and Developing

### 🌐 Hosting for mobile data (Render)

The Render Blueprint in `render.yaml` deploys the website and API together, with a persistent disk for SQLite and uploaded audit photos. Persistent disks require a paid Render web service. Push this project to a private GitHub repository (do not commit the local SQLite database, APK, or uploads), then in Render choose **New → Blueprint** and connect that repository. Render will create the service and disk; use the HTTPS `onrender.com` URL it assigns.

The hosted database starts separately on the persistent disk. The existing `audit_database.sqlite` on your computer is not uploaded or migrated automatically; keep a backup and arrange a one-time migration before entering production data. The initial cloud database will be seeded with the default accounts and warehouse data.

To create a native Android APK that connects over mobile data, set the API base to the Render HTTPS URL and build locally in PowerShell:

```powershell
$env:AUDIT_API_BASE_URL = "https://your-service.onrender.com/api"
.\build-apk.bat
```

Install that newly built APK on the phone. Alternatively, open the hosted HTTPS website on the phone and use the browser's **Add to Home screen** option. The phone needs mobile data or Wi-Fi internet; the host computer no longer needs to stay on.

Before sharing the public URL, change the default admin password and replace or disable demo accounts. The current OTP flow is a development simulator, not SMS delivery.

The website and Android app use the same Express API and SQLite database (`audit_database.sqlite`). Run the backend on the host computer with `npm start`; open the website at `http://localhost:5000`. For Android devices, use the host computer's LAN address and keep the device and host on the same network. Build the APK with `build-apk.bat` so it is configured to reach that backend.

```bash
# Start backend server + static frontend (Port 5000)
npm start

# Run frontend in development mode with HMR (Port 3000)
npm run client

# Rebuild frontend production assets
npm run build

# Sync web assets to native Android project
npx cap sync android
```
