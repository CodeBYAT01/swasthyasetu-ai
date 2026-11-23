# SwasthyaSetu AI

Voice-first healthcare triage and remote specialist assistance — a fully functional, offline-capable frontend demonstration for community health workers, doctors, and administrators.

> **Demonstration only.** All patients, consultations, referrals, users and clinical rules are fictional and simulated. Nothing in this application is a medical device or clinical decision tool. Do not use it for real patient care.

## What it does

- **Frontline health workers** register patients, capture consultations by voice (Kannada / Hindi / English), review every extracted symptom before accepting it, record vitals, see simulated safety alerts, save offline, sync, and raise specialist referrals.
- **Doctors / specialists** review referred cases with the transcript, symptoms, vitals, safety flags and prior consultations, then record advisory feedback and next steps.
- **Administrators** manage users and health centres, inspect role permissions, review clinical rule versions, monitor the sync queue, and read the audit log.
- **Offline-first**: all writes go to IndexedDB first, a sync queue tracks pending records, and a PWA service worker caches the app shell. Patient data is never placed in the HTTP cache.

## Tech stack

React 18 · Vite 5 · JavaScript · Tailwind CSS · React Router · Lucide React · Recharts · IndexedDB (custom wrapper) · Service Worker / PWA manifest

## Quick start

```bash
cd swasthyasetu-ai
npm install
npm run dev
```

Open the URL printed by Vite (normally <http://localhost:5173>).

Production build:

```bash
npm run build
npm run preview
```

## Demo accounts

Select a role on the login screen and sign in. All accounts use password **`demo1234`**.

| Role | Email |
| --- | --- |
| Frontline Health Worker | `worker@swasthyasetu.ai` |
| Doctor / Specialist | `doctor@swasthyasetu.ai` |
| Administrator | `admin@swasthyasetu.ai` |

Additional seeded accounts: `ramesh@swasthyasetu.ai`, `fatima@swasthyasetu.ai` (workers), `meera@swasthyasetu.ai` (doctor).

## Suggested end-to-end demo

1. Sign in as **Frontline Health Worker**.
2. Press **START NEW CONSULTATION** → complete patient registration.
3. On the voice consultation screen choose a language, then press **Kannada sample** (or **Hindi sample** / **Emergency drill**). Real microphone capture uses the browser SpeechRecognition API where available; manual transcript editing and samples always work.
4. Edit the transcript if desired, press **Extract symptoms from transcript**, confirm every extracted item, then **Confirm Symptoms** and **Continue to Assessment**.
5. Enter the drill vitals (e.g. SpO₂ 88 %, pulse 118, temperature 38.9 °C) to trigger the simulated **emergency** warning. Save the assessment.
6. Create and submit a referral.
7. Open **Sync Center** → **Synchronize Now** to process the offline queue.
8. Log out, sign in as **Doctor / Specialist** → **Incoming Referrals** → open the case → submit clinical comments and next steps.
9. Log out, sign in as **Administrator** to explore user management, centres, permissions, clinical rules, audit log and sync monitoring.

Settings → **Reset demonstration data** restores the seeded dataset.

## Safety and privacy behaviour

- Three explicit assessment states: **emergency**, **further assessment required**, and **incomplete data**. An empty alert list never means "healthy" — missing fields are reported as incomplete.
- Safety rules are fixed demo rules labelled `DEMO-RULES-v0.3 (unreviewed)` and are clearly marked as simulated.
- Speech-derived symptoms are suggestions only; each symptom must be confirmed or edited manually.
- Records are persisted in browser IndexedDB. The service worker caches only the app shell (`manifest`, icons, build assets); API responses and patient data are excluded from caching.

## Project structure

```
swasthyasetu-ai/
├─ public/                 manifest, service worker, icons
├─ scripts/                Playwright verification scripts (smoke, routes, i18n)
├─ src/
│  ├─ components/          reusable UI, layout, voice and safety components
│  ├─ context/             Auth, App data store, i18n, Toasts
│  ├─ database/            IndexedDB wrapper, schema and demo seed data
│  ├─ hooks/               speech recognition, online status, debounce, storage
│  ├─ layouts/             auth and application shells
│  ├─ pages/               login, worker, doctor, admin and shared pages
│  ├─ services/            API boundary, auth, speech abstraction, safety rules, sync
│  └─ utils/               constants, formatters, validators, IDs, symptom parser, translations
├─ .env.example
├─ package.json
└─ vite.config.js
```

### Connecting a real backend

`src/services/api.js` is the single API boundary. Set `VITE_API_BASE_URL` in `.env` to route reads/writes through the FastAPI-style endpoints; leave it empty to use the IndexedDB mock. The app works fully without a backend.

## Verification scripts

The Playwright scripts use the locally installed Google Chrome and expect the production preview on port 4173.

```bash
npm run build
npm run preview -- --port 4173
# in a second terminal
node scripts/smoke.mjs    # full worker → doctor → admin flow, saves screenshots to smoke/
node scripts/routes.mjs   # renders every route and reports browser errors
node scripts/i18n.mjs     # switches English / Kannada / Hindi
```

## Known demo limitations

- The bundled JavaScript is a single ~780 kB chunk (Vite size warning only); code splitting is a future optimisation.
- Speech recognition depends on browser support; the manual transcript path and sample utterances are always available.
- Synchronisation is simulated, including queued records, retries and the "demonstration server" status.
- The app is a frontend demo; authentication tokens are mocked in `localStorage`.
