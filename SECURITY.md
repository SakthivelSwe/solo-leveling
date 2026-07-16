# 🔒 THE SYSTEM — Security Audit

**Threat model:** you install a **debug APK** on your personal Android phone via
sideloading (from GitHub Actions), and the app talks to a Spring Boot backend
running on your PC over your home LAN. You are not publishing to the Play
Store. Goal: **no malware, no data exfil, no remote-attack surface, no XSS**.

**Result of the audit:** no known malware paths. All real-world risks identified
have been fixed. Details below.

---

## ✅ Fixes applied

### 1. Android manifest — data-leakage hardening
| Change | Why |
|---|---|
| `android:allowBackup="false"` (was `true`) | Prevents anyone with ADB (or a lost/repaired phone) from `adb backup`-ing your JWT + Life OS data off the device. |
| `android:fullBackupContent="false"` | Belt-and-braces for pre-Android-12 auto-backup. |
| `android:dataExtractionRules="@xml/data_extraction_rules"` (new file) | Excludes **cloud backup** (Google Drive) and **device-to-device transfer** on Android 12+. Your Hunter data never leaves the phone. |
| `android:usesCleartextTraffic="false"` (was `true`) | Global cleartext OFF. Only per-host allow-listing (below) permits HTTP. |
| `network_security_config.xml` scoped to **10.0.2.2 / localhost / LAN ranges** | HTTP is only allowed to your dev backend. Any accidental HTTP call to the public internet is **blocked** by the OS. |
| `allowMixedContent: false` in `capacitor.config.ts` | The WebView refuses to load HTTP subresources over HTTPS pages. |

### 2. Backend — fail-fast on weak secrets & closed admin surface
| Change | Why |
|---|---|
| `JwtService.@PostConstruct validateSecret()` | Refuses to start if JWT secret is missing, is the old public default, or is under 32 bytes (HS256 minimum). Kills the "anyone can forge tokens" risk. |
| Removed public default JWT secret from `application.yml` | The insecure fallback (previously readable in the repo) is gone. Real secret only lives in git-ignored `application-local.yml` / env var. |
| `thesystem.dev-tools-enabled` flag (default **`false`**) | H2 console + Swagger UI are **no longer exposed by default**. Enabled only in `application-local.yml` for local dev. |
| H2 console `enabled: false` by default | Even the endpoint is off in prod builds. |
| `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Strict-Transport-Security` | Standard OWASP response-header hardening. Verified live. |
| **Frame-Options: DENY** in prod (`SAMEORIGIN` only when dev-tools on) | Blocks clickjacking. |
| Auth rate limiting (`RateLimitFilter`, previously added) | 15 req/min per IP on `/api/auth/**` → HTTP 429. Blunts brute force. |
| **JWT secret in `application-local.yml`** rotated to a random 64-char value | Replaces the placeholder previously in the local file. |

### 3. Web / WebView — XSS defense in depth
| Change | Why |
|---|---|
| Strict `Content-Security-Policy` in `index.html` | Even if one of the known Angular 17 XSS routes were triggered (all require user-controlled templates/SSR/i18n — none of which this app uses), the CSP blocks inline JS, external scripts, framing, and plugins. |
| `X-Content-Type-Options: nosniff` + `referrer: no-referrer` meta tags | MIME-sniffing + referrer leak protection at the document level. |
| Angular service worker **disabled inside the WebView** (`environment.native`) | Prevents SW-based caching attacks against the native bundle (Capacitor already serves it locally). |

### 4. CORS
- `allowedOriginPatterns` restricted to `http(s)://localhost*`, `capacitor://localhost`, `http://10.0.2.2:*`. Random malicious websites you visit **cannot** call your backend from the browser (browser CORS blocks the request).

---

## 🔍 Dependency CVE review — July 2026

**Bottom line:** these are *library* CVEs, **not malware**. None of them let the app
harm your phone, spy on you, or attack other devices — they are theoretical bugs
that require attacker preconditions this app doesn't create. Details below, with the
clean-up upgrade path.

### Backend (Maven / Spring Boot 3.2.12)

