# AgriStack — Overall Data Flow Architecture

This document maps out the end-to-end data pipelines, communication protocols, request/response payloads, and sequence interactions across the **AgriStack Precision Agriculture & Climate Intelligence Platform**.

---

## 1. High-Level Data Flow Lifecycle

The platform operates across a continuous **5-Stage Data Lifecycle**:

```text
[ 1. SENSE ]  -->  [ 2. INGEST ]  -->  [ 3. ENRICH ]  -->  [ 4. INFER ]  -->  [ 5. ACT & DISPLAY ]
  ESP32 Edge         FastAPI REST        Copernicus Sat      YOLO11 Vision       React Dashboard
  DHT / BMP / MQ     Pydantic Schemas    SoilGrids 250m      CWSI Model          Bilingual Audio RAG
  GPS Coordinates    SQLite Storage      Open-Meteo          RAG Advisory        Relay Actuator Valve
```

---

## 2. Core Data Flow Pipelines & Sequence Diagrams

---

### Pipeline 1: Edge Telemetry Ingestion & Real-Time Sync Flow

Captures microclimate sensor data from the field, updates the local OLED display, and streams the metrics to the cloud server and frontend dashboard.

```mermaid
sequenceDiagram
    autonumber
    participant Sensors as Hardware Sensors<br/>(DHT, BMP, MQ6, GPS)
    participant ESP32 as ESP32 Edge Gateway
    participant OLED as SSD1306 OLED (0x3C)
    participant Backend as FastAPI Server (/api/telemetry)
    participant DB as SQLite / PostgreSQL
    participant UI as React Dashboard

    loop Every 5-15 Seconds
        Sensors->>ESP32: Sample analog & digital lines (GPIO 4, 21, 22, 34, 16)
        ESP32->>OLED: Render live metrics (Temp, Humidity, Pressure, WiFi IP)
        ESP32->>Backend: HTTP POST /api/telemetry (JSON payload)
        activate Backend
        Backend->>Backend: Validate payload via Pydantic v2
        Backend->>DB: Insert TelemetryRecord (WAL commit)
        Backend-->>ESP32: 201 Created { status: "success", id: 1042 }
        deactivate Backend
    end

    loop Every 5 Seconds (or SSE Stream)
        UI->>Backend: GET /api/telemetry/latest
        Backend->>DB: Query latest record
        DB-->>Backend: Return latest record
        Backend-->>UI: 200 OK (Telemetry JSON)
        UI->>UI: Animate radial gauges & time-series line charts
    end
```

#### Pipeline 1 Data Payload Specification:
```json
// POST /api/telemetry
{
  "device_id": "esp32_gateway_01",
  "timestamp": 1729452800,
  "temperature": 29.4,
  "humidity": 68.2,
  "pressure": 1012.35,
  "gas_level": 412,
  "latitude": 17.385044,
  "longitude": 78.486671,
  "altitude": 542.1,
  "satellites": 8,
  "relay_state": false
}
```

---

### Pipeline 2: Earth Observation & Satellite Crop Health Flow

Leverages the European Space Agency's (ESA) Copernicus Sentinel-2 multispectral constellation to assess canopy health and crop water stress across the farm boundaries.

```mermaid
sequenceDiagram
    autonumber
    participant UI as React Map Component
    participant Backend as FastAPI Server (/api/satellite)
    participant Sentinel as Copernicus Sentinel-2 API
    participant Cache as In-Memory / DB Cache

    UI->>Backend: GET /api/satellite/ndvi?lat=17.385&lon=78.486&radius=500
    activate Backend
    Backend->>Cache: Check for cached raster / indices within 48h
    alt Cache Hit
        Cache-->>Backend: Return cached NDVI/NDWI matrix
    else Cache Miss
        Backend->>Sentinel: Request Bands (B04 Red, B08 NIR, B03 Green, B11 SWIR)
        Sentinel-->>Backend: Return GeoTIFF / Surface Reflectance values
        Backend->>Backend: Calculate NDVI = (B08 - B04) / (B08 + B04)
        Backend->>Backend: Calculate NDWI = (B03 - B08) / (B03 + B08)
        Backend->>Cache: Store calculated indices
    end
    Backend-->>UI: 200 OK { ndvi: 0.68, ndwi: -0.12, status: "Vigorous Canopy", map_overlay_url: "..." }
    deactivate Backend
    UI->>UI: Render Leaflet heatmap overlay with color ramp (Red to Deep Green)
```

