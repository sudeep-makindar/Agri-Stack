# ESP32 Sensor Gateway + Laptop Unified API --- Agent Integration Guide

## 1. Purpose

This document describes the complete architecture, ESP32 firmware API,
laptop FastAPI gateway, sensor telemetry schema, actuator commands,
transport fallback, request/response formats, and data flow for the
current ESP32 Gateway system.

The intended consumer is an external AI/software agent that needs to:

-   Read all sensor data.
-   Read one specific sensor.
-   Read telemetry history.
-   Turn a relay ON/OFF.
-   Send a message to the ESP32 OLED.
-   Send an SMS through the SIM800L.
-   Understand whether the laptop is currently receiving data over WiFi
    or USB.
-   Use the laptop gateway as the stable API surface instead of directly
    depending on the ESP32 transport.

------------------------------------------------------------------------

# 2. High-Level Architecture

``` text
                         ┌─────────────────────────────┐
                         │          ESP32               │
                         │                             │
                         │  DHT11                      │
                         │  BMP180                     │
                         │  MPU9250                    │
                         │  MQ-6                       │
                         │  Soil ADC placeholder       │
                         │  GPS                         │
                         │  DS3231 RTC                 │
                         │                             │
                         │  OLED                       │
                         │  Relay                      │
                         │  SIM800L GSM                │
                         └──────────────┬──────────────┘
                                        │
                       ┌────────────────┴────────────────┐
                       │                                 │
                    WiFi                              USB Serial
                       │                                 │
                       ▼                                 ▼
              ┌─────────────────────────────────────────────┐
              │              Laptop Gateway                 │
              │                                             │
              │              FastAPI :8000                  │
              │                                             │
              │  WiFi reader ───────┐                       │
              │  USB reader ─────────┤                       │
              │                      ▼                       │
              │                 Latest telemetry             │
              │                 History buffer               │
              │                      │                       │
              │             Transport selection             │
              └──────────────────────┬──────────────────────┘
                                     │
                         HTTP REST API :8000
                                     │
             ┌───────────────────────┼───────────────────────┐
             │                       │                       │
             ▼                       ▼                       ▼
        Web Dashboard             AI/ML Agent             Mobile App
```

## 3. Core Design Principle

The preferred client architecture is:

``` text
Client → Laptop Gateway → ESP32
```

Clients should normally call:

``` text
http://<LAPTOP_IP>:8000
```

rather than directly calling the ESP32.

The laptop gateway hides the transport mechanism.

The ESP32 can communicate with the laptop through:

1.  WiFi
2.  USB Serial

For telemetry, the laptop gateway continuously attempts both paths.

For actuator commands, the laptop gateway prefers WiFi when WiFi
telemetry is fresh, and falls back to USB Serial when WiFi is
unavailable/stale.

------------------------------------------------------------------------

# 4. Network and Transport

## 4.1 ESP32 WiFi

The ESP32 joins the configured WiFi network.

Current working ESP32 IP observed during testing:

``` text
192.168.137.33
```

This can change depending on DHCP/network configuration.

ESP32 HTTP server:

``` text
http://192.168.137.33
```

ESP32 HTTP port:

``` text
80
```

## 4.2 Laptop Gateway

The laptop runs:

``` text
FastAPI + Uvicorn
```

on:

``` text
0.0.0.0:8000
```

Local machine access:

``` text
http://localhost:8000
```

Other devices on the same LAN can use:

``` text
http://<LAPTOP_LAN_IP>:8000
```

The gateway is intended to be the stable client-facing API.

## 4.3 USB Serial

ESP32 serial:

``` text
Baud: 115200
```

The laptop gateway automatically detects an ESP32/USB serial port when:

``` python
SERIAL_PORT = None
```

During testing the board appeared as:

``` text
COM9
```

The Arduino Serial Monitor must be closed while the Python gateway owns
COM9.

------------------------------------------------------------------------

# 5. Hardware Pin Map

## 5.1 ESP32 GPIO Configuration (v2.1 Updated)

  Device                        ESP32 pin   Notes
  --------------------------- ----------- ------------------------------------------
  DHT11 Data                       GPIO 4   10k pullup to 3.3V
  MQ-6 Analog Gas                 GPIO 34   ADC1_CH6 (analog input only)
  Relay Actuator                  GPIO 13   Active HIGH / Solenoid Valve Control
  Status / Debug LED               GPIO 2   Onboard ESP32 LED indicator
  GPS RX (NEO-6M TX)              GPIO 16   UART2 RX
  GPS TX (NEO-6M RX)              GPIO 17   UART2 TX (optional, 9600 baud)
  I2C SDA                         GPIO 21   Shared I2C Data bus
  I2C SCL                         GPIO 22   Shared I2C Clock bus
  *(SIM800L GSM)*                 *REMOVED* (Pins 26/27 freed)
  *(Soil Moisture ADC)*           *REMOVED* (Pin 35 freed; satellite soil model used)

## 5.2 I2C Addresses

  Device                           Address
  -------------------------------- ---------
  SSD1306 OLED (128x64)            `0x3C`
  BMP180 Barometer                 `0x77`
  DS3231 RTC                       `0x68`
  MPU9250 IMU                      `0x68` or `0x69`

