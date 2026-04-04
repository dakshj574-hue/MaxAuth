# MaxAuth Security Platform

MaxAuth is a comprehensive, multi-tenant authentication platform designed to provide seamless, secure access management for modern web applications. It empowers developers to integrate frictionless login flows globally while offering an administrative dashboard to manage tenants, view active sessions, and enforce strict security policies like Multi-Factor Authentication (MFA).

---

## 🚀 Authentication Methods

MaxAuth is built to support a wide range of highly secure authentication mechanisms:

- **Passkeys (WebAuthn / Biometrics)**: Passwordless, high-security logins using TouchID, FaceID, or hardware keys.
- **Magic Links**: Frictionless passwordless authentication via email.
- **Email OTP**: Secure 6-digit one-time passwords delivered via Resend for instant verification.
- **Phone Authentication (SMS)**: Powered by Firebase for robust mobile OTP verification.
- **Standard Passwords**: Traditional encrypted password management with strength evaluation.
- **Multi-Factor Authentication (MFA)**: Support for secondary checks utilizing Email OTP or Phone OTP layered on top of core routines.

## ✨ Key Platform Features

- **Multi-Tenant Architecture**: Strict data segregation strictly by `projectId` via seamless API Key management.
- **Sessions Management**: Control, view, and terminate active web sessions live from the dedicated admin dashboard.
- **Threat Detection System**: Monitors and logs suspicious events natively.
- **Drop-in JavaScript SDK**: Lightweight package for seamless frontend initialization and challenge handling.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, Firebase (Firestore, Phone Auth), SimpleWebAuthn, Resend (Email Delivery)
- **Frontend / Dashboards**: React 18, Vite, Tailwind CSS, Lucide React
- **SDK**: Vanilla JS / TypeScript-compatible API wrapper

---

## 📂 Folder Structure

The repository is organized as a monorepo for simplified maintenance across the platform's services:

```text
MaxAuth/
├── backend/            # Core Node.js/Express.js REST API and auth services
├── frontend/
│   ├── maxauth-admin/  # React-based admin dashboard for platform management
│   ├── maxauth-sdk/    # JavaScript SDK for easy integration into client apps
│   └── maxauth/        # Fully functional React demo application showcasing login flows
├── test.html           # Helper page for standalone UI/SDK testing
└── README.md           # Documentation
```

> **Note**: Sensitive files such as `.env` and `serviceAccountKey.json`, along with `dist` / `build` folders, are strictly ignored by `.gitignore` globally and at the respective folder levels.

---

## 🔌 API Endpoints Overview

The backend uses a strict layered architecture and groups endpoints logically. Except for initial project registration, all operational requests require an `x-api-key` header to dictate the tenant scope.

### Project & Tenant Management (`/api/projects`)
- `POST /register`: Registers a new project tenant and issues a secure API Key.
- `GET /`: Lists projects globally (for dashboard).
- `GET /settings`: Retrieves the project's Multi-Factor Authentication (MFA) settings.
- `PATCH /settings`: Updates the project's Multi-Factor Authentication (MFA) parameters.
- `DELETE /:projectId`: Deactivates an active project instance.

### User Authentication (`/api/auth`)
- `POST /signup`: Registers users natively with conventional passwords or prepares robust configurations.
- `POST /login`: Primary unified login endpoint that evaluates flow logic and returns multi-stage session tokens.

### Passkeys (`/api/passkeys`)
- `GET /register/options` & `POST /register/verify`: Handles hardware or biometric security key associations.
- `GET /login/options` & `POST /login/verify`: Handles authentication using pre-registered biometrics.

### One-Time Passwords (`/api/otp` & `/api/magiclink`)
- `POST /send`: Triggers Email OTPs via Resend or handles Firebase SMS preparations.
- `POST /verify`: Completes the OTP challenge and finalizes authentication.
- `POST /magiclink/send` & `GET /magiclink/verify`: Handles the secure URL-based click-to-login strategy.

### Multi-Factor Authentication (`/api/mfa`)
- `POST /challenge`: Initiates a secondary MFA verification flow for users with robust needs.
- `POST /verify`: Completes the MFA evaluation and sets secondary sessions.

---

## 💻 Running Locally

### 1. Starting the Backend API
```bash
cd backend
npm install
```
Ensure you create a `.env` file based on `.env.example` configurations. If you utilize Firebase modules, place your `.env` secrets correctly.

```bash
npm run dev
# or: node server.js
```
The backend engine typically runs securely on port 5000 (`http://localhost:5000`).

### 2. Running Frontend Applications
You can run any of the frontend clients dependently or independently. For tracking project tasks, run the Admin Dashboard:

```bash
cd frontend/maxauth-admin
npm install
npm run dev
```

For viewing the End-User implementation via React:
```bash
cd frontend/maxauth
npm install
npm run dev
```
This will start a Vite development server globally bound (usually on `http://localhost:3000` or `http://localhost:5173`).

---

## 🛡️ Best Practices & Security Notes

- Do not commit your `.env` variables or sensitive configurations.
- When utilizing the **multi-tenant** platform APIs, ensure every external operational API request includes your designated `x-api-key` header securely.
