# ◈ THE SYSTEM — Solo Leveling Life OS

A gamified, Solo Leveling anime-inspired personal life-tracking platform. Complete daily
quests to earn XP, raise your stats (STR / INT / VIT / AGI / PER / HOR), grow your skill tree,
and climb the ranks from **E-Rank → S-Rank**.

> This build intentionally **excludes** the Gemini AI mentor, Redis/Valkey cache, and Docker.
> It uses an **H2 in-memory database** for zero-config local development, and focuses on a
> polished, animated Solo Leveling UI.

---

## 🧱 Tech Stack

| Layer     | Technology                                        |
|-----------|---------------------------------------------------|
| Backend   | Spring Boot 3.2.5, Java 21                         |
| Database  | **H2 (in-memory)** + Spring Data JPA / Hibernate  |
| Auth      | Spring Security 6 + JWT (jjwt 0.12.6)             |
| Frontend  | Angular 17 (standalone components)                |
| UI        | Angular Material 17 + custom Solo Leveling theme  |
| Charts    | Chart.js + ng2-charts                             |

---

## 📁 Project Structure

```
solo-leveling/
├── the-system-api/      # Spring Boot backend (H2)
└── the-system-ui/       # Angular 17 frontend
```

---

## 🚀 Running Locally (Windows / IntelliJ)

### 1. Backend — `the-system-api`

```powershell
cd the-system-api
mvn spring-boot:run
```

- API:            http://localhost:8080
- Swagger UI:     http://localhost:8080/swagger-ui.html
- H2 Console:     http://localhost:8080/h2-console
  - JDBC URL: `jdbc:h2:mem:thesystem`
  - User: `sa`  ·  Password: *(blank)*

> The 16 default quests are auto-seeded on startup. **Data now persists across restarts**
> (file-based H2 stored in `the-system-api/data/`). To reset, delete that folder — or switch
> the datasource back to `jdbc:h2:mem:thesystem` in `application.yml`.

#### 🔑 Secrets (JWT + AI keys)

Real secrets are **no longer committed** in `application.yml`. Provide them either via
environment variables or a git-ignored local file:

```powershell
# Option A — environment variables
$env:GROQ_API_KEY   = "your-groq-key"
$env:GEMINI_API_KEY = "your-gemini-key"
$env:JWT_SECRET     = "a-long-random-secret"

# Option B — local file (auto-imported, git-ignored)
Copy-Item application-local.yml.example application-local.yml   # then edit in your keys
```

> **Hardening:** auth endpoints are rate-limited (15 req/min per IP → HTTP 429), quest completion
> is race-safe via a DB unique constraint, and core progression math is covered by unit tests
> (`mvn test` → `LevelServiceTest`, `TitleServiceTest`).

### 2. Frontend — `the-system-ui`

```powershell
cd the-system-ui
npm install       # first time only
npm start         # = ng serve
```

- App: http://localhost:4200

Register a new Hunter, then start completing quests. XP fills the level ring, stats animate,
and rank badges evolve as you climb.

---

## 📱 Android App (Capacitor)

The same UI ships as a **native Android app** — every web feature (real-time SSE, quests,
Life OS, Insights, AI Mentor, Titles, Gate raids) runs inside the native WebView.

- **Supports Android 15 → latest** (`minSdk 35`, `compile/target SDK 36`).
- Native status-bar theming, splash screen, hardware **back-button**, and Android-15
  **edge-to-edge** safe-area insets.
- **Local notifications** — the 5 System reminders (wake / lunch / evening / sleep / weekly
  review) are scheduled directly on the device and fire **even when the app is closed**.
- **Haptic feedback** — light buzz on quest complete, success buzz on level-up.
- **App-resume sync** — coming back to the app refreshes your Status Window instantly.

```powershell
cd the-system-ui
npm run open:android     # build web + sync + open Android Studio → ▶ Run
# or, for a CLI APK:
npm run apk:debug        # → android/app/build/outputs/apk/debug/app-debug.apk
```

> Full setup (SDK, backend URL, signed release) is in **[`the-system-ui/ANDROID.md`](the-system-ui/ANDROID.md)**.

### 🤖 Automated APK builds (GitHub Actions)

Push to `main` (or tag `v*`) and CI builds the APK for you — no local Android SDK needed:

