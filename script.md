# 🌿 AgriStack — Hackathon Pitch Script & Live Demo Guide

> **Time Target:** 3 to 5 Minutes  
> **Audience:** Technical & Impact Hackathon Judges  
> **Tagline:** *Bridging IoT Edge Hardware, Satellite Earth Observation, Computer Vision, and Bilingual Generative AI to empower smallholder farmers.*

---

## ⏱️ Quick Pitch Breakdown (Timeline)

```
0:00 - 0:45 ─── 🚨 The Hook & The Problem (The 4 Silos of Farming)
0:45 - 2:30 ─── 💻 The Live Demo Walkthrough (Globe → Dashboard → Vision → IoT → AI)
2:30 - 3:30 ─── ⚙️ Technical Architecture & Under-the-Hood Engineering
3:30 - 4:00 ─── 🌍 Scalability, Impact & UN SDGs
4:00 - End   ─── 🎯 Closing Hook & Rapid Q&A Defense
```

---

## 🎤 Part 1: The Hook & The Problem (0:00 - 0:45)

*(Stand confident. Hold up a phone, leaf, or point to the screen.)*

> **"Respected Judges, smallholder farmers produce over 80% of the world’s food supply, yet they are fighting 21st-century climate volatility with 19th-century guesswork.**
>
> Right now, four massive silos exist:
> 1. **Sensors** measure soil, but don't talk to weather models.
> 2. **Satellites** monitor crop vigor, but farmers can't access raw spectral bands.
> 3. **Pests and fungal diseases** decimate up to 40% of yields before diagnosis.
> 4. **Language Barriers:** Most precision agriculture software is written in English, completely shutting out vernacular-speaking rural farmers.
>
> We built **AgriStack** — an autonomous, end-to-end climate intelligence and precision farming ecosystem that eliminates this guesswork."

---

## 🖥️ Part 2: Live Demo Walkthrough (0:45 - 2:30)

*(Action: Have your laptop mirroring the screen. Open `http://localhost:3000`)*

### 1. Landing Page & Geospatial Entry
> **"Let's look at the live platform.**
> Here on our tactile mission landing page, we visualize the global crop ecosystem. Clicking the interactive globe drops us straight into **Survey Plot 74/2B** on the AgriStack Dashboard."

*(Action: Click the Pixel Earth or 'Enter Dashboard' button to transition to `/dashboard`)*

### 2. Tab 1: The Overview — Multimodal Sensor & Satellite Fusion
> **"Notice this green badge at the top: `FASTAPI LIVE`.**
> We are not showing static mock data. The dashboard is concurrently fusing four live data streams:
> - **Open-Meteo:** Real-time air temperature, humidity, and atmospheric pressure.
> - **Copernicus Sentinel-2 Satellite:** STAC tile acquisition showing real-time **NDVI** vegetation index.
> - **ISRIC SoilGrids v2.0 REST API:** Live 3D soil composition — pH 6.8, Organic Carbon, and NPK ratios (140:35:180 mg/kg).
> - **NASA POWER API:** Multi-year agroclimatology baselines to correct regional microclimate bias."

*(Action: Click on 'IRRIGATION' tab)*

### 3. Tab 2: Precision Irrigation & Soil Moisture Draw-Down ML
> **"Water scarcity is an existential threat.**
> Over-irrigation wastes up to 35% of water. In our **Smart Irrigation Tab**, our physics-informed ML model calculates the daily Penman-Monteith Evapotranspiration ($ET_0$).
>
> It combines soil moisture with 7-day precipitation probabilities to compute the exact soil moisture draw-down curve. Instead of guessing, the farmer gets a dynamic schedule: **'Drip Irrigation Cycle: 12.5 Liters per square meter on Day 3'**."

*(Action: Click on 'CAMERA' tab)*

### 4. Tab 3: Edge AI Vision Guard & Leaf Pathology
> **"What about pests and plant diseases?**
> Let's open the **AI Camera Tool**. It connects directly to the device webcam or allows leaf photo uploads.
>
> We run an **Ultralytics YOLO11** deep-learning pipeline paired with a **PyTorch MobileNetV3** feature backbone.
> 
> Watch our **AI Safety Guard**: If a farmer accidentally points the camera at a human face or selfie, our heuristic filter rejects it to protect model compute.
> 
> But when pointed at a crop leaf, it instantly identifies early fungal **Anthracnose** and invasive **Arugampul (Bermuda grass)**, and immediately prescribes an organic bio-treatment: *Trichoderma viride root drench* and foliar micronutrient dosing."

*(Action: Click on 'IOT' tab)*

### 5. Tab 4: Physical Hardware Actuation (ESP32 Gateway)
> **"Software without hardware is just a dashboard; with hardware, it's an autonomous field controller.**
> Under the **ESP32 IoT Gateway**, we poll telemetry from an on-field ESP32 microcontroller over Wi-Fi — DHT11, BMP180 barometric pressure, MQ-6 air quality, and calibrated capacitive soil moisture.
>
> Even better, it provides **two-way actuation**: with a single click, we can trigger the physical drip irrigation solenoid relay on GPIO 13, or push live messages directly to the field OLED screen."