The MPU9250 is configured for `0x69`.

The MPU9250 breakout being used exposes the address-select functionality
as:

``` text
SDD/SAO
```

For the `0x69` configuration, `SDD/SAO` is connected to the ESP32's
3.3V.

------------------------------------------------------------------------

# 6. ESP32 Firmware Responsibilities

The ESP32 firmware does all of the following:

1.  Initializes all sensors.
2.  Initializes OLED.
3.  Initializes relay GPIO.
4.  Initializes GPS UART.
5.  Initializes SIM800L UART.
6.  Connects to WiFi.
7.  Runs an HTTP server on port 80.
8.  Samples sensors every 1 second.
9.  Builds a JSON telemetry object.
10. Sends telemetry over USB Serial.
11. Stores a rolling history of 120 samples.
12. Provides REST endpoints.
13. Accepts actuator commands over HTTP.
14. Accepts actuator commands over USB Serial.

------------------------------------------------------------------------

# 7. Sensor Sampling Cycle

The main loop performs:

``` text
loop()
 │
 ├── handle HTTP client if WiFi is active
 │
 ├── process GPS UART data
 │
 ├── process USB Serial commands
 │
 └── every ~1 second:
       │
       ├── readSensors()
       │
       └── updateOLED()
```

The sensor interval is:

``` text
READ_INTERVAL = 1000 ms
```

Therefore telemetry is intended to be produced approximately once per
second.

------------------------------------------------------------------------

# 8. Complete Telemetry JSON

The main endpoint:

``` http
GET /sensors
```

returns an object shaped like:

``` json
{
  "type": "telemetry",
  "schema_version": "2.0",
  "device_id": "ESP_NODE_001",

  "time": {
    "rtc_valid": false,
    "uptime_s": 225
  },

  "timestamp": 225116,

  "dht11": {
    "temperature_c": 29.9,
    "temperature_valid": true,
    "humidity_percent": 68,
    "humidity_valid": true,
    "heat_index_c": 34.33203
  },

  "bmp180": {
    "valid": true,
    "temperature_c": 30.3,
    "pressure_hpa": 1005.02,
    "altitude_m": -61991.54,
    "reference_pressure_hpa": 1013.25
  },

  "mpu9250": {
    "valid": false
  },

  "mq6": {
    "raw_adc": 2557,
    "normalized": 0.624420024,
    "ppm_calibrated": false,
    "change_from_previous": -2,
    "absolute_change": 2
  },

  "soil_moisture": {
    "pin": 35,
    "raw_adc": 0,
    "normalized": 0,
    "calibrated_percent": 100,
    "calibrated": false,
    "status": "placeholder_sensor_not_calibrated"
  },

  "gps": {
    "location_valid": false,
    "fix": "None",
    "satellites": 0,
    "hdop": 99.99,
    "age_ms": 4294967295,
    "latitude": null,
    "longitude": null,
    "altitude_m": null,
    "speed_kmph": null,
    "course_deg": null,
    "course_cardinal": "",
    "distance_since_last_m": 0,
    "movement_detected": false
  },

  "system": {
    "uptime_s": 225,
    "free_heap": 53688,
    "wifi_connected": true,
    "ip": "192.168.137.33",
    "rssi": -40
  },

  "health": {
    "dht11": true,
    "bmp180": true,
    "mpu9250": false,
    "ds3231": false,
    "oled": true,
    "gps": false,
    "mq6": true,
    "soil_moisture": true,
    "relay": true,
    "gsm": true
  },

  "_gateway": {
    "transport": "wifi",
    "received_at": 0
  }
}
```

`_gateway` is added by the laptop gateway and is not generated by the
ESP32 itself.

------------------------------------------------------------------------

# 9. Sensor Semantics

## 9.1 DHT11

Fields:

``` text
temperature_c
temperature_valid
humidity_percent
humidity_valid
heat_index_c
```

Example:

``` json
{
  "temperature_c": 29.9,
  "temperature_valid": true,
  "humidity_percent": 68,
  "humidity_valid": true,
  "heat_index_c": 34.33203
}
```

Use `temperature_valid` and `humidity_valid` before treating the values
as valid measurements.

The firmware calculates heat index from temperature and humidity.

------------------------------------------------------------------------

# 10. BMP180

Fields:

``` text
valid
temperature_c
pressure_hpa
altitude_m
reference_pressure_hpa
```

Example:

``` json
{
  "valid": true,
  "temperature_c": 30.3,
  "pressure_hpa": 1005.02,
  "altitude_m": -61991.54,
  "reference_pressure_hpa": 1013.25
}
```

`pressure_hpa` is the useful pressure measurement.

The altitude is calculated using a reference pressure of:

``` text
1013.25 hPa
```

Absolute altitude should not be treated as calibrated physical
elevation.

------------------------------------------------------------------------

# 11. MPU9250

The firmware attempts initialization at:

``` text
0x69
```

If initialization fails:

``` json
{
  "valid": false
}
```

If working, the payload contains:

``` text
valid
accel_x
accel_y
accel_z
accel_magnitude
gyro_x
gyro_y
gyro_z
gyro_magnitude
pitch
roll
yaw
motion_detected
```

Example working shape:

