# iThesis Mobile

React Native (Expo) companion app for the **iThesis** repository system of
Batangas State University TheNEU Lipa Campus Library. It mirrors the maroon
identity and core workflows of the web app, talking to the same **Django REST
API** over the internet — the app never touches PostgreSQL directly.

## Stack

- **Expo SDK 54** + **React Native 0.81** + **React 19** + **TypeScript**
- **React Navigation** (native-stack + bottom-tabs) for role-based shells
- **TanStack Query** for data fetching / caching
- **Axios** client with session-cookie + header auth, CSRF, and single-device id
- **expo-secure-store** for profile + device-id persistence
- **expo-file-system + expo-sharing** for authenticated PDF/report downloads
- **Playfair Display + Inter** fonts (matching the web design tokens)

## Data & deployment architecture (finalized)

- **No database migration.** The existing **local PostgreSQL** database of the
  web iThesis is retained as-is — no risk of data loss or corruption.
- The **Django REST API** is the single source of truth. It keeps talking to the
  local PostgreSQL exactly as the web app does.
- To reach the local backend from phones over the internet, **expose Django**
  through a **static public IP** or a **tunnel** (Ngrok / Cloudflare Tunnel).
  PostgreSQL is never exposed — only Django.
- The mobile app fetches from that **same local database** through Django; it
  never connects to a database directly.
- **Supabase** remains part of the documented tech stack as the BaaS option, but
  is **not** used as the primary database (the local Postgres is retained). No
  Supabase client is wired into the app's data flow.

## Getting started

```bash
npm install
npx expo start          # press a (Android) / i (iOS) / scan QR in Expo Go
```

### Pointing at the backend

Copy `.env.example` to `.env` and set the API base URL (no trailing slash,
must include `/api/v1`):

```bash
# .env  (read via process.env.EXPO_PUBLIC_API_BASE_URL)
EXPO_PUBLIC_API_BASE_URL=https://your-tunnel-or-server/api/v1
```

Fallback defaults (`src/config/env.ts`) when no env is set:
- Android emulator → `http://10.0.2.2:8000/api/v1`
- iOS simulator → `http://127.0.0.1:8000/api/v1`

**Exposing the local Django backend to the mobile app:**

```bash
# Ngrok — quick off-campus testing
ngrok http 8000
#   → https://abc123.ngrok-free.app  ⇒  EXPO_PUBLIC_API_BASE_URL=…/api/v1

# Cloudflare Tunnel — stable named hostname
cloudflared tunnel --url http://localhost:8000
```

On the Django side, add the tunnel/IP origin to the backend env so auth works
cross-origin:

```bash
# backend/.env
CORS_ALLOWED_ORIGINS=https://abc123.ngrok-free.app
CSRF_TRUSTED_ORIGINS=https://abc123.ngrok-free.app
# (CORS_ALLOW_CREDENTIALS is already enabled in settings)
```

## Project structure

```
src/
├── api/            # axios client (session+CSRF), auth state, service modules
├── components/     # Brand, ThesisCard, RowLink, ui/ (Button, TextField, …)
├── config/         # API base-url resolution
├── hooks/          # React Query hooks, useDebounced
├── navigation/     # RootNavigator + Public/Librarian tab navigators
├── screens/
│   ├── public/     # Landing, Browse, ThesisDetail, Upload, Track, Login, …
│   ├── librarian/  # Dashboard, Review (approve/reject), Repository, Profile
│   └── admin/      # AdminHome (overview + management entry points)
├── store/          # AuthContext (role gating, session lifecycle)
├── theme/          # colors, typography, spacing, shadows
└── types/          # shared TS types
```

## Roles & navigation

The root navigator swaps shells based on the authenticated role:

- **Guest / student** → public bottom tabs (Home, Browse, Track, Account) +
  Upload and staff Login as pushed/modal screens. No login required to browse
  or submit.
- **Librarian** → Dashboard, Review queue, Repository, Profile.
- **Admin** → system overview with management entry points.

## Auth & security

The mobile client integrates with the **existing** iThesis Django auth — it is
**session/cookie based, not JWT** (matching `iThesis-web`). The Axios client
(`src/api/client.ts`) mirrors the web's `utils/api.ts` + `enhancedFetch.ts`:

- `withCredentials: true` so the Django `sessionid` cookie (set by `/auth/login`
  and persisted automatically by React Native networking) rides along.
- **Header fallback**: `X-User`, `X-User-Role`, `X-User-ID` from the signed-in
  profile authorise librarian/admin endpoints (the backend's
  `require_librarian_auth` accepts these).
- **CSRF**: `X-CSRFToken` on unsafe methods, fetched from `GET /api/csrf/`
  (returned in the JSON body); auto-refreshed and retried once on a 403.
