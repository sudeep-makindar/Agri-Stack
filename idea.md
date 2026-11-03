# 🌿 AgriStack: Next-Gen Autonomous Precision Agriculture & Climate Resilience Infrastructure

> **Tagline:** Bridging IoT Hardware, Satellite Remote Sensing, Edge Computer Vision, and Bilingual Generative AI to empower smallholder farmers with actionable, real-time climate intelligence.

---

## 📌 1. The Problem Statement

Smallholder farmers manage over 80% of the world's farms, yet they face compounding challenges that threaten global food security:

1. **Climate Vulnerability & Water Scarcity:** Unpredictable rainfall patterns and heat stress cause frequent crop failures. Over-irrigation wastes up to 40% of freshwater in agriculture.
2. **Pest & Disease Outbreaks:** Unchecked crop diseases (e.g., Anthracnose, Chlorosis) and weed infestations rapidly decimate crop yields before diagnosis occurs.
3. **Fragmented & Siloed Agronomic Data:** Weather forecasts, soil tests, satellite imagery, and on-farm sensors exist in isolation, requiring technical literacy that most farmers lack.
4. **Language & Accessibility Barriers:** Existing precision farming apps cater primarily to English speakers, ignoring millions of rural farmers who require guidance in their local vernacular (e.g., Tamil).
5. **Lack of Hardware-to-Advisory Integration:** Sensor hardware often operates in a vacuum without direct, automated feedback loops to water pumps, OLED field displays, or instant SMS text alerts.

---

## 💡 2. The Solution: AgriStack Ecosystem

**AgriStack** is a unified, multi-modal precision agriculture and climate intelligence platform. It fuses physical IoT sensor hardware, edge computer vision, satellite remote sensing, and Generative AI into a cohesive, actionable dashboard and automated field controller.

```
                   ┌────────────────────────────────────────────────────────┐
                   │             PHYSICAL FIELD & ENVIRONMENT               │
                   └──────┬──────────────────┬───────────────────┬──────────┘
                          │                  │                   │
                  IoT Sensors          Leaf Snapshot        Copernicus
               (DHT11/BMP/Soil)       (Camera Stream)       Sentinel-2
                          │                  │                   │
                          ▼                  ▼                   ▼
                   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
                   │ ESP32 Node & │   │ YOLO11 Edge  │   │  Satellite   │
                   │ Hardware API │   │ Vision Guard │   │ Engine (NDVI)│
                   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
                          │                  │                   │
                          └──────────┬───────┴───────────────────┘
                                     ▼
                   ┌────────────────────────────────────────────────┐
                   │            AgriStack Intelligence Core         │
                   │           (FastAPI + SQLite + RAG Engine)       │
                   └─────────────────────────┬──────────────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
         ┌──────────────────────────┐                ┌──────────────────────────┐
         │ OpenRouter LLM Advisory  │                │ Hardware Actuation & SMS │
         │   (Bilingual EN / TA)    │                │ (Relays, OLED, SIM800L)  │
         └──────────────────────────┘                └──────────────────────────┘
```

---

## 🔥 3. Key Innovation & Standout Features

### 📡 A. Plug-and-Play IoT Gateway (ESP32 Hardware Bridge)
- **Sensor Suite:** Microsecond polling for Air Temp/Humidity (DHT11), Barometric Pressure/Altitude (BMP180), Air Quality/LPG (MQ6), Calibrated Soil Moisture, and Gyroscope/Tilt (MPU9250).
- **Physical Actuation:** Remote relay triggering for drip irrigation pumps, live message streaming to field OLED screens, and SIM800L GSM SMS alert dispatch for offline farmers.
- **Fail-Safe Caching:** Automatic fallback telemetry caching ensures dashboard availability even during transient connectivity loss.

### 👁️ B. Edge AI Vision & Leaf Pathology Engine
- **Dual Neural Architecture:** Combines **Ultralytics YOLO11** real-time object detection with **PyTorch MobileNetV3** feature backbones.
- **AI Safety & Rejection Guard:** Built-in computer vision heuristics detect human faces, selfies, or non-agricultural framing and politely reject non-crop subjects.
- **Instant Pathology & Bio-Treatment:** Automatically diagnoses Anthracnose, Nitrogen Chlorosis, and invasive Bermuda Grass (*Arugampul*), generating organic soil drench and precise N:P:K nutrient dosing guidelines.

### 🛰️ C. Copernicus Earth Observation & Climate Engine
- **Satellite Indices:** Integration with Copernicus Sentinel-2 satellite data to compute **NDVI** (Normalized Difference Vegetation Index) and **NDRE** (Normalized Difference Red Edge) crop health scores.
- **Hyper-Local Weather & Soil Integration:** Pulls live evapotranspiration ($ET_0$) from Open-Meteo, solar radiation from NASA POWER, and 3D soil composition profiles from SoilGrids.

### 💬 D. Bilingual RAG-Powered AI Agronomist
- **Generative Advisory:** Fuses live telemetry, satellite scores, and RAG knowledge bases to answer farmer queries.
- **Native Vernacular Support:** Answers are generated simultaneously in **English** and **Tamil (தமிழ் விவசாய ஆலோசனை)**, eliminating literacy and language barriers.

---

## 🛠️ 4. Technical Architecture & Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend UI** | React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion | Modern, glassmorphic interactive dashboard & mobile-responsive PWA layout. |
| **Backend API** | Python 3.10+, FastAPI, Async HTTPX, Pydantic v2 | High-throughput asynchronous REST API and service router. |
| **Database** | SQLite, SQLAlchemy ORM | Local-first data persistent store for farm profiles, sensor logs, and inference records. |
| **Machine Learning** | Ultralytics YOLO11 (`yolo11n.pt`), PyTorch, Pillow | Deep learning inference pipeline for crop disease, pest detection, and bounding box extraction. |
| **Generative AI** | OpenRouter API (DeepSeek V4, Nemotron 3.5, GLM 5.2), Custom RAG | Context-aware bilingual agronomy agent. |
| **IoT Hardware** | ESP32 Microcontroller, SIM800L GSM, OLED SSD1306, Drip Relays | Real-world telemetry collection, relay actuation, and hardware telemetry gateway. |

---

## 🌍 5. Impact & Sustainability Goals (UN SDGs)

- 🌾 **SDG 2: Zero Hunger** — Minimizes crop losses due to undetected diseases and optimizes NPK fertilizer utilization.
- 💧 **SDG 6: Clean Water & Sanitation** — Reduces water waste by up to 35% through $ET_0$-based drip irrigation scheduling.
- 📉 **SDG 13: Climate Action** — Equips farmers with micro-climate resilience data to adapt to volatile weather events.

---

## 🚀 6. Future Roadmap

1. **Edge TPU & MicroPython Deployment:** Quantize YOLO11 models to ONNX/TFLite for direct on-device inference on ESP32-CAM or Raspberry Pi edge modules.
2. **Multi-Crop Yield Prediction Models:** Expand IBM/NASA Prithvi EO foundation model integration for multi-season yield forecasting.
3. **Micro-Insurance & Credit Scoring:** Expose automated risk and health metrics APIs for agri-fintech and crop insurance underwriting.