| Workflow | File | Trigger | Output |
|---|---|---|---|
| **Android APK** | `.github/workflows/android.yml` | push to `main`, tag `v*`, manual | `the-system-debug-apk` artifact (downloadable from the Actions run); tags are also attached to a GitHub Release |
| **Backend CI** | `.github/workflows/backend.yml` | push/PR touching `the-system-api/**` | `mvn test` results (surefire reports on failure) |

### 🔒 Security posture

Full audit + threat model: **[`SECURITY.md`](SECURITY.md)**. Highlights:
- Android manifest hardened: `allowBackup=false`, cloud-backup + device-transfer excluded, cleartext scoped to LAN only, `X-Frame-Options: DENY` in prod.
- Backend fail-fast on weak/default JWT secret (`JwtService.@PostConstruct`); H2 console + Swagger **off by default** (dev-tools flag).
- Strict **Content-Security-Policy** in `index.html` blocks all known Angular XSS routes.
- Only permission requested: **INTERNET**. No trackers, no analytics.



## 🎮 Game Mechanics

- **XP threshold:** 100 XP per level (configurable in `application.yml`).
- **Ranks:** `1–5 → E`, `6–10 → D`, `11–15 → C`, `16–20 → B`, `21–25 → A`, `26+ → S`.
- **24 quests** across 4 categories: `DAILY`, `SKILL`, `TESTOSTERONE`, `SIDE` (one-time milestones).
- **6 stats:** STR, INT, VIT, AGI, PER, **HOR** (Hormonal / Testosterone).
- **HP System:** every player has HP (0–100). A midnight scheduler adjusts HP from yesterday's
  quest count — `10+ → +5`, `7–9 → 0`, `4–6 → −5`, `<4 → −20`. **HP hits 0 → rank demotion**
  (HP resets to 50) and a System alert is issued.
- **Streak:** consecutive days with ≥ 5 quests completed.
- **Achievements** auto-unlock (First Awakening, Algorithm Hunter, Rank-Ups, Hormone Warrior…).
- **System Quotes:** a Solo-Leveling-style System message rotates daily on the Status Window.

---

## 🧩 Life OS — Phase 6 Modules

Beyond the core dashboard, **THE SYSTEM** is a full life operating system. Open **LIFE OS** from
the top nav to access:

| Module            | What it tracks                                                            |
|-------------------|---------------------------------------------------------------------------|
| **Career OS**     | Job applications + interview rounds, LeetCode log + stats/streak, course progress, **skills-gap analyzer** (current vs target-role thresholds) |
| **Health OS**     | Daily health log (sleep/meals/energy), **water tracker**, exercise logs   |
| **Mind OS**       | Mood/anxiety journal + **evidence-against-self-doubt** ledger (auto-filled on skill wins) |
| **Wealth OS**     | Savings goals (auto-seeded) with progress, monthly budget entries         |
| **English OS**    | Speaking-practice logs + growing vocabulary book                          |
| **Body OS**       | The **7 testosterone pillars** tracked per day                            |
| **Relationship OS** | Daily connection log (girlfriend / family / friends)                    |
| **Notification OS** | Scheduled System alerts (wake / lunch / evening / sleep / weekly review) shown in the 🔔 alerts centre |
| **Habits (Discipline Grid)** | **Atomic Habits + Power of Habit engine** — Cue → Craving → Routine → Reward loop, keystone habits (2× XP), 2-minute rule, habit stacking, 66-day mastery cycle, identity progress rings ("I am becoming a Hunter/Scholar/Monk/Warrior"), 1% compounding curve, per-habit cue-time reminders |

> **Excluded by request:** Gemini AI mentor, Redis/Valkey cache, and Docker Compose. The
> Boss Battle / AI Mentor features (Phase 3) that depend on Gemini are therefore not built.

---

## 🔌 Key API Endpoints