``` json
{
  "valid": true,
  "accel_x": 0.01,
  "accel_y": 0.02,
  "accel_z": 0.99,
  "accel_magnitude": 0.99,
  "gyro_x": 0.1,
  "gyro_y": 0.2,
  "gyro_z": 0.1,
  "gyro_magnitude": 0.24,
  "pitch": 1.2,
  "roll": 0.7,
  "yaw": 12.5,
  "motion_detected": false
}
```

Important:

-   Acceleration and gyroscope values come from the MPU9250 library.
-   `accel_magnitude` is calculated from X/Y/Z.
-   `gyro_magnitude` is calculated from X/Y/Z.
-   `motion_detected` is calculated using:
    -   acceleration magnitude deviation from approximately `1.0`
    -   gyro magnitude greater than `5.0`

Do not treat `valid:false` as zero movement. It means the sensor is
unavailable.

------------------------------------------------------------------------

# 12. MQ-6

Fields:

``` text
raw_adc
normalized
ppm_calibrated
change_from_previous
absolute_change
```

Example:

``` json
{
  "raw_adc": 2557,
  "normalized": 0.624420024,
  "ppm_calibrated": false,
  "change_from_previous": -2,
  "absolute_change": 2
}
```

The MQ-6 is currently an analog/raw sensor.

Important:

``` text
ppm_calibrated = false
```

Therefore an agent must NOT interpret `raw_adc` or `normalized` as an
actual gas concentration in ppm.

`change_from_previous` and `absolute_change` are useful for detecting
changes/trends.

------------------------------------------------------------------------

# 13. Soil Moisture

The soil moisture input currently uses:

``` text
GPIO 35
```

It is explicitly a placeholder.

Payload:

``` json
{
  "pin": 35,
  "raw_adc": 0,
  "normalized": 0,
  "calibrated_percent": 100,
  "calibrated": false,
  "status": "placeholder_sensor_not_calibrated"
}
```

Important:

``` text
calibrated = false
```

The percentage must NOT be interpreted as real soil moisture until the
actual probe is installed and calibrated.

------------------------------------------------------------------------

# 14. GPS

Fields:

``` text
location_valid
fix
satellites
hdop
age_ms
latitude
longitude
altitude_m
speed_kmph
course_deg
course_cardinal
distance_since_last_m
movement_detected
```

When there is no GPS fix:

``` json
{
  "location_valid": false,
  "fix": "None",
  "latitude": null,
  "longitude": null
}
```

An agent should always check:

``` text
location_valid
```

before using location fields.

When valid, the firmware also calculates:

``` text
distance_since_last_m
movement_detected
```

Movement is considered detected when distance since the previous valid
point is at least approximately 1 meter.

------------------------------------------------------------------------

# 15. System Telemetry

Fields:

``` text
uptime_s
free_heap
wifi_connected
ip
rssi
```

Example:

``` json
{
  "uptime_s": 225,
  "free_heap": 53688,
  "wifi_connected": true,
  "ip": "192.168.137.33",
  "rssi": -40
}
```

These fields can be used for system monitoring.

------------------------------------------------------------------------

# 16. Health Object

The ESP32 exposes a health summary:

``` json
{
  "dht11": true,
  "bmp180": true,
  "mpu9250": false,
  "ds3231": false,
  "oled": true,
  "gps": false,
  "mq6": true,
  "soil_moisture": true,
  "relay": true,
  "gsm": true
}
```

For sensors such as DHT11 and the placeholder soil sensor, the health
flag currently represents module availability/configuration rather than
calibrated measurement quality.

For actual measurement validity, prefer the sensor-specific fields such
as:

``` text
dht11.temperature_valid
dht11.humidity_valid
bmp180.valid
mpu9250.valid
gps.location_valid
soil_moisture.calibrated
mq6.ppm_calibrated
```

------------------------------------------------------------------------

# 17. ESP32 REST API

The ESP32 exposes these endpoints.

``` text
GET  /
GET  /status
GET  /sensors
GET  /sensors/dht11
GET  /sensors/bmp180
GET  /sensors/mpu
GET  /sensors/gps
GET  /sensors/mq6
GET  /sensors/soil
GET  /sensors/history

POST /relay
POST /display
POST /gsm/send
```

------------------------------------------------------------------------

# 18. Laptop Gateway REST API

Clients should normally use these same paths through the laptop:

``` text
GET  http://<LAPTOP_IP>:8000/
GET  http://<LAPTOP_IP>:8000/status
GET  http://<LAPTOP_IP>:8000/sensors
GET  http://<LAPTOP_IP>:8000/sensors/dht11
GET  http://<LAPTOP_IP>:8000/sensors/bmp180
GET  http://<LAPTOP_IP>:8000/sensors/mpu
GET  http://<LAPTOP_IP>:8000/sensors/gps
GET  http://<LAPTOP_IP>:8000/sensors/mq6
GET  http://<LAPTOP_IP>:8000/sensors/soil
GET  http://<LAPTOP_IP>:8000/sensors/history

POST http://<LAPTOP_IP>:8000/relay
POST http://<LAPTOP_IP>:8000/display
POST http://<LAPTOP_IP>:8000/gsm/send
```

------------------------------------------------------------------------

# 19. Endpoint: GET /

Purpose:

Returns basic gateway information and the main API entry point.

