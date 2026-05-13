# IoTPaaS — MQTT Dashboard Guide / Hướng Dẫn Sử Dụng MQTT Dashboard
I know most of you guys gonna use AI, so just throw this file in and tell it to remember the channels, good luck!
---

## 🇬🇧 ENGLISH

### Overview

This standalone HTML dashboard connects directly to the IoTPaaS MQTT broker via WebSocket (WSS). It allows you to monitor sensor data and control relays on ESP32 and ESP8266 boards in real time — without using the IoTPaaS web platform.

---

### How to Connect

1. Open `mqtt-dashboard.html` in any modern browser.
2. Fill in the **connection fields**:

| Field | What to enter |
|---|---|
| **Broker URL** | `wss://mqtt.iot-paas.io.vn/mqtt` (pre-filled) |
| **MQTT Username** | Your **User ID** (UUID) — found in your account settings or browser Local Storage |
| **MQTT Password** | Your **Supabase JWT access token** — see below how to get it |
| **User ID** | Same as MQTT Username (your User ID) |
| **Client ID** | Leave blank (auto-generated), or enter any unique string |

3. Enter the **Device ID** (UUID) of your ESP32 and/or ESP8266 in the device cards below the connection panel.
4. Click **Connect**.

---

### How to Get Your JWT Access Token

1. Open **iot-paas.io.vn** in your browser and log in.
2. Open DevTools (F12) → **Application** tab → **Local Storage**.
3. Find the key that starts with `sb-foasfefvuuijmhlrdtko-auth-token`.
4. Expand it and copy the `access_token` value (starts with `eyJ...`).
5. Paste it into the **MQTT Password** field.

> ⚠️ **JWT tokens expire after ~1 hour.** If the dashboard disconnects, get a fresh token.

---

### How It Works

- **Sensor data:** The dashboard subscribes to `u/{userId}/d/{deviceId}/out/#`. When the device publishes sensor readings (temperature, humidity, motion, light), they appear on the sensor cards automatically.
- **Relay control:** Clicking a relay toggle publishes plain text `on` or `off` to `u/{userId}/d/{deviceId}/in/{relay_channel}`. The device receives it and responds on `out/{relay_channel}`.
- **Message log:** All incoming and outgoing MQTT messages are shown at the bottom.
- **Custom publish:** You can manually publish any topic/payload using the Custom Publish section.

---

### Important Notes

1. **Authentication mode:** The dashboard connects as a **User** (User ID + JWT), NOT as a device. This means:
   - It will NOT kick your real devices offline (no client ID conflict).
   - The ACL allows users to subscribe to `out/#` and publish to `in/{channel}`.

2. **Relay payload format:** The firmware expects **plain text** `on` / `off`, NOT JSON like `{"value":"on"}`. The dashboard sends plain text.

3. **Topic directions follow the device's perspective:**
   - `out` = data FROM the device (sensor readings, relay state confirmations)
   - `in` = commands TO the device (relay toggles)

4. **Channel names:** The dashboard handles these channel names: `temperature`, `temp`, `dht11_temperature`, `humidity`, `humid`, `dht11_humidity`, `motion`, `pir`, `light`, `ldr`, `relay1`, `relay_1`, `relay2`, `relay_2`. If your firmware uses different names, update the `CHANNELS` object and the `handleIncoming()` function in the HTML file.

5. **ESP8266 LDR note:** `analogRead()` on ESP8266 always reads from A0 regardless of the pin argument. If LDR is on D7 (GPIO13), it will only return digital 0/1 values, not analog.

---

## 🇻🇳 TIẾNG VIỆT

### Tổng Quan

Dashboard HTML độc lập này kết nối trực tiếp đến MQTT broker của IoTPaaS qua WebSocket (WSS). Cho phép theo dõi dữ liệu cảm biến và điều khiển relay trên board ESP32 và ESP8266 theo thời gian thực — không cần sử dụng giao diện web IoTPaaS.