| Method | Endpoint                          | Description                        |
|--------|-----------------------------------|------------------------------------|
| POST   | `/api/auth/register`              | Create Hunter + starter stats      |
| POST   | `/api/auth/login`                 | Authenticate → JWT                 |
| POST   | `/api/auth/refresh`               | Refresh token (header `Refresh-Token`) |
| GET    | `/api/player/status`              | Full Status Window (incl. HP + daily System quote) |
| GET    | `/api/quests/today`               | Today's quests + completion flags  |
| POST   | `/api/quests/{key}/complete`      | Complete a quest → XP/level result |
| GET    | `/api/skills` · `/api/achievements` · `/api/progress/weekly` | Skill tree · achievements · chart data |
| GET    | `/api/progress/heatmap` · `/api/progress/report` | Consistency heatmap · monthly report card |
| GET    | `/api/ai/weekly-review`           | AI-generated monthly review (System verdict) |
| GET/POST | `/api/titles**`                 | Unlockable Hunter titles + equip |
| GET/POST/PUT/DELETE | `/api/habits**`          | **Habits engine** — CRUD + `POST /{id}/complete` + `GET /templates` + `POST /templates/{key}/adopt` |
| GET    | `/api/dungeon`                    | Current **weekly Gate raid** (boss HP + clear progress) |
| GET/POST | `/api/notifications**`          | System alerts + unread count + mark-read |
| GET    | `/api/stream`                     | **Real-time SSE** live-event stream (`?token=<jwt>`) |
| GET    | `/api/system/quote` · `/api/system/leaderboard` | Daily quote · top-10 by XP |
| *      | `/api/career/**`                  | Jobs, rounds, LeetCode, courses, skills-gap |
| *      | `/api/health/**` · `/api/body/**` | Health/exercise/water · testosterone pillars |
| *      | `/api/mind/**`                    | Mind logs + self-doubt evidence    |
| *      | `/api/wealth/**`                  | Savings goals + budget             |
| *      | `/api/english/**` · `/api/relationship/**` | English/vocab · bonds     |

All `/api/**` routes (except `/api/auth/**`) require `Authorization: Bearer <token>`.

---

## 🎨 UI Highlights

- **⚡ Real-time link (SSE):** live XP / HP / rank updates, instant 🔔 notification toasts and
  badge sync across tabs — no refresh needed. A **● LIVE** indicator shows the System link status.
- **📊 Insights page:** GitHub-style **consistency heatmap** (last 18 weeks) + a **monthly report
  card** (perfect days, streaks, consistency %, rank target) with an on-demand **AI System review**.
- **❖ Titles:** 11 unlockable Hunter titles (Iron-Willed → Shadow Monarch) earned from streaks,
  stats, rank and achievements — equip one and it shows on your Status Window.
- **⚔️ Weekly Gate raids:** a rank-scaled boss on the dashboard whose HP drops as you clear quests
  through the week; fell it for a one-time bonus-XP reward. A fresh gate spawns every Monday.
- **📱 Installable, offline PWA:** web manifest + Solo-Leveling theme colour, plus an Angular
  service worker that pre-caches the app shell — installs to your home screen and **loads offline**
  after the first visit, with an **"update available → reload"** prompt on new deploys.
  (SW is production-only; `ng serve` stays uncached.)
- **♿ Accessible auth:** reactive-form validation with inline errors, a **password-strength meter**,
  `aria-invalid`/`role="alert"` fields, and `aria-live` announcements for HP alerts.
- Animated **XP progress ring** (SVG) with gradient + glow
- **Animated stat bars** with shimmer sweep + **HP bar** (green → gold → red)
- **Rank badge** with rank-specific color schemes and pulse glow
- **Level-Up modal** with rotating light rays, auto-closes after 4s
- **Snackbar toasts** for XP gains & achievement unlocks
- **Quest log** with 4 category filters (incl. Side Quests), staggered list animation
- **Life OS hub** with 7 animated module tabs + water-drop tracker, pillar checklists, journals
- 🔔 **Notification centre** with unread badge and System alert feed
- Reusable animation library (`shared/animations.ts`): `fadeInUp`, `listStagger`,
  `slideInRight`, `expandCollapse`, `pulse`, `routeFade`
- **7-day bar chart** (today highlighted orange, strong days teal)
- Fully **responsive** down to 375px

---

## 🥋 Discipline Protocol (Sakthivel's Daily Loop)

The System rewards consistency, not intensity. Suggested loop:

1. **Morning:** cold shower → 20-min exercise → sunlight + eggs → write one-line intention (Mind OS).
2. **Work day:** proper lunch, no soda, 5-min breathing.
3. **Evening grind:** 1 hr coding *without AI* → 1 LeetCode (log it in Career OS) → 20-min English.
4. **Night:** message a bond (Relationship OS), evening reflection (Mind OS), phone down, sleep < 11:30.

**Targets:** Month 1 → D-Rank · Month 2 → C-Rank (interview-ready) · Month 3 → B-Rank.
Clear **10+ quests** to heal HP; drop below **4** and the System drains it. Miss enough and
you *derank* — the grind is real.

◈ KEEP FORWARDING — LV.1 → S-RANK