Request:

``` http
GET /
```

Example response:

``` json
{
  "name": "Laptop Sensor Gateway",
  "version": "2.0",
  "transport": "wifi",
  "api": "/sensors"
}
```

Possible `transport` values:

``` text
wifi
usb
offline
```

------------------------------------------------------------------------

# 20. Endpoint: GET /status

Purpose:

Determine whether the gateway and ESP32 are available and which
transport is currently active.

Request:

``` http
GET /status
```

Example:

``` json
{
  "gateway": "laptop",
  "version": "2.0",
  "transport": "wifi",
  "esp32_url": "http://192.168.137.33",
  "wifi_last_seen_s": 0.4,
  "usb_last_seen_s": 0.2,
  "history_samples": 120,
  "serial_port": "auto"
}
```

Interpretation:

-   `transport = wifi`: recent WiFi telemetry is available.
-   `transport = usb`: WiFi is stale/unavailable but USB telemetry is
    available.
-   `transport = offline`: neither path has produced recent telemetry.

`wifi_last_seen_s` and `usb_last_seen_s` indicate how long ago telemetry
was last received.

------------------------------------------------------------------------

# 21. Endpoint: GET /sensors

This is the **primary telemetry endpoint**.

Request:

``` http
GET /sensors
```

The agent should normally use this endpoint when it needs the complete
current state.

It returns the full telemetry object.

Recommended use:

``` text
AI/ML model input
Dashboard
Monitoring
Decision logic
Logging
Automation
```

------------------------------------------------------------------------

# 22. Endpoint: GET /sensors/dht11

Request:

``` http
GET /sensors/dht11
```

Response:

``` json
{
  "type": "sensor",
  "sensor": "dht11",
  "timestamp": 225116,
  "data": {
    "temperature_c": 29.9,
    "temperature_valid": true,
    "humidity_percent": 68,
    "humidity_valid": true,
    "heat_index_c": 34.33203
  }
}
```

------------------------------------------------------------------------

# 23. Endpoint: GET /sensors/bmp180

Request:

``` http
GET /sensors/bmp180
```

Response:

``` json
{
  "type": "sensor",
  "sensor": "bmp180",
  "timestamp": 225116,
  "data": {
    "valid": true,
    "temperature_c": 30.3,
    "pressure_hpa": 1005.02,
    "altitude_m": -61991.54,
    "reference_pressure_hpa": 1013.25
  }
}
```

------------------------------------------------------------------------

# 24. Endpoint: GET /sensors/mpu

Request:

``` http
GET /sensors/mpu
```

Response when unavailable:

``` json
{
  "type": "sensor",
  "sensor": "mpu9250",
  "timestamp": 225116,
  "data": {
    "valid": false
  }
}
```

Response when available contains acceleration, gyro, orientation and
motion fields described earlier.

------------------------------------------------------------------------

# 25. Endpoint: GET /sensors/gps

Request:

``` http
GET /sensors/gps
```

Example no-fix response:

``` json
{
  "type": "sensor",
  "sensor": "gps",
  "timestamp": 225116,
  "data": {
    "location_valid": false,
    "fix": "None",
    "satellites": 0,
    "hdop": 99.99,
    "age_ms": 4294967295,
    "latitude": null,
    "longitude": null,
    "altitude_m": null,
    "speed_kmph": null,
    "course_deg": null,
    "course_cardinal": "",
    "distance_since_last_m": 0,
    "movement_detected": false
  }
}
```

------------------------------------------------------------------------

# 26. Endpoint: GET /sensors/mq6

Request:

``` http
GET /sensors/mq6
```

Example:

``` json
{
  "type": "sensor",
  "sensor": "mq6",
  "timestamp": 225116,
  "data": {
    "raw_adc": 2557,
    "normalized": 0.624420024,
    "ppm_calibrated": false,
    "change_from_previous": -2,
    "absolute_change": 2
  }
}
```

------------------------------------------------------------------------

# 27. Endpoint: GET /sensors/soil

Request:

``` http
GET /sensors/soil
```

Example:

``` json
{
  "type": "sensor",
  "sensor": "soil_moisture",
  "timestamp": 225116,
  "data": {
    "pin": 35,
    "raw_adc": 0,
    "normalized": 0,
    "calibrated_percent": 100,
    "calibrated": false,
    "status": "placeholder_sensor_not_calibrated"
  }
}
```

Do not use `calibrated_percent` as a trustworthy physical measurement
until calibration is implemented.

------------------------------------------------------------------------

# 28. Endpoint: GET /sensors/history

The ESP32 stores a rolling history of up to:

``` text
120 samples
```

The laptop gateway independently stores up to:

``` text
3600 samples
```

The laptop endpoint is:

``` http
GET /sensors/history
```

Optional query parameter:

``` text
limit
```

Example:

``` http
GET /sensors/history?limit=100
```

The laptop clamps the limit between:

``` text
1 and 3600
```

Example response:

``` json
{
  "type": "telemetry_history",
  "count": 100,
  "samples": [
    {
      "type": "telemetry",
      "schema_version": "2.0"
    }
  ]
}
```

The `samples` array contains complete telemetry objects.

------------------------------------------------------------------------

# 29. Endpoint: POST /relay

Purpose:

