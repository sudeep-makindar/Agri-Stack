# AgriStack

AgriStack is a farm monitoring and decision support prototype with a React dashboard, a FastAPI backend, and an optional ESP32 sensor gateway. It brings weather, soil information, watering recommendations, plant photo checks, and English/Tamil advisory into one interface.

This README describes the current local implementation. A repository URL for this updated version has not been configured.

## Dashboard

The app opens on a landing page at `/`. Visit `/dashboard` to access the farm dashboard, with desktop side navigation and mobile bottom navigation.

| Section | Route | Current functionality |
| --- | --- | --- |
| Today | `/dashboard/today` | Farm overview, conditions, alerts, and suggested actions |
| Watering plan | `/dashboard/watering` | Seven-day watering estimates based on forecast rainfall, ET₀, and estimated moisture |
| Weather | `/dashboard/weather` | Current conditions, seven-day forecast, and historical agroclimate context |
| Field map | `/dashboard/map` | Satellite basemap, farm location, vegetation indicators, and environmental context |
| Field sensors | `/dashboard/sensors` | ESP32 telemetry, relay control, and OLED message controls |
| Plant check | `/dashboard/plant-check` | Photo upload/capture input and bundled plant sample images |

The Ask panel provides English and Tamil advisory with browser speech synthesis where a suitable voice is available. Farm summaries refresh every five minutes; the sensor view polls every three seconds.

The dashboard currently uses the fixed farm ID `FARM-74-2B`. Farm identity and defaults are defined in `src/pages/DashboardPage.tsx`, `src/data/modules.ts`, and `backend/app/api/v1/farms.py`.

## Technology

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router, Motion, and Lucide icons.
- **Backend:** FastAPI, Pydantic, HTTPX, SQLAlchemy, NumPy, pandas, and scikit-learn.
- **Images:** Pillow; optional Ultralytics YOLO and PyTorch/Torchvision integration.
- **External data:** Open-Meteo, NASA POWER, ISRIC SoilGrids, and Element84 Earth Search Sentinel-2 catalog metadata. The map uses Esri imagery tiles.
- **Hardware:** ESP32 Arduino firmware with sensor reads and HTTP endpoints for telemetry, relay switching, and OLED messages.

## Run locally

Run commands from the directory containing this README, `package.json`, and `backend/`.

### Prerequisites

- Node.js **20.19+ on the 20.x line, or 22.12+**, as required by the installed Vite version.
- Python **3.10+** with virtual environment support. Optional vision packages may support a narrower set of Python versions.
- Internet access for dependency installation and external data services. The interface also has sample and fallback data.

### 1. Configuration

For a fresh setup, copy the example file if you do not already have a `.env`:

```bash
cp .env.example .env
```

Update the values for your environment. The main settings are:

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Frontend API base URL; defaults to `http://localhost:8000/api/v1` |
| `ESP32_IP` | Backend gateway URL including scheme, such as `http://192.168.1.50` |
| `ESP32_HOST` | Gateway hostname or IP without a scheme |
| `VITE_ESP32_IP` / `VITE_ESP32_HOST` | Gateway values used by the frontend |
| `DATABASE_URL` | SQLAlchemy connection URL; defaults to `sqlite:///./agri_stack.db` |
| `GLM_API_KEY` | Optional OpenRouter key for live advisory; the current code expects an `sk-or-` key |
| `ELEMENT84_STAC_URL`, `SOILGRIDS_BASE_URL`, `OPEN_METEO_BASE_URL`, `NASA_POWER_BASE_URL` | Override external service endpoints |
| `COPERNICUS_CLIENT_ID` / `COPERNICUS_CLIENT_SECRET` | Settings retained for Copernicus integration; the current satellite service queries public Element84 STAC |

Backend settings load the root `.env`. Restart the relevant server after changing configuration. Variables prefixed with `VITE_` are exposed to the browser; keep API secrets in backend settings.

### 2. Start the backend

macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
python -m pip install pillow python-multipart scikit-learn
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

On Windows, create the environment with `py -m venv .venv` and activate it in PowerShell with `.venv\Scripts\Activate.ps1`, then run the same `python` commands.

The additional install command is required because the current `backend/requirements.txt` omits Pillow, python-multipart, and scikit-learn, although the application imports them.

- Backend status: <http://localhost:8000/>
- Interactive API documentation: <http://localhost:8000/docs>
- Alternative API documentation: <http://localhost:8000/redoc>

The SQLite path is relative to the working directory. Start the backend from the project root to use the intended database location.

### 3. Start the frontend

In another terminal:

```bash
npm install
npm run dev
```

Open <http://localhost:3000>, then enter the dashboard. If the backend is unavailable, the dashboard displays an offline notice and sample data. Start the backend and use the refresh button to reconnect.

### Optional vision dependencies

To enable the optional model integrations in a compatible Python environment:

```bash
python -m pip install torch torchvision ultralytics
```

Model initialization may download weights when they are not available locally. Without these packages, the backend still starts and the plant analysis uses its available heuristic paths. Installing them does not turn the existing plant checks into a validated crop disease classifier.

## ESP32 setup

