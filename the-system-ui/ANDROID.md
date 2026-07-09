# 📱 THE SYSTEM — Android App

The Angular web app is wrapped as a **native Android app with [Capacitor](https://capacitorjs.com/)**.
Everything in the web build — real-time SSE, quests, Life OS, Insights (heatmap + report),
AI Mentor, Titles, weekly Gate raids — runs unchanged inside the native WebView.

> **Device support:** `minSdk 35` (**Android 15**) → `compile/target SDK 36` (**Android 16**, latest).
> The app runs on Android 15 and every newer release.

---

## ✅ Prerequisites (one-time)

| Tool | Version | Notes |
|------|---------|-------|
| **JDK** | 21 | Already present (`JAVA_HOME` → Zulu 21). |
| **Android Studio** | Latest (Ladybug+) | Installs the Android SDK. |
| **Android SDK** | Platform **35 & 36**, Build-Tools 36 | Install via *Studio → SDK Manager*. |
| Node + npm | 18+ | For the Angular build. |

After installing Android Studio, set the SDK location so Gradle can find it — create
`the-system-ui/android/local.properties`:

```properties
sdk.dir=C:\\Users\\<you>\\AppData\\Local\\Android\\Sdk
```

(or set the `ANDROID_HOME` environment variable to the same path). Open the SDK Manager and
ensure **Android 15 (API 35)** and **Android 16 (API 36)** platforms + **Build-Tools 36** are installed.

---

## 🚀 Build & run

All commands run from `the-system-ui/`.

### 1. Point the app at your backend
Edit `src/environments/environment.capacitor.ts`:
- **Emulator:** `http://10.0.2.2:8080/api` (default — maps to your PC's localhost).
- **Physical device (same Wi-Fi):** `http://<your-PC-LAN-IP>:8080/api` (run `ipconfig`).

Start the backend first:
```powershell
cd ..\the-system-api ; mvn spring-boot:run
```

### 2. Open in Android Studio (recommended)
```powershell
npm run open:android      # builds web, syncs, opens Studio
```
Then press ▶ **Run** on an emulator or connected device.

### 3. Build an APK from the CLI
```powershell
npm run apk:debug         # → android/app/build/outputs/apk/debug/app-debug.apk
```
Install it on a connected device:
```powershell
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### 4. Run directly on a device/emulator
```powershell
npm run run:android
```

---

## 🔁 After changing web code
Any time you edit the Angular app, re-sync the native project:
```powershell
npm run sync:android
```

---

## 🧩 What's wired for native

- **`NativeService`** (`core/services/native.service.ts`) — themes the status bar, hides the
  splash on ready, routes the **hardware back button** to in-app navigation (exits at root),
  refreshes player state on **app resume**, and flags `body.native-platform` for edge-to-edge insets.
- **`LocalNotificationsService`** — schedules the **5 System reminders** (wake 08:00, lunch 13:00,
  evening quest push 21:00, sleep 23:00, Sunday weekly review 20:00) directly on the device so
  they fire **even when the app is closed or offline**. Requests `POST_NOTIFICATIONS` on Android 13+.
- **`HapticsService`** — light buzz on quest-complete, success buzz on level-up, warning buzz on
  errors. Uses the standard `VIBRATE` permission.
- **Edge-to-edge (Android 15)** — `viewport-fit=cover` + `env(safe-area-inset-*)` padding so
  content never hides behind the status / gesture-navigation bars.
- **Service worker disabled on native** (`environment.native`) — Capacitor serves the bundle
  locally, so the Angular SW is web-only (avoids double-caching).
- **Cleartext to dev backend** — `network_security_config.xml` allow-lists private LAN hosts
  only; global cleartext is OFF. **For production, serve the API over HTTPS.**
- **Plugins:** `@capacitor/app`, `@capacitor/status-bar`, `@capacitor/splash-screen`,
  `@capacitor/local-notifications`, `@capacitor/haptics`.

---

## 📦 Release build (signed)

1. Generate a keystore:
   ```powershell
   keytool -genkey -v -keystore thesystem.keystore -alias thesystem -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Add signing config to `android/app/build.gradle` (`signingConfigs` + `buildTypes.release`).
3. Build:
   ```powershell
   npm run apk:release
   ```
   Output: `android/app/build/outputs/apk/release/app-release.apk`
   (or use `bundleRelease` for an `.aab` to upload to Google Play).
4. Point `environment.capacitor.ts` at your **HTTPS** production backend and set
   `androidScheme: 'https'` in `capacitor.config.ts` before shipping.