Control the physical relay.

Request:

``` http
POST /relay
Content-Type: application/json
```

ON:

``` json
{
  "state": "ON"
}
```

OFF:

``` json
{
  "state": "OFF"
}
```

Example PowerShell:

``` powershell
Invoke-RestMethod `
  -Uri "http://localhost:8000/relay" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"state":"ON"}'
```

Response:

``` json
{
  "type": "ack",
  "device": "relay",
  "state": "ON"
}
```

Valid states are exactly:

``` text
ON
OFF
```

The laptop gateway converts the state to uppercase before sending.

Invalid:

``` json
{
  "state": "hello"
}
```

results in HTTP 400.

ESP32 behavior:

``` text
ON  → relay GPIO 13 HIGH
OFF → relay GPIO 13 LOW
```

------------------------------------------------------------------------

# 30. Endpoint: POST /display

Purpose:

Display an arbitrary message on the OLED.

Request:

``` http
POST /display
Content-Type: application/json
```

Payload:

``` json
{
  "message": "HELLO FROM API"
}
```

PowerShell example:

``` powershell
Invoke-RestMethod `
  -Uri "http://localhost:8000/display" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"message":"HELLO FROM API"}'
```

Expected response:

``` json
{
  "type": "ack",
  "device": "display",
  "message": "HELLO FROM API",
  "status": "displayed"
}
```

The current firmware supports the API message mode for the WiFi HTTP
path.

The display message is stored in:

``` text
lastDisplay
```

and the current fixed firmware keeps an API-triggered message visible
for approximately:

``` text
5 seconds
```

before returning to the normal sensor display.

Messages are wrapped approximately every 21 characters to fit the 128x64
OLED at text size 1.

Recommended payload:

``` json
{
  "message": "GAS ALERT"
}
```

Another example:

``` json
{
  "message": "MOTION DETECTED"
}
```

Another:

``` json
{
  "message": "GPS FIX ACQUIRED"
}
```

Do not send an empty message.

------------------------------------------------------------------------

# 31. Endpoint: POST /gsm/send

Purpose:

Send an SMS using the SIM800L connected to the ESP32.

Request:

``` http
POST /gsm/send
Content-Type: application/json
```

Payload:

``` json
{
  "number": "+919876543210",
  "message": "Test SMS from ESP32 Gateway"
}
```

PowerShell:

``` powershell
Invoke-RestMethod `
  -Uri "http://localhost:8000/gsm/send" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"number":"+919876543210","message":"Test SMS from ESP32 Gateway"}'
```

Expected gateway response:

``` json
{
  "type": "ack",
  "device": "gsm",
  "number": "+919876543210",
  "status": "submitted"
}
```

The SIM800L sequence used by the firmware is approximately:

``` text
AT
AT+CMGF=1
AT+CMGS="<number>"
<message>
CTRL+Z
```

The firmware then waits approximately 4 seconds and reports:

``` text
submitted
```

Important:

``` text
submitted != guaranteed carrier delivery
```

It means the ESP32 submitted the SMS operation to the GSM module.

The GSM module requires appropriate SIM/network conditions.

------------------------------------------------------------------------

# 32. Error Handling

## 32.1 Missing JSON body

Example:

``` json
{
  "error": true,
  "message": "JSON body required"
}
```

HTTP:

``` text
400
```

## 32.2 Invalid JSON

Example:

``` json
{
  "error": true,
  "message": "Invalid JSON"
}
```

HTTP:

``` text
400
```

## 32.3 Empty display message

HTTP:

``` text
400
```

Message:

``` text
message cannot be empty
```

## 32.4 Invalid relay state

HTTP:

``` text
400
```

Message:

``` text
state must be ON or OFF
```

## 32.5 Missing GSM fields

HTTP:

``` text
400
```

Message:

``` text
number and message are required
```

## 32.6 ESP32 unavailable

If the laptop cannot reach the ESP32 through WiFi and has no USB serial
connection:

``` text
503
```

Typical message:

``` text
ESP32 unavailable over both WiFi and USB
```

------------------------------------------------------------------------

# 33. CORS

Both ESP32 and laptop gateway allow cross-origin requests.

The gateway uses:

``` text
Access-Control-Allow-Origin: *
```

and permits:

``` text
GET
POST
OPTIONS
```

This allows a browser dashboard hosted on another local origin to call
the gateway.

------------------------------------------------------------------------

# 34. Laptop Gateway Internal Architecture

The Python application uses:

``` text
FastAPI
Uvicorn
Requests
PySerial
Pydantic
```

Installation:

``` bash
pip install fastapi uvicorn requests pyserial
```

Run:

``` bash
python laptop_gateway.py
```

------------------------------------------------------------------------

# 35. Laptop Gateway Threads

Three background threads start when FastAPI starts.

## Thread 1: USB Reader

Function:

``` text
usb_reader()
```

Responsibilities:

1.  Detect serial port.
2.  Open serial port at 115200 baud.
3.  Read lines.
4.  Parse JSON.
5.  Accept telemetry lines.
6.  Update the latest telemetry.
7.  Update USB last-seen timestamp.

Only JSON with:

``` json
{
  "type": "telemetry"
}
```

is treated as telemetry.

------------------------------------------------------------------------

# 36. WiFi Reader

Function:

``` text
wifi_reader()
```

Every:

``` text
1 second
```

it calls:

``` http
GET <ESP32_BASE_URL>/sensors
```

Timeout:

``` text
1.5 seconds
```

If valid telemetry is returned:

``` text
last_wifi = current time
```

and the telemetry is stored.

------------------------------------------------------------------------

# 37. Transport Monitor

Function:

``` text
monitor()
```

Checks recent telemetry.

The stale threshold is:

``` text
3 seconds
```

Decision:

``` text
recent WiFi telemetry
        ↓
      wifi