- `X-Device-Id` (stable per-install id in `expo-secure-store`) supports staff
  single-device enforcement.
- **Single-device conflict**: `POST /auth/login` returns **HTTP 409** with
  `code: "account_active_elsewhere"` → surfaced on the login screen.
- A `401` on a protected route clears local state and prompts re-login.

The signed-in profile is cached in `expo-secure-store`; there are no long-lived
API tokens to store.

## Backend integration (verified against `iThesis-web/backend`)

All endpoints, query params, and response shapes are mapped to the real Django
views in `ithesis_backend/views.py` + `urls_v1.py`:

| Feature | Endpoint | Notes |
|---------|----------|-------|
| Login | `POST /auth/login` | `{ usernameOrEmail, password, deviceId }` → `{ id, username, fullName, email, role, sessionToken? }` |
| Browse | `GET /theses/browse` | approved-only; `q`, `department` (**code**), `year`, `sort_by`, `page`, `page_size` (12–21); camelCase results + paginator meta |
| Detail | `GET /theses/{id}` | camelCase; relative media URLs absolutised |
| Departments | `GET /departments` | flat `[{ id, name, code }]` |
| Track | `GET /theses/track?code=` | `{ trackingCode, status, title, rejectionReason, submittedAt, approvedAt }` |
| Submit | `POST /theses/submit` | multipart: `file`, `title`, `abstract`, `adviser`, `authors` (JSON array), `department_code`, `year_published`, `executive_summary`, `uploader_*` |
| Access code | `POST /access/verify` | `{ code, name, email, srCode }` → `{ ok }` (consumes code) |
| Dashboard | `GET /dashboard/summary` | `{ pendingReviews, approvedThisWeek, totalTheses, uniqueUsers }` |
| Review queue | `GET /dashboard/recent-submissions?statuses=&limit=` | `{ submissions: [...] }` |
| Approve | `POST /theses/{id}/approve` | librarian-auth |
| Reject | `POST /theses/{id}/reject` | body `{ reason }` (required) |
| Record view | `POST /theses/{id}/record-view` | analytics, best-effort |
| CSRF | `GET /api/csrf/` | `{ csrftoken }` |

The backend → UI field normalisation lives in `mapThesis()` in
`src/api/services.ts`; the UI works with the clean `Thesis` model in
`src/types/index.ts`.

## Feature parity with iThesis-web

Every user-facing workflow of the web system is integrated, adapted to the
mobile objectives (students, library visitors, librarians, administrators).

**Public / student / visitor**
- Landing, About, FAQ
- Browse repository (search, department-code filters, sort, infinite scroll)
- Thesis detail — abstract, keywords, related theses (AI `ai/similar-theses`),
  authenticated **document** + **executive-summary** open (share sheet),
  view-count recording
- Remote submission (`/theses/submit`) with access-code verification
  (`/access/verify`) + guest-session tracking (`/track/guest-session`)
- Track submission status by tracking code (`/theses/track`)
- Staff login + forgot password

**Librarian**
- Dashboard KPIs (`/dashboard/summary`)
- Review queue with approve / reject (`/dashboard/recent-submissions`,
  `/theses/{id}/approve|reject`)
- Repository / submissions browser (all statuses)
- Thesis management on detail — edit title/adviser/authors
  (`/theses/{id}/details`), set publication year, soft delete
- Deleted-theses recovery (`/theses/deleted`, `/recover`)
- Access codes — list / generate / clear (`/librarian/access-codes*`)
- Certifications & forms — generate certificate/form PDFs
  (`/generate-document-from-library`) + signatory settings
  (`/librarian/certificate-signatory-settings`)
- Usage analytics (`/analytics/summary`)
- Reports & exports — monthly PDF/CSV/XLSX, official usage, certification &
  upload-usage reports (authenticated download → share sheet)

**Administrator**
- Dashboard + recent activity (`/admin/dashboard/summary`, `/recent-activity`)
- Manage librarians & admins — list / create / activate / deactivate
  (`/admin/librarians*`, `/admin/admins*`)
- System logs + error logs (`/admin/system-logs`, `/admin/error-logs`)
- Usage analytics & reports

**Authenticated file downloads** (`src/utils/downloadFile.ts`) attach the staff
header-auth + session cookie via `expo-file-system`, then open the file with
`expo-sharing` — used for thesis PDFs, executive summaries, generated
certificates/forms, and every report export.

**Intentionally excluded** (server-side / dev-only, not aligned to mobile use):
Elasticsearch admin, NLP enrichment jobs, cache/db/rate-limit/system-health/
error-dashboard ops endpoints, OpenAPI docs, Prometheus metrics, email-config
test endpoints, and the in-browser PDF screenshot-protection hooks (mobile opens
PDFs in the OS viewer).
```