#### Pipeline 2 Data Payload Specification:
```json
// GET /api/satellite/ndvi Response
{
  "coordinates": { "latitude": 17.385044, "longitude": 78.486671 },
  "acquisition_date": "2026-10-18T05:22:10Z",
  "cloud_coverage_percentage": 2.4,
  "indices": {
    "ndvi": {
      "mean": 0.682,
      "min": 0.410,
      "max": 0.815,
      "classification": "Healthy Vegetative Biomass"
    },
    "ndwi": {
      "mean": -0.118,
      "classification": "Adequate Internal Leaf Moisture"
    }
  }
}
```

---

### Pipeline 3: Hyperlocal SoilGrids 250m Profile Ingestion Flow

Acquires deep soil physical and chemical parameters based on field coordinates without requiring physical soil lab tests.

```mermaid
sequenceDiagram
    autonumber
    participant UI as React Soil Matrix Tab
    participant Backend as FastAPI Server (/api/soil)
    participant SoilGrids as ISRIC SoilGrids REST API

    UI->>Backend: GET /api/soil?lat=17.385044&lon=78.486671
    activate Backend
    Backend->>SoilGrids: Query /soilgrids/v2.0/properties/query (clay, sand, silt, phh2o, soc, cec)
    SoilGrids-->>Backend: Return raw probability depth distributions (0-5cm, 5-15cm, 15-30cm)
    Backend->>Backend: Parse USDA Soil Texture Triangle (e.g., "Clay Loam")
    Backend->>Backend: Calculate Available Water Capacity (AWC in mm/m)
    Backend-->>UI: 200 OK { texture: "Clay Loam", ph: 7.2, organic_carbon: 14.8 g/kg, awc: 145 }
    deactivate Backend
    UI->>UI: Populate Soil Health Scorecard & Depth Breakdown Charts
```

#### Pipeline 3 Data Payload Specification:
```json
// GET /api/soil Response
{
  "texture_class": "Clay Loam",
  "ph": 7.2,
  "organic_carbon_g_kg": 14.8,
  "cation_exchange_capacity": 22.4,
  "depth_profiles": [
    { "depth": "0-5cm", "clay_percent": 34, "sand_percent": 38, "silt_percent": 28 },
    { "depth": "5-15cm", "clay_percent": 37, "sand_percent": 35, "silt_percent": 28 },
    { "depth": "15-30cm", "clay_percent": 41, "sand_percent": 32, "silt_percent": 27 }
  ],
  "water_holding_capacity": "High (145 mm/m)"
}
```

---

### Pipeline 4: Climate Forecast & Dynamic Irrigation Decision Flow

Merges physical edge readings (VPD) with meteorological forecasts (Open-Meteo) and soil water capacity to compute the **Crop Water Stress Index (CWSI)** and trigger automated irrigation.

```mermaid
sequenceDiagram
    autonumber
    participant Timer as Background Cron / Worker
    participant Backend as FastAPI Analytics Engine
    participant Meteo as Open-Meteo High-Resolution API
    participant DB as System Database
    participant ESP32 as ESP32 Relay Driver (GPIO 13)
    participant UI as Farmer Dashboard

    Timer->>Backend: Execute hourly irrigation optimization check
    activate Backend
    Backend->>DB: Fetch latest telemetry (Temp, Humidity, Pressure)
    Backend->>Meteo: GET /v1/forecast (solar_radiation, precipitation_probability, et0)
    Meteo-->>Backend: Return 48-hour hourly microclimate forecast
    Backend->>Backend: Calculate Vapor Pressure Deficit (VPD)
    Backend->>Backend: Calculate Penman-Monteith Evapotranspiration ($ET_0$)
    Backend->>Backend: Compute Crop Water Stress Index (CWSI: 0.0 - 1.0)

    alt CWSI > 0.65 AND Rain_Prob_Next_12h < 30%
        Backend->>Backend: Generate Recommendation: "Irrigate 4.5 mm (45 mins drip)"
        Backend->>ESP32: POST /api/actuator/irrigate { duration_seconds: 2700 }
        ESP32->>ESP32: Pull GPIO 13 HIGH -> Solenoid Opens
        Backend->>DB: Record IrrigationEvent(state="ACTIVE", volume_liters=1800)
        Backend->>UI: Push Critical Alert: "Automated Drip Irrigation Initiated"
    else Rain Expected OR Low CWSI (<0.40)
        Backend->>Backend: Recommendation: "Hold Irrigation (Moisture Sufficient / Rain Anticipated)"
    end
    deactivate Backend
```

---

### Pipeline 5: Computer Vision Disease Diagnosis Flow

Enables farmers to upload crop leaf photographs for instant pest identification and localized treatment instructions.