otherwise recent USB telemetry
        ↓
      usb

otherwise
        ↓
     offline
```

------------------------------------------------------------------------

# 38. Gateway Telemetry Storage

The gateway stores:

``` text
latest
```

and:

``` text
history
```

The history is a Python deque:

``` text
maxlen = 3600
```

At approximately one sample per second this corresponds to roughly one
hour of samples under continuous sampling.

Each received telemetry object gets:

``` json
"_gateway": {
  "transport": "wifi",
  "received_at": 0
}
```

or:

``` json
"_gateway": {
  "transport": "usb",
  "received_at": 0
}
```

The actual `received_at` is a Unix timestamp generated by the laptop.

------------------------------------------------------------------------

# 39. Actuator Routing Logic

For:

``` text
POST /relay
POST /display
POST /gsm/send
```

the laptop uses:

``` text
command(path, payload, kind)
```

Decision:

``` text
Is WiFi telemetry fresh?
       │
      YES
       │
       ▼
Try ESP32 HTTP POST over WiFi
       │
       ├── success → return WiFi result
       │
       └── failure
              │
              ▼
       Try USB Serial
```

If WiFi is stale:

``` text
USB Serial
```

is used directly if available.

If neither path exists:

``` text
HTTP 503
```

is returned to the client.

------------------------------------------------------------------------

# 40. USB Command Protocol

The laptop sends newline-delimited JSON over COM.

## Relay

``` json
{
  "type": "relay",
  "state": "ON"
}
```

or:

``` json
{
  "type": "relay",
  "state": "OFF"
}
```

## OLED

``` json
{
  "type": "display",
  "message": "HELLO"
}
```

## GSM

``` json
{
  "type": "gsm_send",
  "number": "+919876543210",
  "message": "HELLO"
}
```

The ESP32 parses these in:

``` text
processCommand()
```

------------------------------------------------------------------------

# 41. Direct ESP32 vs Laptop Gateway

Both APIs exist.

## Direct ESP32

``` text
http://192.168.137.33/status
http://192.168.137.33/sensors
http://192.168.137.33/relay
http://192.168.137.33/display
http://192.168.137.33/gsm/send
```

This requires direct network access to the ESP32.

## Laptop Gateway

``` text
http://localhost:8000/status
http://localhost:8000/sensors
http://localhost:8000/relay
http://localhost:8000/display
http://localhost:8000/gsm/send
```

For another machine:

``` text
http://<LAPTOP_IP>:8000/...
```

The laptop gateway is the recommended abstraction layer.

------------------------------------------------------------------------

# 42. Recommended Agent Behavior

## When the agent needs all sensor data

Call:

``` http
GET /sensors
```

Do not call every individual endpoint unless only a specific sensor is
required.

------------------------------------------------------------------------

## When the agent needs only temperature/humidity

Call:

``` http
GET /sensors/dht11
```

------------------------------------------------------------------------

## When the agent needs pressure

Call:

``` http
GET /sensors/bmp180
```

------------------------------------------------------------------------

## When the agent needs movement/orientation

Call:

``` http
GET /sensors/mpu
```

Then verify:

``` text
data.valid == true
```

------------------------------------------------------------------------

## When the agent needs gas trend information

Call:

``` http
GET /sensors/mq6
```

Use:

``` text
raw_adc
normalized
change_from_previous
absolute_change
```

Do not claim a ppm concentration because:

``` text
ppm_calibrated == false
```

------------------------------------------------------------------------

## When the agent needs soil status

Call:

``` http
GET /sensors/soil
```

First check:

``` text
calibrated == true
```

If false, treat the value as placeholder/raw data only.

------------------------------------------------------------------------

## When the agent needs location

Call:

``` http
GET /sensors/gps
```

First check:

``` text
location_valid == true
```

If false:

``` text
Do not use latitude/longitude.
```

------------------------------------------------------------------------

## When the agent needs historical trends

Call:

``` http
GET /sensors/history?limit=300
```

Choose an appropriate limit.

Examples:

``` text
limit=10   → recent short window
limit=60   → roughly last minute at 1 Hz
limit=300  → roughly last five minutes at 1 Hz
limit=3600 → gateway's maximum history
```

Actual sample count may be lower if the gateway has not been running
long enough.

------------------------------------------------------------------------

# 43. Agent Decision Examples

## Example: Temperature Alert

1.  Call:

``` http
GET /sensors/dht11
```

2.  Check:

``` text
temperature_valid
```

3.  Read:

``` text
temperature_c
```

4.  If the application itself has an alert threshold, apply that
    threshold.

5.  To notify a person, call:

``` http
POST /gsm/send
```

Example:

``` json
{
  "number": "+919876543210",
  "message": "Temperature alert detected."
}
```

------------------------------------------------------------------------

# 44. Example: Motion Event

1.  Call:

``` http
GET /sensors/mpu
```

2.  Check:

``` text
valid == true
```

3.  Read:

``` text
motion_detected
```

4.  If the application decides that an action is required, it can:

``` text
POST /display
POST /relay
POST /gsm/send
```

------------------------------------------------------------------------

# 45. Example: Gas Event

1.  Call:

``` http
GET /sensors/mq6
```

2.  Inspect:

``` text
raw_adc
normalized
change_from_previous
absolute_change
```

3.  Remember:

``` text
ppm_calibrated = false
```

4.  Do not convert the reading into a physical ppm value without
    implementing/calibrating the MQ-6.

------------------------------------------------------------------------

# 46. Example: Trigger OLED

Request:

``` http
POST /display
```

Payload:

``` json
{
  "message": "GAS ALERT"
}
```

Expected behavior:

``` text
OLED:
----------------
GAS ALERT
----------------
```

The current fixed WiFi HTTP display path keeps the API-triggered message
visible for approximately five seconds.

------------------------------------------------------------------------

# 47. Example: Trigger Relay

Request:

``` http
POST /relay
```

Payload:

``` json
{
  "state": "ON"
}
```

The physical GPIO:

``` text
GPIO 13
```

is driven HIGH.

To turn it off:

``` json
{
  "state": "OFF"
}
```

------------------------------------------------------------------------

# 48. Example: Send SMS

Request:

``` http
POST /gsm/send
```

Payload:

``` json
{
  "number": "+919876543210",
  "message": "Alert from ESP32"
}
```

The ESP32 forwards the command to:

``` text
SIM800L
```

using:

``` text
HardwareSerial(2)
```

with:

``` text
RX = GPIO 26
TX = GPIO 27
baud = 9600
```

------------------------------------------------------------------------

# 49. Full End-to-End Sensor Data Flow

``` text
DHT11
  │
  ├── temperature
  └── humidity
        │
        ▼