---

### Cách Kết Nối

1. Mở file `mqtt-dashboard.html` trên trình duyệt bất kỳ.
2. Điền các **trường kết nối**:

| Trường | Nội dung cần nhập |
|---|---|
| **Broker URL** | `wss://mqtt.iot-paas.io.vn/mqtt` (đã điền sẵn) |
| **MQTT Username** | **User ID** (UUID) của bạn — tìm trong cài đặt tài khoản hoặc Local Storage trình duyệt |
| **MQTT Password** | **JWT access token** từ Supabase — xem hướng dẫn bên dưới |
| **User ID** | Giống MQTT Username (User ID của bạn) |
| **Client ID** | Để trống (tự tạo), hoặc nhập chuỗi bất kỳ |

3. Nhập **Device ID** (UUID) của ESP32 và/hoặc ESP8266 vào ô tương ứng bên dưới.
4. Nhấn **Connect**.

---

### Cách Lấy JWT Access Token

1. Mở **iot-paas.io.vn** trên trình duyệt và đăng nhập.
2. Mở DevTools (F12) → tab **Application** → **Local Storage**.
3. Tìm key bắt đầu bằng `sb-foasfefvuuijmhlrdtko-auth-token`.
4. Mở rộng và copy giá trị `access_token` (bắt đầu bằng `eyJ...`).
5. Dán vào trường **MQTT Password**.

> ⚠️ **JWT token hết hạn sau ~1 giờ.** Nếu dashboard bị ngắt kết nối, lấy token mới.

---

### Cách Hoạt Động

- **Dữ liệu cảm biến:** Dashboard subscribe vào `u/{userId}/d/{deviceId}/out/#`. Khi thiết bị publish dữ liệu cảm biến (nhiệt độ, độ ẩm, chuyển động, ánh sáng), chúng hiển thị tự động trên các thẻ cảm biến.
- **Điều khiển relay:** Nhấn toggle relay sẽ publish plain text `on` hoặc `off` đến `u/{userId}/d/{deviceId}/in/{relay_channel}`. Thiết bị nhận và phản hồi trên `out/{relay_channel}`.
- **Nhật ký tin nhắn:** Tất cả tin nhắn MQTT đến và đi đều hiển thị ở phần dưới.
- **Publish tùy chỉnh:** Bạn có thể publish thủ công bất kỳ topic/payload nào.

---

### Lưu Ý Quan Trọng

1. **Chế độ xác thực:** Dashboard kết nối với tư cách **User** (User ID + JWT), KHÔNG phải device. Điều này có nghĩa:
   - Sẽ KHÔNG đẩy thiết bị thật offline (không xung đột client ID).
   - ACL cho phép user subscribe vào `out/#` và publish vào `in/{channel}`.

2. **Định dạng payload relay:** Firmware nhận **plain text** `on` / `off`, KHÔNG phải JSON như `{"value":"on"}`. Dashboard gửi đúng plain text.

3. **Hướng topic theo góc nhìn của thiết bị:**
   - `out` = dữ liệu TỪ thiết bị (đọc cảm biến, xác nhận trạng thái relay)
   - `in` = lệnh ĐẾN thiết bị (bật/tắt relay)

4. **Tên channel:** Dashboard xử lý các tên channel: `temperature`, `temp`, `dht11_temperature`, `humidity`, `humid`, `dht11_humidity`, `motion`, `pir`, `light`, `ldr`, `relay1`, `relay_1`, `relay2`, `relay_2`. Nếu firmware dùng tên khác, cập nhật object `CHANNELS` và hàm `handleIncoming()` trong file HTML.

5. **LDR trên ESP8266:** `analogRead()` trên ESP8266 luôn đọc từ chân A0 bất kể tham số pin. Nếu LDR ở D7 (GPIO13), nó chỉ trả về giá trị digital 0/1, không phải analog.

---

*Last updated: April 19, 2026*