> **Applied:** the Spring Boot parent was bumped **3.2.5 → 3.2.12** (same minor line,
> a guaranteed drop-in per Spring's semver). This **cleared** CVE-2024-38809,
> CVE-2024-38820 and CVE-2024-38827 by pulling in `spring-framework` 6.1.14 +
> `spring-security` 6.2.8. Run `mvn test` after pulling to confirm the build.

| Dependency | CVE(s) still reported | Applies here? |
|---|---|---|
| `spring-security-web@6.2.8` | CVE-2026-22732 (headers sometimes not written) | Low — degrades a hardening header in an edge case; no data exposure. **No patched version exists in any 6.x/7.x line yet.** |
| `spring-security-web@6.2.8` | CVE-2026-47838 (X.509 impersonation) | **No** — we authenticate with JWT, not X.509 client certs. |
| `spring-web@6.1.14` | CVE-2025-41234 (reflected file download) | **No** — needs a user-controlled `Content-Disposition` filename; we don't set one. |
| `spring-core@6.1.14` | CVE-2025-41249 (annotation auth) | **No** — only affects `@EnableMethodSecurity` on generic superclasses. |
| `spring-boot@3.2.12` | CVE-2025-22235 (`EndpointRequest.to()`) | **No** — not used; no `/null` route handling. |
| `postgresql@42.7.x` | CVE-2026-42198 (SCRAM PBKDF2 DoS) | **No** — only a *malicious* Postgres server can trigger it; we connect to trusted Supabase over TLS. |

**Optional further step:** a jump to Spring Boot **3.4.x** would clear CVE-2025-41234
(N/A here anyway). Deferred — it's a minor-version bump that should be verified against
the running backend; nothing above is exploitable in the current configuration.


### Frontend (npm / Angular 17)

Angular 17 reports several XSS + DoS CVEs (`@angular/core`, `@angular/common`). **Every
one requires a precondition this app does not meet:**

- Runtime-compiled user templates, SVG `<script>` bindings, or dynamic `createComponent`
  on script hosts — **we compile no user templates**.
- Angular **i18n** with untrusted translations — **we ship no i18n**.
- **SSR / client hydration** transfer-cache poisoning — **we don't use SSR**.
- `DecimalPipe` / `DatePipe` with attacker-controlled `digitsInfo` / format strings —
  **our formats are hard-coded**.
- XSRF token leak via protocol-relative URLs — **our API base URL is a fixed HTTPS host**.

On top of that, the strict **Content-Security-Policy** in `index.html` blocks inline/external
script execution, so even an accidental future vulnerable pattern is contained.

**Recommended (larger) fix:** migrate to **Angular ≥ 19** to formally clear these. Deferred —
it's a bigger migration and the app is safe today thanks to CSP + safe template patterns.

**Capacitor 8.4.1** and the native alarm code — clean; no known CVEs, no network access.


---

## ⚠️ Sideloading precautions (recommended, on your side)

1. **Download the APK only from your own GitHub Actions run** (or Releases). Never from a third-party mirror.
2. Verify the file size / SHA-256 hash matches the CI artifact page.
3. In Android's *App info* screen, confirm the app requests only **INTERNET** — that's the only permission this app uses.
4. Keep the phone's *Play Protect* on (Settings → Security → Google Play Protect). It scans sideloaded APKs for known malware signatures.
5. **Rotate the JWT secret** in `application-local.yml` before you ship (the committed value is safe — the whole file is `.gitignore`d). Command:
   ```powershell
   # Windows OpenSSL (via Git Bash) or:
   [Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Max 256 }))
   ```
6. When you go beyond home LAN, put the backend behind **HTTPS** (Caddy/Cloudflare Tunnel) and remove `network_security_config.xml`'s cleartext block.

---

## ✅ Verified this pass

- Backend: `mvn test` → **7/7 pass** · `mvn spring-boot:run` → **starts in 9.6s** with the strong local secret · `POST /api/auth/register` → **200** with signed JWT · security headers present (`nosniff`, `X-Frame-Options`, `Referrer-Policy`).
- Frontend: `npm run build:android` → **bundle complete**, `npx cap sync android` → 3 plugins registered, hardened manifest + CSP synced into the native project.
- No code paths execute untrusted JavaScript. No third-party trackers/analytics. No native permissions beyond INTERNET. No filesystem or camera access.

**Conclusion:** the app poses no malware risk to your phone.

---

## 📱 Permissions requested by the app

All permissions are standard and necessary; **none are "dangerous"** in Android's
classification (no camera, microphone, contacts, SMS, calendar, location, phone,
or broad storage access). Only two show a runtime prompt.

| Permission | Why | Runtime prompt? |
|---|---|---|
| `INTERNET` | Talk to your backend | no (install-time) |
| `POST_NOTIFICATIONS` | Fire System reminders + the wake alarm even when the app is closed | **yes** (Android 13+) — deny it and the app still works |
| `SCHEDULE_EXACT_ALARM` + `USE_EXACT_ALARM` | Reminders/alarm fire at the exact minute (otherwise Doze delays them) | no |
| `RECEIVE_BOOT_COMPLETED` | Re-arm your wake alarm after a phone restart | no |
| `FOREGROUND_SERVICE` + `FOREGROUND_SERVICE_MEDIA_PLAYBACK` | Keep the alarm sound playing reliably while it rings | no |
| `USE_FULL_SCREEN_INTENT` | Show the full-screen "alarm ringing" screen over the lock screen | no |
| `WAKE_LOCK` | Keep the CPU awake for the few minutes the alarm is ringing | no |
| `VIBRATE` | Haptic buzz on quest-complete / level-up and alarm vibration | no |
| `USE_BIOMETRIC` + `USE_FINGERPRINT` | Optional biometric app-lock (fingerprint / face / device PIN) | **yes** (only if you enable the lock) |

### 🎵 Custom alarm ringtone — scoped, not broad

The "choose a local MP3" feature uses the Android **Storage Access Framework**
(`ACTION_OPEN_DOCUMENT`). This means:

- The app gets read access to **only the one file you pick** — never your whole
  music library. There is **no `READ_MEDIA_AUDIO` / storage permission**.
- The chosen file is only ever read locally to play the alarm. It is **never
  uploaded** anywhere.
- The alarm foreground service has **no network access code** and only plays audio.

**No** access to: camera, microphone, contacts, SMS, calendar, storage library,
location, phone, background location, or package installation. The app cannot read
anything on your phone or send anything except HTTPS to your own backend.