ESP32 readSensors()
        │
        ▼
JSON telemetry object
        │
        ├──────────────► USB Serial
        │                    │
        │                    ▼
        │               Laptop USB reader
        │
        └──────────────► ESP32 HTTP /sensors
                             │
                             ▼
                       Laptop WiFi reader
                             │
                             ▼
                     latest + history
                             │
                             ▼
                       FastAPI /sensors
                             │
                             ▼
                    Dashboard / Agent / App
```

------------------------------------------------------------------------

# 50. Full End-to-End Actuator Data Flow

## WiFi path

``` text
AI Agent
   │
   │ POST /display
   ▼
Laptop :8000
   │
   │ POST /display
   ▼
ESP32 :80
   │
   ▼
OLED
```

## USB fallback path

``` text
AI Agent
   │
   │ POST /display
   ▼
Laptop :8000
   │
   │ JSON over COM9
   ▼
ESP32 Serial
   │
   ▼
OLED
```

The same conceptual flow applies to:

``` text
relay
gsm_send
```

------------------------------------------------------------------------

# 51. Boot Sequence

The ESP32 performs approximately:

``` text
Serial initialization
        ↓
I2C initialization
        ↓
I2C scan
        ↓
MQ-6 / soil / relay GPIO setup
        ↓
DHT11 setup
        ↓
BMP180 initialization
        ↓
MPU9250 initialization at 0x69
        ↓
DS3231 initialization at 0x68
        ↓
OLED initialization at 0x3C
        ↓
GPS UART initialization
        ↓
SIM800L UART initialization
        ↓
WiFi connection
        ↓
HTTP server
        ↓
first telemetry read
        ↓
boot complete
```

------------------------------------------------------------------------

# 52. I2C Diagnostics

The ESP32 performs an I2C scan during startup.

Expected devices for a fully connected setup:

``` text
0x3C → OLED
0x68 → DS3231
0x69 → MPU9250
0x77 → BMP180
```

If a device is missing from the scan, initialization may fail even if
the software endpoint exists.

------------------------------------------------------------------------

# 53. Current Known Hardware State During Testing

The tested telemetry showed:

``` text
DHT11      → working
BMP180     → working
WiFi       → working
MQ-6       → reading
OLED       → initialized
Relay      → available
GSM        → available
GPS        → no fix at that moment
DS3231     → not detected at that moment
MPU9250    → not detected at that moment
Soil       → placeholder/no calibrated sensor
```

The ESP32 WiFi address observed was:

``` text
192.168.137.33
```

The laptop gateway observed the ESP32 over:

``` text
USB COM9
```

------------------------------------------------------------------------

# 54. Important Data-Quality Rules for an AI Agent

The agent MUST distinguish:

## Valid measurement

Example:

``` json
"temperature_valid": true
```

means the DHT temperature measurement can be used.

## Sensor unavailable

Example:

``` json
"mpu9250": {
  "valid": false
}
```

means the MPU measurement should not be invented or treated as zero.

## GPS unavailable

``` text
location_valid = false
```

means coordinates are unavailable.

## Uncalibrated

``` text
ppm_calibrated = false
```

means MQ-6 cannot provide calibrated ppm.

``` text
calibrated = false
```

means soil percentage is not trustworthy as a physical moisture
percentage.

------------------------------------------------------------------------

# 55. Agent API Cheat Sheet

## Read everything

``` http
GET /sensors
```

## Gateway status

``` http
GET /status
```

## Temperature/humidity

``` http
GET /sensors/dht11
```

## Pressure

``` http
GET /sensors/bmp180
```

## Motion/orientation

``` http
GET /sensors/mpu
```

## GPS

``` http
GET /sensors/gps
```

## Gas

``` http
GET /sensors/mq6
```

## Soil

``` http
GET /sensors/soil
```

## History

``` http
GET /sensors/history?limit=300
```

## Relay ON

``` http
POST /relay

