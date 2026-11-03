from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class FarmCreate(BaseModel):
    farm_id: str = Field(..., example="FARM-AGRI-2026-01")
    name: str = Field(..., example="Green Valley Research Farm")
    latitude: float = Field(..., example=18.5204)
    longitude: float = Field(..., example=73.8567)
    polygon: Optional[Dict[str, Any]] = None
    crop: str = Field("Maize", example="Maize")
    soil_type: str = Field("Clay Loam", example="Clay Loam")
    area_ha: float = Field(4.2, example=4.2)
    water_source: str = Field("Groundwater Drip", example="Groundwater Drip")

class FarmResponse(FarmCreate):
    created_at: datetime

class SensorReadingCreate(BaseModel):
    sensor_id: str = Field(..., example="SENSOR-MOISTURE-01")
    value: float = Field(..., example=38.4)
    quality_flag: str = Field("GOOD", example="GOOD")
    timestamp: Optional[datetime] = None

class WeatherResponse(BaseModel):
    """
    Extended weather response including all Open-Meteo fields:
    temperatures, humidity, atmospheric pressure, cloud cover, wind, soil
    surface conditions, rainfall, and 7-day forecast with ET0.
    Using model_config extra='allow' so additional fields pass through.
    """
    farm_id: str
    # Core temperatures
    temperature: float
    apparent_temp_c: Optional[float] = None
    dew_point_c: Optional[float] = None
    # Humidity & precipitation
    humidity: float
    rainfall_mm: float
    rainfall_7day_mm: Optional[float] = None
    # Atmospheric
    weather_code: Optional[int] = None
    pressure_hpa: Optional[float] = None
    cloud_cover_pct: Optional[float] = None
    # Wind
    wind_speed_kmh: float
    wind_direction_deg: Optional[float] = None
    # Soil surface (from Open-Meteo)
    soil_temp_0cm_c: Optional[float] = None
    soil_moisture_0_1cm: Optional[float] = None
    # ET0 + source
    et0_mm_day: float
    source: str
    forecast_7day: List[Dict[str, Any]]

    model_config = {"extra": "allow"}

class SoilProfileResponse(BaseModel):
    farm_id: str
    source: str
    ph: float
    organic_carbon_pct: float
    nitrogen_mg_kg: float
    phosphorus_mg_kg: float
    potassium_mg_kg: float
    clay_pct: float
    sand_pct: float
    silt_pct: float
    cec_cmolc_kg: Optional[float] = None
    soil_class: Optional[str] = None
    crop_suitability: Any
    dosing_recommendation: str

    model_config = {"extra": "allow"}

class IrrigationScheduleDay(BaseModel):
    day: str
    date: str
    moisture_pct: float
    et0_mm: float
    rain_prob_pct: float
    water_required_liters_m2: float
    action: str

class IrrigationScheduleResponse(BaseModel):
    farm_id: str
    current_moisture_pct: float
    stress_status: str
    schedule_7day: List[Dict[str, Any]]

    model_config = {"extra": "allow"}

class YoloInferenceResponse(BaseModel):
    image_id: str
    disease_class: Optional[str] = None
    confidence: float
    status: str
    boxes: List[Dict[str, Any]]
    recommendation: str

    model_config = {"extra": "allow"}

class AdvisoryChatRequest(BaseModel):
    farm_id: str
    question: str
    query_type: Optional[str] = "general"

class AdvisoryChatResponse(BaseModel):
    farm_id: str
    question: str
    answer: str
    retrieved_sources: List[str]
    confidence_score: float

class SmsAlertRequest(BaseModel):
    farm_id: str
    phone_number: str
    message: str

class SmsAlertResponse(BaseModel):
    status: str
    gateway: str
    phone_number: str
    timestamp: datetime

class NasaPowerResponse(BaseModel):
    source: str
    historical_avg_temp_c: float
    historical_annual_precip_mm: float
    solar_irradiance_kw_m2: float
    status: str

    model_config = {"extra": "allow"}

class FarmContextSummary(BaseModel):
    farm: FarmResponse
    soil: SoilProfileResponse
    weather: WeatherResponse
    irrigation: IrrigationScheduleResponse
    latest_inference: Optional[YoloInferenceResponse] = None
    satellite: Optional[Dict[str, Any]] = None
    nasa_power: Optional[NasaPowerResponse] = None
