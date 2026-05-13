# Smart Home System Guide

Welcome to the documentation for your complete Full-Stack Smart Home System! This guide was written progressively to serve as an easy-to-understand manual for developers, students, and engineers.

---

## 1. System Overview

The system bridges raw hardware logic to a modern, Progressive Web Application via a Python Flask intermediary.

1. **ESP32 Code (Hardware):** Reads inputs from the `DHT11` (Temp/Humidity) and `PIR` (Motion) sensors locally, and publishes values to `test.mosquitto.org` (a public MQTT broker) every 3 seconds.
2. **Flask Backend (Middleman):** Subscribes to the same MQTT topics in a background thread. Incoming data is caught in `on_message` and saved to an `SQLite3` database to retain history. It also provides a robust REST API for the frontend.
3. **React Frontend (UI):** Automatically polls the Flask API `GET /api/data` every few seconds to grab the latest SQLite row and visually renders it onto intuitive dashboard cards. It dynamically resolves the IP to support mobile phones.

---

## 2. File Explanations

Here is a breakdown of what the directories do:

### `backend/`
- `app.py`: The entry point. Initializes the database and starts the background MQTT thread.
- `routes/`: Contains logic for our APIs (`auth.py` and `sensor.py`).
- `services/`: The logic for connecting to MQTT (`mqtt_service.py`) and accessing SQLite (`database.py`).
- `models/`: Abstractions for wrapping database SQL queries cleanly (`sensor_model.py`).

### `frontend/`
- `public/`: Hosts the PWA (Progressive Web App) files like `manifest.json` and `service-worker.js`.
- `src/components/`: Reusable React components like the Dashboard UI cards and the Loading screen.
- `src/hooks/`: Contains custom React hooks. `useSensorData.js` handles our data polling cleanly.
- `src/services/api.js`: A helper to centralize how our frontend contacts Flask.
- `src/pages/`: Fullpage views like Login, Dashboard, Analytics, and NotFound.

### `iot_device/`
- `esp32_smart_home.ino`: The Arduino C++ code that flashes onto the ESP32.

---

## 3. How to Run the Project

### Running the ESP32
1. Open `iot_device/esp32_smart_home.ino` in the Arduino IDE.
2. Change the `YOUR_WIFI_SSID` and `YOUR_WIFI_PASSWORD` at the top of the file.
3. Connect your ESP32, select the correct Port and Board, and press **Upload**.

### Running the Backend
1. Open a new terminal and navigate to `backend/`.
2. Ensure you have the dependencies: `pip install -r requirements.txt`.
3. Start the server (Wait for any existing `python app.py` running sessions to be stopped first!):
   ```bash
   python app.py
   ```
4. Flask will now host on `http://0.0.0.0:5000`.

### Running the Frontend
1. Open a terminal and navigate to `frontend/`.
2. Run `npm install` (if you haven't already).
3. Start the Vite server:
   ```bash
   npm run dev
   ```
4. Access it on your host machine at `http://localhost:5173`.
5. **Mobile View:** Look at the Vite terminal output to see your Network IP (e.g. `http://192.168.x.x:5173`). Open this IP on your iPhone Safari, tap **Share**, and select **Add to Home Screen** to install the PWA natively!

---

## 4. API Endpoints

- `GET /api/data`: Returns the latest single sensor entry for temperature, humidity, and motion.
- `GET /api/history`: Returns up to 20 recorded historical entries. Accepts `?limit=` and `?topic=` arguments.
- `POST /api/login`: Accepts JSON `{"username": "admin", "password": "admin"}` to return a token.
- `POST /api/device/toggle`: Accepts JSON `{"device": "light", "state": "1"}` to trigger a publish action from the Backend out to the MQTT server.

---

## 5. Common Errors & Fixes
- **CORS Error:** If your frontend fails to fetch locally, ensure `CORS(app)` is running in `app.py`.
- **localhost vs IP:** Hardcoding URLs to `localhost` means phones on your Wi-Fi cannot access them. We solved this securely by using `window.location.hostname` in `src/services/api.js`.
- **Blank White Screen:** Unhandled runtime exceptions in React force the app to unmount and show white. We solved this by creating `<Loading />` buffers and using solid try/catches inside `useSensorData.js`. If you see "System Offline", make sure you have restarted your `app.py` script.