1. Open `firmware/esp32_gateway/esp32_gateway.ino` in Arduino IDE with ESP32 board support installed.
2. Set `WIFI_SSID` and `WIFI_PASSWORD` for your network.
3. Select the appropriate ESP32 board and serial port, then upload the sketch.
4. Read the device address from serial output and update the backend/frontend ESP32 settings in `.env`.
5. Restart the servers and open **Field sensors**. The backend must be able to reach the device on the network.

The firmware exposes `GET /status`, `GET /sensors`, `POST /relay`, and `POST /display` on its HTTP server. The frontend normally uses the backend gateway routes.

| Connection | ESP32 pin |
| --- | --- |
| DHT11 data | GPIO 4 |
| MQ-6 analog output | GPIO 34 |
| Relay control | GPIO 13 |
| GPS TX → ESP32 RX | GPIO 16 |
| GPS RX ← ESP32 TX | GPIO 17 |
| I²C SDA / SCL | GPIO 21 / GPIO 22 |
| Onboard status LED | GPIO 2 |

The shared I²C bus includes the BMP180 and SSD1306 OLED. See [PIN_DIAGRAM.md](PIN_DIAGRAM.md) and the firmware for wiring details. No physical soil moisture ADC is configured in the gateway sketch.

## API overview

All routes below use the `/api/v1` prefix. See `/docs` for payload schemas.

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/farms` | Register a farm in the prototype's in-memory store |
| `GET` | `/farms/{farm_id}/summary` | Aggregate farm, soil, weather, satellite, irrigation, and inference context |
| `GET` | `/weather/{farm_id}` | Forecast and historical climate context |
| `GET` | `/soil/{farm_id}` | Soil information and nutrient analysis |
| `GET` | `/satellite/farms/{farm_id}` | Satellite catalog context and vegetation indicators |
| `GET` | `/irrigation/{farm_id}/schedule` | Backend watering schedule |
| `POST` | `/inference/analyze-image` | Analyze an uploaded image or base64 image payload |
| `POST` | `/advisory/chat` | Ask a farm-context question |
| `GET` | `/esp32/status`, `/esp32/sensors` | Gateway status and telemetry |
| `POST` | `/esp32/relay`, `/esp32/display` | Control relay state or send a display message |

Additional image, sensor, recommendation, and disease inference routes are listed in the API documentation. The SMS alert module exists in the source but is not mounted in the current API router.

## Data behavior and prototype limits

- **Connectivity and data provenance:** A reachable backend can still return fallback values when upstream services fail. The dashboard's Live indicator means the summary request succeeded; it does not establish that every value is a current measurement. ESP32 responses may also use cached or sample telemetry, and the status fallback currently reports an online device.
- **Satellite indicators:** Sentinel-2 catalog metadata can be fetched live. Vegetation indices are coordinate-derived proxies and spectral band values are fixed examples, rather than measurements extracted from satellite pixels. The basemap is separate imagery.
- **Soil and watering:** SoilGrids provides mapped soil context with a baseline fallback. Phosphorus and potassium are estimated in code. Moisture and watering recommendations are model/heuristic estimates; the frontend derives its own schedule from summary data. There is no background scheduler that automatically executes that displayed plan.
- **Plant checks:** Results combine image heuristics, filename matching, and optional general vision models. Bundled examples demonstrate the flow; they are not evidence of diagnostic accuracy.
- **Advisory:** Retrieval uses a small built-in knowledge base and keyword matching. An optional OpenRouter call provides generated answers; otherwise the service returns English/Tamil template responses. Model IDs are configured in `backend/app/services/glm.py` and may need updating if the provider changes availability.
- **Weather ML:** The weather model loads local scikit-learn weights or trains on synthetic, physics-derived data. Saved estimators may be incompatible with a different scikit-learn version and trigger retraining.
- **Storage:** SQLAlchemy and a SQLite database are initialized, but farm registration and ingested sensor readings currently use process memory. These records do not survive a backend restart. The image upload route returns metadata without persisting the file.

## Project layout

```text
src/
  pages/                  Landing page and dashboard composition
  components/             Navigation, farm views, sensors, plant check, advisory
  services/api.ts         Frontend backend client and response types
  data/                   Demo farm data and module descriptions
  utils/                  Weather, watering, and agronomy helpers
backend/
  app/api/v1/             API route handlers
  app/core/               Settings and database initialization
  app/services/           External data adapters and advisory services
  app/ml/                 Soil, irrigation, weather, and vision logic
  app/models/             SQLAlchemy model definitions
  app/schemas/            Request and response schemas
  requirements.txt        Base Python dependencies
firmware/                 ESP32 gateway and display test sketches
public/test-samples/      Bundled plant-check images
```

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite on port 3000 |
| `npm run lint` | Run TypeScript checking with `tsc --noEmit` |
| `npm run build` | Generate the frontend production bundle in `dist/` |
| `npm run preview` | Preview the built frontend locally |

The frontend build does not package or start the Python backend. For a deployment using React Router, configure the frontend host to serve `index.html` for dashboard routes, and set `VITE_API_BASE_URL` before building.

## Further documentation

- [System architecture](SYSTEM_ARCHITECTURE.md)
- [Data flow](DATA_FLOW.md)
- [ESP32 gateway API guide](ESP32_Gateway_Agent_API_Guide.md)
- [Hardware pin diagram](PIN_DIAGRAM.md)

These supporting documents may contain earlier design descriptions; use the current source code to verify implementation details.