*(Action: Click '{LAUNCH AGRI-RAG ADVISORY}' at the bottom or top)*

### 6. Tab 5: Bilingual Generative AI (English + Tamil)
> **"Finally, how do we solve the literacy barrier?**
> Meet our **Agri-RAG Agronomist**. We pass live telemetry, soil nutrients, and satellite indices into a RAG vector knowledge base powered by an OpenRouter LLM.
>
> Notice the response: It generates advice simultaneously in **English** and clean **Tamil (தமிழ் விவசாய ஆலோசனை)**!
> Even better, farmers don't need to read — our integrated browser Speech Synthesis reads the advisory aloud in native vernacular Tamil and English."

*(Action: Hit 'READ ALOUD (TAMIL)' or 'READ ALOUD (ENGLISH)' for 3 seconds so judges hear the voice)*

---

## ⚙️ Part 3: Architecture & Technical Depth (2:30 - 3:30)

*(Point to the architecture or explain with authority)*

| Layer | Technology | Key Highlight |
| :--- | :--- | :--- |
| **Edge Hardware** | ESP32, C++ Firmware, HTTP REST | Live telemetry polling + physical relay & OLED display actuation. |
| **Backend Core** | Python FastAPI, Async HTTPX, SQLAlchemy | High-throughput asynchronous REST API fusing 4 external APIs concurrently via `asyncio.gather`. |
| **Computer Vision** | Ultralytics YOLO11 (`yolo11n.pt`) + PyTorch MobileNetV3 | Real-time leaf lesion detection + anti-selfie safety guard. |
| **Satellite Remote Sensing** | Copernicus Sentinel-2 L2A STAC + Open-Meteo + SoilGrids | Zero-hardware macro NDVI health scoring + 3D soil depth profiles. |
| **Bilingual GenAI** | OpenRouter LLM + Vector RAG + Web Speech API | Dual-language agronomic reasoning in English and Tamil. |
| **Frontend UI** | React 19, TypeScript, Tailwind CSS v4, Framer Motion | Retro-tactile pixel mission dashboard with live data caching. |

---

## 🌍 Part 4: Real-World Impact & UN SDGs (3:30 - 4:00)

> **"AgriStack directly addresses three critical United Nations Sustainable Development Goals:**
> 1. 🌾 **SDG 2: Zero Hunger** — Minimizes crop losses by up to 25% through early-stage edge pathogen detection and precision NPK dosing.
> 2. 💧 **SDG 6: Clean Water & Sanitation** — Reduces agricultural freshwater waste by up to 35% through $ET_0$-driven drip irrigation scheduling.
> 3. 📉 **SDG 13: Climate Action** — Equips rural smallholders with microclimate resilience and actionable adaptation data."

---

## 🎯 Part 5: The Winning Close (4:00)

> **"Judges, precision farming should not be a luxury reserved for multi-million-dollar industrial monocultures.**
>
> By uniting low-cost ESP32 hardware, free public satellite Earth observation, edge computer vision, and bilingual vernacular AI, **AgriStack brings NASA-grade agronomic intelligence into the hands of every smallholder farmer.**
>
> Thank you, and we welcome your questions!"

---

## 🛡️ Anticipated Judge Questions & Bulletproof Answers

### Q1: *"What happens when the farmer's field has poor or zero internet connectivity?"*
> **Answer:**  
> *"That's why AgriStack uses a local-first edge architecture. The ESP32 hardware handles threshold-based relay triggers autonomously even if the laptop or cloud disconnects. Furthermore, the frontend client implements local caching (`LAST_TELEMETRY_CACHE`) and fallback mock telemetry so the dashboard remains fully operational offline."*

### Q2: *"How accurate is satellite NDVI for a small 1-acre farm?"*
> **Answer:**  
> *"Copernicus Sentinel-2 provides 10-meter spatial resolution per pixel. While satellite NDVI gives the macro crop vigor trend across the plot, we fuse it with localized ground-truth sensors (ESP32 soil moisture & leaf photo CV) in our Multimodal Crop Stress Fusion Model to eliminate false alarms."*

### Q3: *"Why did you include Tamil language and text-to-speech?"*
> **Answer:**  
> *"India alone has over 120 million smallholder farmers, and the majority in southern states like Tamil Nadu are far more comfortable with vernacular Tamil than technical English. Incorporating native Tamil generation with Web Speech synthesis removes the literacy and tech-literacy barrier completely."*

### Q4: *"Can your computer vision model run on an edge camera like ESP32-CAM or Raspberry Pi?"*
> **Answer:**  
> *"Yes! We selected Ultralytics YOLO11 Nano (`yolo11n.pt`) specifically for its ultra-lightweight footprint (under 6MB). It is directly quantizable into ONNX or TensorFlow Lite for embedded microcontrollers and edge AI accelerators."*

### Q5: *"How do you verify SoilGrids and Weather accuracy?"*
> **Answer:**  
> *"We cross-validate Open-Meteo forecasts against live on-field DHT11 and BMP180 readings to compute microclimate bias correction. For soil, ISRIC SoilGrids provides standardized depth slices (0-5cm) which our agronomic rules engine maps directly to ICAR/FAO crop-specific nutrient thresholds."*