```mermaid
sequenceDiagram
    autonumber
    participant Farmer as Farmer / User
    participant UI as React Vision Studio
    participant Backend as FastAPI Server (/api/vision/detect)
    participant YOLO as YOLO11 Inference Engine (yolo11n.pt)
    participant Knowledge as Crop Pathology Database

    Farmer->>UI: Takes or uploads photo of diseased crop leaf
    UI->>Backend: POST /api/vision/detect (multipart/form-data: image file)
    activate Backend
    Backend->>Backend: Preprocess image (Resize to 640x640, Normalization)
    Backend->>YOLO: Forward pass through YOLO11 model
    YOLO-->>Backend: Detection BBoxes [x1, y1, x2, y2], Class ID, Confidence (0.92)
    Backend->>Knowledge: Query disease metadata for detected class (e.g. "Early Blight")
    Knowledge-->>Backend: Fungicide recommendations, dosage, and cultural practices
    Backend-->>UI: 200 OK (JSON with detections, bounding boxes & remedies)
    deactivate Backend
    UI->>UI: Draw SVG bounding boxes on leaf image + Display Treatment Card
```

#### Pipeline 5 Data Payload Specification:
```json
// POST /api/vision/detect Response
{
  "diagnosis": "Early Blight (Alternaria solani)",
  "confidence": 0.941,
  "severity": "Moderate (Leaves 25% necrotic)",
  "detections": [
    {
      "box_2d": [142, 85, 310, 248],
      "label": "target_spot_lesion",
      "confidence": 0.94
    }
  ],
  "treatment": {
    "chemical_control": "Apply Mancozeb 75% WP @ 2.5g/L water or Chlorothalonil.",
    "organic_remedy": "Spray 5% Neem seed kernel extract (NSKE) or Trichoderma viride.",
    "cultural_practices": "Prune lower infected leaves; ensure drip irrigation avoids leaf wetting."
  }
}
```

---

### Pipeline 6: Bilingual Conversational RAG Advisory Flow

Empowers farmers to converse with an agricultural expert in **Telugu (తెలుగు)** or **English**, contextualized with real-time ground telemetry.

```mermaid
sequenceDiagram
    autonumber
    participant Farmer as Farmer (Telugu / English)
    participant UI as Chat & Audio Widget
    participant Backend as FastAPI Server (/api/advisor/chat)
    participant Context as Context Aggregator
    participant LLM as Groq / Gemini Agricultural RAG
    participant TTS as Web Speech / Audio Synthesizer

    Farmer->>UI: Inputs query: "మా మిరప తోటలో ఆకులు ముడుచుకుపోతున్నాయి, ఏం చేయాలి?"
    UI->>Backend: POST /api/advisor/chat { query: "...", language: "te" }
    activate Backend
    Backend->>Context: Collect real-time telemetry snapshot (Temp, Humidity, Soil, Weather)
    Context-->>Backend: Structured contextual metadata prompt
    Backend->>LLM: Ingest System Prompt + Field Context + Farmer Query
    LLM-->>Backend: Generated Expert Agricultural Advice (in Telugu)
    Backend-->>UI: 200 OK { response: "...", audio_url: "..." }
    deactivate Backend
    UI->>UI: Render bilingual text bubbles
    UI->>TTS: Play audio advisory natively in Telugu
```

---

## 3. Latency, Refresh Rate & Polling Matrix

| Pipeline / Operation | Trigger Mechanism | Frequency / Cadence | End-to-End Latency Target |
| :--- | :--- | :--- | :--- |
| **ESP32 Sensor Ingest** | Hardware Timer | Every 10–30 Seconds | `< 150 ms` (Local WiFi) |
| **OLED Local Refresh** | Internal Loop | Every 1.0 Second | Instantaneous (`< 10 ms`) |
| **Dashboard Telemetry Sync**| HTTP Polling / SSE | Every 5.0 Seconds | `< 200 ms` |
| **YOLO11 Disease Diagnostic**| On-Demand User Upload | On User Request | `35 – 80 ms` (Inference) |
| **Open-Meteo Weather Sync** | Automated Polling | Every 1 Hour (Cached) | `< 400 ms` |
| **Copernicus Satellite Sync** | Background Scheduled | Every 2–5 Days (Orbit) | `1.5 – 3.0 s` (Initial fetch) |
| **SoilGrids Ingestion** | Location Onboarding | Once per Field (Static) | `< 800 ms` |
| **Bilingual RAG Advisory** | Farmer Message | On-Demand | `600 – 1500 ms` (Streamed) |
| **Actuator Relay Trigger** | Automated / Manual | Event-Driven | `< 300 ms` |
