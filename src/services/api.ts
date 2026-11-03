const API_BASE_URLS = [
  ...new Set([
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
    'http://127.0.0.1:8000/api/v1',
  ]),
];

export interface ForecastItem {
  day?: string;
  date: string;
  et0_mm?: number;
  rain_sum_mm?: number;
  rain_prob_pct?: number;
  temp_max_c?: number;
  temp_min_c?: number;
  precipitation_mm?: number;
  wind_max_kmh?: number;
  shortwave_sum_mj?: number;
  precip_hours?: number;
  sunrise?: string | null;
  sunset?: string | null;
}

export interface BackendFarmSummary {
  farm: {
    farm_id: string;
    name: string;
    latitude: number;
    longitude: number;
    crop: string;
    soil_type: string;
    area_ha: number;
    water_source: string;
  };
  soil: {
    ph: number;
    organic_carbon_pct: number;
    nitrogen_mg_kg: number;
    phosphorus_mg_kg: number;
    potassium_mg_kg: number;
    clay_pct: number;
    sand_pct: number;
    silt_pct: number;
    cec_cmolc_kg?: number;
    soil_class?: string;
    crop_suitability: any;
    dosing_recommendation: string;
    source: string;
  };
  weather: {
    // Temperatures
    temperature: number;
    apparent_temp_c?: number;
    dew_point_c?: number;
    // Humidity & rain
    humidity: number;
    rainfall_mm: number;
    rainfall_7day_mm?: number;
    // Atmospheric
    weather_code?: number;
    pressure_hpa?: number;
    cloud_cover_pct?: number;
    // Wind
    wind_speed_kmh: number;
    wind_direction_deg?: number;
    // Soil surface (from Open-Meteo)
    soil_temp_0cm_c?: number;
    soil_moisture_0_1cm?: number;
    // ET0 & forecast
    et0_mm_day: number;
    source: string;
    forecast_7day: ForecastItem[];
  };
  irrigation: {
    current_moisture_pct: number;
    stress_status: string;
    schedule_7day: any[];
  };
  latest_inference: {
    image_id: string;
    species?: string;
    disease_detected?: string;
    disease_class?: string;
    confidence: number;
    status: string;
    boxes: any[];
    recommendation: string;
  };
  satellite?: {
    sentinel_tile_id?: string;
    platform?: string;
    acquisition_date?: string;
    cloud_cover_pct?: number;
    stac_catalog_live?: boolean;
    // Rainfall accumulations (from Open-Meteo via Copernicus service)
    rainfall_24h_mm?: number;
    rainfall_7day_mm?: number;
    spectral_bands?: {
      B02_Blue_490nm: number;
      B03_Green_560nm: number;
      B04_Red_665nm: number;
      B08_NIR_842nm: number;
      B11_SWIR1_1610nm: number;
      B12_SWIR2_2190nm: number;
    };
    vegetation_indices?: {
      NDVI: number;
      NDRE: number;
      EVI: number;
      NDWI: number;
      NDMI?: number;
      SAVI?: number;
      canopy_moisture_index: number;
    };
    solar_radiation?: {
      shortwave_radiation_w_m2: number;
      direct_normal_irradiance_w_m2: number;
      uv_index_max: number;
      daily_energy_sum_mj_m2: number;
    };
  };
  nasa_power?: {
    source: string;
    historical_avg_temp_c: number;
    historical_annual_precip_mm: number;
    solar_irradiance_kw_m2: number;
    status: string;
  };
}

export interface VisionAnalysisResult {
  status: string;
  filename: string;
  image_dimensions: { width: number; height: number };
  pipeline: string;
  models_loaded: string[];
  plant_type: string;
  confidence: number;
  condition: string;
  weed_detected: string | null;
  pest_count: number;
  bio_treatment: string;
  npk_recommendation: string;
  bounding_boxes: Array<{ class: string; confidence: number; box: number[] }>;
}

export const agriApi = {
  /**
   * Fetch complete unified farm intelligence summary from FastAPI backend.
   * Returns: soil (SoilGrids v2), weather (Open-Meteo + ML), satellite (Sentinel-2 STAC),
   * irrigation (ML schedule), nasa_power (historical climate), vision inference.
   */
  async getFarmSummary(farmId = 'FARM-001'): Promise<BackendFarmSummary | null> {
    for (const baseUrl of API_BASE_URLS) {
      try {
        const res = await fetch(`${baseUrl}/farms/${farmId}/summary`);
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        // try next endpoint
      }
    }
    console.warn('Backend API unavailable on localhost:8000');
    return null;
  },

  /**
   * Post image base64 frame to backend pre-trained vision pipeline
   */
  async analyzeCropImage(imageBase64: string, filename = 'camera_snapshot.jpg'): Promise<VisionAnalysisResult | null> {
    for (const baseUrl of API_BASE_URLS) {
      try {
        const res = await fetch(`${baseUrl}/inference/analyze-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: imageBase64, filename }),
        });
        if (res.ok) return await res.json();
      } catch (err) {
        // continue
      }
    }
    return null;
  },

  /**
   * Post question to RAG & GLM Advisory Chat API
   */
  async askAdvisory(farmId: string, question: string) {
    for (const baseUrl of API_BASE_URLS) {
      try {
        const res = await fetch(`${baseUrl}/advisory/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ farm_id: farmId, question }),
        });
        if (res.ok) return await res.json();
      } catch (err) {
        // continue
      }
    }
    return null;
  },
};