{
  "state": "ON"
}
```

## Relay OFF

``` http
POST /relay

{
  "state": "OFF"
}
```

## OLED message

``` http
POST /display

{
  "message": "HELLO"
}
```

## SMS

``` http
POST /gsm/send

{
  "number": "+919876543210",
  "message": "HELLO"
}
```

------------------------------------------------------------------------

# 56. Recommended Base URL Strategy

The AI agent should receive one configurable variable:

``` text
GATEWAY_BASE_URL
```

Example:

``` text
http://localhost:8000
```

when the agent runs on the laptop.

Or:

``` text
http://192.168.137.10:8000
```

when another device accesses the laptop over LAN.

Then construct endpoints:

``` text
${GATEWAY_BASE_URL}/sensors
${GATEWAY_BASE_URL}/status
${GATEWAY_BASE_URL}/relay
${GATEWAY_BASE_URL}/display
${GATEWAY_BASE_URL}/gsm/send
```

Do not hardcode the ESP32 IP into the client agent.

The ESP32 IP belongs inside the laptop gateway configuration.

------------------------------------------------------------------------

# 57. Recommended Agent Workflow

For a normal AI/automation agent:

``` text
1. GET /status
2. Check transport
3. GET /sensors
4. Inspect sensor-specific validity fields
5. Make application-level decision
6. If action required:
      POST /relay
      and/or
      POST /display
      and/or
      POST /gsm/send
7. Check returned response
8. If necessary, GET /status or GET /sensors again
```

The agent should not assume an actuator command failed merely because
the transport changed.

------------------------------------------------------------------------

# 58. Important Transport Detail

The gateway's actuator response can indicate:

``` text
transport = wifi
```

or:

``` text
transport = usb
```

For example:

``` json
{
  "type": "ack",
  "device": "display",
  "message": "HELLO",
  "status": "displayed",
  "_transport": "wifi"
}
```

USB fallback can return:

``` json
{
  "status": "submitted",
  "transport": "usb"
}
```

Therefore the agent should understand that:

``` text
submitted
```

means the gateway submitted the command through the available transport.

For GSM specifically, `submitted` means the ESP32 submitted the
operation to the GSM module; it is not a carrier-delivery confirmation.

------------------------------------------------------------------------

# 59. Security / Deployment Note

The current development gateway is configured with permissive CORS:

``` text
Access-Control-Allow-Origin: *
```

and listens on:

``` text
0.0.0.0:8000
```

This is convenient for a local hackathon LAN.

It should not automatically be considered secure for an untrusted/public
network.

For a production deployment, add authentication/authorization and
restrict network exposure.

------------------------------------------------------------------------

# 60. Source Components

## ESP32

Firmware:

``` text
ESP32_Gateway_v2_display_fixed_v4.ino
```

Main libraries used:

``` text
Wire
Adafruit_Sensor
Adafruit_BMP085
MPU9250
RTClib
Adafruit_GFX
Adafruit_SSD1306
TinyGPS++
DHT
ArduinoJson
WiFi
WebServer
```

## Laptop

Gateway:

``` text
laptop_gateway.py
```

Python packages:

``` text
fastapi
uvicorn
requests
pyserial
pydantic
```

------------------------------------------------------------------------

# 61. Final Mental Model for the AI Agent

The entire system can be reduced to this:

``` text
                 SENSOR SIDE
                     │
                     ▼
             ┌───────────────┐
             │     ESP32     │
             │               │
             │ Read sensors  │
             │ Build JSON    │
             │ Store history │
             └───────┬───────┘
                     │
             WiFi OR USB Serial
                     │
                     ▼
             ┌───────────────┐
             │ Laptop Gateway│
             │   FastAPI     │
             │     :8000     │
             └───────┬───────┘
                     │
                 REST API
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       Dashboard    Agent     Mobile
          │
          │ POST commands
          ▼
     ┌───────────────┐
     │ Laptop Gateway│
     └───────┬───────┘
             │
       WiFi preferred
       USB fallback
             │
             ▼
        ┌─────────┐
        │  ESP32  │
        └────┬────┘
             │
      ┌──────┼──────┐
      ▼      ▼      ▼
    Relay   OLED   GSM
```

## The one rule the agent should remember

**The laptop gateway is the client-facing control plane.**

Read sensors with:

``` text
GET /sensors
```

Read individual sensors when needed.

Control hardware with:

``` text
POST /relay
POST /display
POST /gsm/send
```

The gateway decides whether the ESP32 is reached through WiFi or USB.

The agent should therefore remain transport-agnostic.
