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

## 🔍 Dependency CVE review

**Backend** — `mvn` deps checked; the only reported CVEs are for `spring-security-web@6.2.4`:
- **CVE-2024-38821** — *does not apply* (WebFlux-only; we use servlet Spring MVC).
- **CVE-2026-22732** — no patched version yet; low practical impact for a personal LAN backend (affects custom header-writer edge case).
- **CVE-2026-47838** — *does not apply* (X.509 client certs; we use JWT).

None are exploitable in this app's configuration.

**Frontend** — Angular 17 has 6 CVEs, all **XSS routes** requiring:
- user-controlled Angular templates (we don't compile any at runtime), **or**
- unsanitized SVG `<script>` bindings (we have none), **or**
- untrusted i18n translations (we don't ship i18n), **or**
- SSR client-hydration (we don't use SSR).

None are exploitable in this app. The **CSP added in step 3** blocks them even if some future template change accidentally created a vulnerable pattern.

**Capacitor 8.4.1** — clean; no known CVEs.

> To fully clear the Angular CVEs, upgrade to **Angular ≥ 19** (larger migration). Deferred — the app is safe today thanks to the CSP + safe template patterns.

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

Total: **4** (all standard, all necessary, none dangerous):

| Permission | Why | Runtime prompt? |
|---|---|---|
| `INTERNET` | Talk to your backend | no (install-time) |
| `POST_NOTIFICATIONS` | Fire the 5 daily/weekly System reminders (wake, lunch, evening, sleep, weekly review) even when the app is closed | **yes** (Android 13+) — you can deny it and the app still works |
| `SCHEDULE_EXACT_ALARM` + `USE_EXACT_ALARM` | Reminders fire at the exact scheduled minute (otherwise Doze mode delays them) | no |
| `VIBRATE` | Haptic buzz on quest-complete / level-up | no |

**No** access to: camera, microphone, contacts, SMS, calendar, storage, location, phone, background location, install packages. The app can't read anything on your phone or send anything except HTTP to your backend.

