# MaxAuth

An open source multi-tenant authentication platform I built as a BTech project. 
The idea is similar to Auth0 or Clerk — developers can plug this into their apps 
and get authentication without building it from scratch.

## What it does

Developers (I call them Y users) register a project and get an API key. They use 
that key to call MaxAuth's API or use the JavaScript SDK. Their end users (X users) 
just see a normal login page and never know MaxAuth is running behind the scenes.

## Authentication methods

- Magic Link — sends a signed link to the user's email, clicking it logs them in
- Email OTP — sends a 6 digit code to email via Resend
- Phone OTP — sends SMS via Firebase (free up to 10k/month)
- Passkey / WebAuthn — fingerprint, face ID, or Windows Hello
- Password — standard bcrypt hashed password login
- MFA — any of the above as a second factor after first login succeeds

## Tech stack

- Backend: Node.js, Express, Firebase Firestore
- Email: Resend
- Phone OTP: Firebase Authentication
- Passkeys: SimpleWebAuthn
- Frontend dashboard: React + Vite + Tailwind CSS
- SDK: Vanilla JavaScript

## Folder structure MaxAuth/
├── backend/              # Express API
├── frontend/
│   ├── maxauth-admin/    # Admin dashboard
│   ├── maxauth-sdk/      # JavaScript SDK
│   └── maxauth/          # Demo app
├── test.html             # Test all auth flows in browser
└── README.md 
## Running locally

**Backend:**
```bash
cd backend
npm install
# copy .env.example to .env and fill in your values
npm run dev
```

**Admin dashboard:**
```bash
cd frontend/maxauth-admin
npm install
npm run dev
```

Backend runs on `http://localhost:5000`  
Dashboard runs on `http://localhost:5173`

## Environment variables

Copy `backend/.env.example` to `backend/.env` and fill in:
- Firebase service account key
- Resend API key
- JWT secrets (generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- MFA secret

## API overview

All endpoints except `/api/projects/register` require an `x-api-key` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/projects/register | Create a new project, get API key |
| POST | /api/auth/login | Password login |
| POST | /api/magic/send | Send magic link |
| GET | /api/magic/verify | Verify magic link token |
| POST | /api/otp/send | Send email OTP |
| POST | /api/otp/verify | Verify email OTP |
| POST | /api/otp/verify-phone | Verify Firebase phone token |
| POST | /api/passkey/register/start | Start passkey registration |
| POST | /api/passkey/login/start | Start passkey login |
| POST | /api/mfa/challenge | Trigger MFA second factor |
| POST | /api/mfa/verify | Complete MFA verification |
| GET | /api/projects/settings | Get MFA settings |
| PATCH | /api/projects/settings | Update MFA settings |
| GET | /api/sessions | Get active sessions |
| DELETE | /api/sessions/:id | Terminate a session |

## Security features

- API keys hashed with SHA-256 before storing
- JWT access tokens expire in 15 minutes, refresh tokens in 7 days
- Rate limiting on all auth endpoints
- Audit log for every login attempt
- Suspicious activity detection — flags impossible travel (>900 km/h), excessive failed logins, unrecognized devices
- MFA tokens are single use and expire in 5 minutes
- CORS restricted to allowed origins only

## Notes

- `.env` and `serviceAccountKey.json` are in `.gitignore` and never committed
- Phone OTP requires Y developer to set up their own Firebase project
- MFA can be toggled on/off per project from the admin dashboard
