# IoT Smart Home Security Platform

An IoT Smart Home project focused on real-time monitoring, device control, and security hardening. The current workspace combines a React dashboard, a Flask + SQLite operational backend for MQTT-driven telemetry, ESP32/ESP8266 firmware, and a parallel Node.js security API track that introduces JWT authentication, role-based access control, brute-force protection, account lock/unlock flows, audit logging, and email alerts. The project also documents secure MQTT communication over MQTTS/TLS for cloud-broker deployments.

## Current Features

### Frontend
- React 19 + Vite dashboard with responsive desktop/mobile layout.
- Login screen with dark/light theme support and session persistence via `localStorage`.
- Protected app shell with page-level views for Dashboard, Security, Environment, Profile, and Analytics.
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
- Express 5 API with `helmet`, `cors`, JSON body limits, and centralized error handling.
- MongoDB connection management through Mongoose.
- JWT authentication with issuer, audience, and expiry support.
- Role-based access control for `Guest`, `HomeOwner`, and `SuperAdmin`.
- Brute-force resistance with failed-login counting and automatic account lock after repeated failures.
- Rate limiting for both general API traffic and authentication routes.
- Security audit logging via MongoDB `SecurityLog` model.
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
- Expo-based mobile client scaffold with dashboard, environment, security, profile, and login screens.
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

### Run the Current Web App from Scratch

This is the path that matches the current React dashboard integration in the workspace.

#### 1. Start the Flask backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

The Flask backend runs on `http://127.0.0.1:5000`.

#### 2. Start the React frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

The React app runs on `http://127.0.0.1:5173`.

### Optional: Run the Node.js Security API Track

Use this if you want to test the JWT/RBAC/brute-force/MongoDB backend separately from the Flask runtime.

#### Option A: local MongoDB

```powershell
cd backend
npm install
npm run seed:superadmin
npm start
```

#### Option B: Docker Compose

```powershell
cd backend
docker compose up --build
```

### Optional Helper Scripts

- Full startup check: `scripts\SETUP_AND_RUN.ps1`
- One-click Windows launcher: `scripts\RUN_ALL.bat`
- Backend-only helper: `backend\start_backend.ps1`

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

## Notes on Current State

- The React app is now integrated with the Node.js Security API for production authentication and data management, while retaining local compatibility with the Flask runtime.
- The Node.js security API is present and more security-focused, but it is a parallel backend track rather than the one the current frontend is fully wired to.
- MQTTS/TLS is implemented in the Python MQTT service for HiveMQ Cloud, while some frontend mock/demo code still references public broker simulation paths for UI development.
