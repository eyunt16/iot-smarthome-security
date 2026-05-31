# IoT Smart Home Security Platform

An IoT Smart Home project focused on real-time monitoring, device control, and security hardening. The platform features a React dashboard fully integrated with a production-grade Node.js + Express security backend. It implements JSON Web Tokens (JWT) authentication, role-based access control (RBAC), brute-force login protection, account lockout/unlock workflows, security audit logging, and automated email alerts, backed by MongoDB. Secure MQTT communication over MQTTS/TLS connects both the Express server and alternative Python/Flask runtime to HiveMQ Cloud.

## 🌍 Live Demo & Deployment Notes

Welcome! Below you'll find live links, environment setup instructions, and important deployment notes for the IoT Smart Home Security system. This information is especially helpful for recruiters, technical reviewers, and anyone evaluating the project.

### 🚀 Live Links

- **Frontend (Live Demo):** [https://iot-smarthome-security.vercel.app](https://iot-smarthome-security.vercel.app)
- **Backend API Base URL:** [https://iot-smarthome-security.onrender.com/api](https://iot-smarthome-security.onrender.com/api)

### ⚙️ Environment Variables Setup (.env)

- **Frontend:**
  - The `VITE_API_BASE_URL` variable **MUST** include `/api` at the end. Example:
    ```env
    VITE_API_BASE_URL=https://iot-smarthome-security.onrender.com/api
    ```
- **Backend:**
  - Set the following for CORS configuration:
    ```env
    FRONTEND_ORIGIN=https://iot-smarthome-security.vercel.app
    ```
- **Database:**
  - Provide a valid MongoDB Atlas connection string in the backend `.env` file. Example:
    ```env
    MONGODB_URI=your_mongodb_string
    ```

### 📝 Important Deployment Notes

- **Render Free Tier Sleep Mode:**
  - The backend API on Render may take 50-60 seconds to spin up on the first request if it has been inactive. Please be patient when accessing the API after a period of inactivity.
- **Rate Limiting:**
  - The `/api/auth/login` endpoint is protected by a strict rate limiter to prevent brute-force attacks. If you see a "Too many authentication attempts" message, please wait 15 minutes before trying again.
- **MongoDB Network Access:**
  - Ensure your MongoDB Atlas Network Access is set to `0.0.0.0/0` (Allow access from anywhere) so that the Render backend can successfully connect to the database.

Thank you for reviewing and exploring the IoT Smart Home Security platform!

## Current Features

### Frontend
- React 19 + Vite dashboard with responsive desktop/mobile layout.
- Login screen with dark/light theme support and session persistence via `localStorage`.
- Protected app shell with page-level views for Dashboard, Security, Environment, Profile, and Analytics.
- Global Settings Context and customizable Notification utility for enhanced UX.
- Live sensor simulation hook for temperature, humidity, and motion data with rolling history windows.
- Real-time styled MQTT command log UI.
- Device control widgets for light brightness and fan speed.
- Security dashboard cards for intrusion detection, motion alerts, protocol status, and locked-account management UI.
- Environment charts built with Recharts for temperature and humidity trends.
- Profile and privacy settings screens with local toggle state.
- Axios API layer with bearer-token injection and automatic logout on `401`.
- Vite dev proxy from `/api` to `http://127.0.0.1:5000`.

### Backend Runtime (Current Flask/SQLite Path)
- Flask API serving health, auth, sensor, history, device status, and control endpoints.
- SQLite database initialization with tables for users, devices, sensor readings, device state, API logs, and MQTT logs.
- Background MQTT subscriber thread started with the Flask app.
- Secure HiveMQ Cloud MQTT client implementation in `backend/services/mqtt_service.py` using TLS on port `8883`.
- MQTT publish helpers for device control commands.
- `POST /api/login` and `POST /api/auth/login`
- `POST /api/register` and `POST /api/auth/register`
- `GET /api/data`
- `GET /api/history`
- `GET /api/devices`
- `GET /api/devices/status`
- `POST /api/device/control`
- `POST /api/device/command`
- `POST /api/device/toggle`
- `POST /api/device/light/:light_num`
- `POST /api/device/fan`
- `POST /api/device/motor`
- `POST /api/device/stepper`
- Compatibility auth endpoints for locked-user listing and unlock actions so the UI does not fail.
- Console monitoring utility in `backend/monitor.py` for system, API, MQTT, and sensor statistics.

### Security API Track (Node.js / MongoDB)
- Express 5 API with `helmet`, `cors`, JSON body limits, request sanitization, and centralized error handling.
- MongoDB connection management through Mongoose.
- JWT authentication with issuer, audience, and expiry support.
- Role-based access control for `Guest`, `HomeOwner`, and `SuperAdmin`.
- Brute-force resistance with failed-login counting, automatic account lock, and dynamic IP Banning capabilities.
- Rate limiting for both general API traffic and authentication routes.
- Security audit logging via MongoDB `SecurityLog` model.
- Dynamic backend settings management via MongoDB `Setting` model.
- SuperAdmin-only locked-user review and account unlock endpoints.
- Email alert support through Nodemailer for lockouts and unauthorized access attempts.
- Dockerfile and Docker Compose configuration for the Node API + MongoDB stack.
- SuperAdmin seeding script for bootstrapping a privileged account.

### Database and Data Layer
- SQLite operational database at `backend/data/iot_smart_home.db`.
- Additional SQLite file `backend/database.db` from older MQTT ingestion flow.
- MongoDB schemas for `User`, `SecurityLog`, `SensorLog`, `Device`, and `Node`.
- Indexed persistence for lock state, login attempts, device metadata, telemetry, and security events.

### Firmware and Related Clients
- ESP32 firmware sources for smart-home device control and telemetry publishing.
- ESP8266 firmware source for alternate device setup.
- Expo-based mobile client with dark/light ThemeContext, dedicated utility services, and screens for dashboard, environment, security, profile, and login.
- Project scripts for Windows one-click startup and setup verification.

## Tech Stack

- Frontend: React 19, Vite 8, Tailwind CSS 4, Framer Motion, Recharts, Axios, React Router, Lucide React, MQTT.js
- Backend runtime: Python, Flask, Flask-CORS, Paho MQTT, SQLite
- Security API track: Node.js 20+, Express 5, Mongoose, MongoDB, JSON Web Token, bcryptjs, express-rate-limit, Helmet, Nodemailer, dotenv
- IoT / Messaging: MQTT, MQTTS/TLS, HiveMQ Cloud, Mosquitto test broker references
- Mobile: Expo, React Native
- Firmware: Arduino/ESP32/ESP8266 sketches

## Getting Started

### Prerequisites

- Node.js `20+`
- npm
- Python `3.10+`
- `pip`
- Windows PowerShell for the provided scripts
- MongoDB or Docker Desktop if you want to run the separate Node.js security API track

### Environment Variables

The current Flask backend does not read from a `.env` file. Its MQTT broker, database path, and demo credentials are defined in code under `backend/config/config.py` and `backend/services/mqtt_service.py`.

The Node.js security API does require environment variables. Create `backend/.env` if you want to run `backend/server.js`:

```env
PORT=5000
NODE_ENV=development
FRONTEND_ORIGIN=http://127.0.0.1:5173

MONGODB_URI=mongodb://127.0.0.1:27017/iot_smart_home

JWT_SECRET=change-this-to-a-long-random-secret
JWT_EXPIRES_IN=12h
JWT_ISSUER=iot-smart-home-api
JWT_AUDIENCE=iot-smart-home-clients

RATE_LIMIT_MAX=200
AUTH_RATE_LIMIT_MAX=10

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
ADMIN_EMAIL=

SEED_SUPERADMIN_USERNAME=admin
SEED_SUPERADMIN_EMAIL=admin@example.com
SEED_SUPERADMIN_PASSWORD=Admin@123456
```

For the React app, create `frontend/.env` only if you want to override the default proxy-based API target:

```env
VITE_API_BASE_URL=http://127.0.0.1:5000/api
```
## 🚀 Deployment & Live Demo

The system is fully deployed on high-availability cloud infrastructures:

- **Frontend Dashboard (React + Vite):** `https://iot-smarthome-security.vercel.app` 
  *(Note: Replace with your actual Vercel URL)*
- **Security Backend API (Node.js/Express):** `https://iot-smarthome-security.onrender.com`
- **Database Layer:** MongoDB Atlas (Cloud Cluster)

### ⚙️ Environment Configuration (Production)

The following environment variables are configured for secure cross-origin communication:

#### Backend (Render)
- `MONGODB_URI`: Secure connection string to the MongoDB Atlas cluster.
- `FRONTEND_ORIGIN`: Restricted to the production Vercel URL to enforce strict CORS policies.
- `JWT_SECRET`: High-entropy key for stateless user authentication.

#### Frontend (Vercel)
- `VITE_API_BASE_URL`: Mapped to the production Render endpoint for API orchestration.

### Run the Web App from Scratch

To launch the primary platform, start the Node.js Security Backend and the React Frontend.

#### 1. Start the Node.js Security Backend (Express + MongoDB)
The primary backend implements all JWT authentication, RBAC, brute-force mitigation, and audit logging.

Create a `backend/.env` file with the correct database and port details (default 5000). Then run:
```powershell
cd backend
npm install
npm run seed:superadmin   # Automatically seeds the default SuperAdmin account
npm start
```
The Node.js backend runs on `http://127.0.0.1:5000` and connects to MongoDB Atlas and HiveMQ Cloud over MQTTS.

#### 2. Start the React Frontend
In a second terminal:
```powershell
cd frontend
npm install
npm run dev
```
The React frontend runs on `http://127.0.0.1:5173`. Vite automatically proxies API calls `/api` to the backend on `http://127.0.0.1:5000`.

---

### Alternative: Run the Legacy Python Runtime (Flask + SQLite)
If you want to run the secondary, legacy operational telemetry backend:
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```
*Note: The Flask runtime operates on port 5000 and is for local operational SQLite/MQTT logging, but does not support the full Node.js security authentication suite.*

---

## 🔒 Comprehensive Security Verification Suite

The platform includes a dedicated, automated security assertion script at `backend/tests/run_verification_tests.js`. This suite programmatically simulates threats and asserts the correct enforcement of all platform security mechanisms against a running backend API.

### What is Verified
- **TEST A: Brute-Force Lockout**: Simulates sequential failed login storms. Asserts that the account is locked exactly at attempt $N = 5$, rejects subsequent logins (even with correct credentials) with HTTP `403 Forbidden`, and verifies direct database integrity (`isLocked: true`).
- **TEST B: Role-Based Access Control (RBAC)**: Simulates access matrix enforcement across `Guest`, `HomeOwner`, and `SuperAdmin` roles for read-only (`GET /api/sensors`), write (`POST /api/device/control`), and administrative (`GET /api/admin/locked-users`) endpoints.
- **TEST C: IP-Based Authentication Rate Limiter**: Floods the authentication endpoints. Asserts that the IP rate limiter blocks excessive requests with HTTP `429 Too Many Requests` at the $11$-th attempt and extracts the `Retry-After` header.
- **TEST D: JWT Expiry Validation**: Generates a cryptographically valid token signed with the proper secret but with a past expiration claim. Asserts that the backend rejects the expired token with HTTP `401 Unauthorized` and the specific reason payload.

### How to Run

1. Make sure your primary Node.js backend is running (`npm start` inside `backend` folder).
2. Open a terminal and run the test suite:

#### Standard Mode (Verbose details)
Prints every request status, response message, database document states, and matrix tables:
```powershell
cd backend/tests
node run_verification_tests.js
```

#### Compact Mode (Summary-only)
Suppresses verbose output to display a clean, highly condensed **Executive Summary Matrix** designed to fit perfectly in a single screenshot or thesis figure:
```powershell
cd backend/tests
node run_verification_tests.js --summary
```

**Compact Mode Console Output Example:**
```text
================================================================================
               SECURITY VERIFICATION SUITE — EXECUTIVE SUMMARY
================================================================================
 TEST A: Brute-Force Lockout Mitigation  .......................... [ PASS ]
 TEST B: Role-Based Access Control (RBAC)  ........................ [ PASS ]
     ├─ Read-only (Guest/HomeOwner/SuperAdmin)  ................... [ PASS ]
     ├─ Write control (HomeOwner/Admin allowed, Guest blocked) .... [ PASS ]
     └─ Administrative access (SuperAdmin only)  .................. [ PASS ]
 TEST C: IP-based Authentication Rate Limiter  .................... [ PASS ]
 TEST D: JSON Web Token (JWT) Expiry Validation  .................. [ PASS ]
================================================================================

[SUCCESS] All verification results successfully logged and saved to:
--> C:\Prethesis\iot-smarthome-security\test_results.txt
```

All detailed verification outputs are always written to the persistent log file at [test_results.txt](file:///C:/Prethesis/iot-smarthome-security/test_results.txt).

### Optional Helper Scripts

- Full startup check: `scripts\SETUP_AND_RUN.ps1`
- One-click Windows launcher: `scripts\RUN_ALL.bat`
- Backend-only helper: `backend\start_backend.ps1`
- Mobile app launcher: `start-mobile.bat`

## Project Structure

```text
iot-smarthome-security/
|-- backend/                # Flask runtime, SQLite data layer, Node security API, Docker config
|   |-- app.py              # Flask entry point
|   |-- server.js           # Express/JWT/Mongo security API entry point
|   |-- routes/             # Flask and Express route handlers
|   |-- services/           # MQTT + SQLite services
|   |-- models/             # SQLite access model and MongoDB schemas
|   |-- middleware/         # JWT auth and RBAC middleware for Express API
|   |-- controllers/        # Express auth controller
|   |-- scripts/            # SuperAdmin seed script
|   |-- config/             # Flask and MongoDB configuration
|   `-- data/               # SQLite database files
|-- frontend/               # React + Vite dashboard
|   |-- src/components/     # Reusable UI and control widgets
|   |-- src/pages/          # Dashboard, Security, Environment, Profile, Analytics views
|   |-- src/hooks/          # MQTT and client-side data hooks
|   |-- src/services/       # API and auth session utilities
|   `-- public/             # PWA/static assets
|-- mobile/                 # Expo / React Native client scaffold
|-- iot_device/             # ESP32/ESP8266 firmware and deployment notes
|-- docs/                   # Architecture, setup, audit, and system guides
`-- scripts/                # Windows setup and run helpers
```

## 🛡️ Current Platform Security Hardening Status

- **JWT Auth & Session Lifecycle**: Integrated securely on the React client with Axios interception. Logging out automatically invalidates sessions on `401` responses.
- **RBAC Matrix Enforcement**: All operational routes are protected on the Express API based on roles (`Guest`, `HomeOwner`, `SuperAdmin`), preventing role bypass or privilege escalation.
- **IP Ban & Bruteforce Lockout**: Accounts automatically lock after 5 incorrect password attempts. Extreme traffic triggers temporary IP rate bans, mitigating distributed attacks.
- **Audited Events**: Important access triggers, failed authentications, door unlocks, and administrative actions are logged in MongoDB via an audit log trail.
- **MQTTS Secure Broker Pipeline**: Both the Express backend and Flask runtime communicate with the HiveMQ Cloud MQTTS broker on port 8883 over TLS, keeping device publications secure.
