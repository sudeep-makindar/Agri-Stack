from fastapi import APIRouter, HTTPException
from datetime import datetime
from backend.app.schemas.payload import FarmCreate, FarmResponse, FarmContextSummary
from backend.app.services.copernicus import copernicus_service
from backend.app.services.soilgrids import soilgrids_service
from backend.app.services.openmeteo import openmeteo_service
from backend.app.services.nasa_power import nasa_power_service
from backend.app.ml.irrigation import irrigation_model
from backend.app.ml.soil import soil_model
from backend.app.ml.vision import vision_model

router = APIRouter(prefix="/farms", tags=["farms"])

# In-memory store for prototype
FARMS_DB = {}

@router.post("", response_model=FarmResponse)
async def create_farm(farm_in: FarmCreate):
    """
    Register a new farm with GPS coordinates, boundary polygon, and crop details.
    """
    farm_data = farm_in.dict()
    farm_data["created_at"] = datetime.utcnow()
    FARMS_DB[farm_in.farm_id] = farm_data
    return farm_data

@router.get("/{farm_id}/summary", response_model=FarmContextSummary)
async def get_farm_summary(farm_id: str):
    """
    Returns the unified FarmContext combining:
    - ISRIC SoilGrids v2 REST API (pH, OC, NPK, clay/sand/silt, CEC)
    - Open-Meteo live weather (temperature, humidity, apparent temp, dew point,
      pressure, cloud cover, wind speed/direction, soil temp, soil moisture,
      weather code, sunrise/sunset, 7-day forecast with ET0 + rainfall)
    - Copernicus Sentinel-2 L2A via AWS Element84 STAC (tile metadata, cloud cover,
      spectral band reflectances, vegetation indices, solar radiation)
    - Open-Meteo rainfall accumulations (24h + 7-day totals)
    - NASA POWER Agroclimatology API (historical temperature, annual precipitation, solar irradiance)
    - Scikit-Learn ML models (7-day ET0 forecast, irrigation scheduling, soil analysis)
    - Camera/Vision inference pipeline
    """
    farm = FARMS_DB.get(farm_id, {
        "farm_id": farm_id,
        "name": "Green Valley Research Farm",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "crop": "Maize",
        "soil_type": "Clay Loam",
        "area_ha": 4.2,
        "water_source": "Groundwater Drip",
        "created_at": datetime.utcnow()
    })

    lat, lon = farm["latitude"], farm["longitude"]

    # Gather all data concurrently — all I/O-bound calls
    import asyncio
    soil_raw, weather_raw, satellite_raw, nasa_raw = await asyncio.gather(
        soilgrids_service.get_soil_properties(lat, lon),
        openmeteo_service.get_weather_forecast(lat, lon),
        copernicus_service.fetch_sentinel2_observation(lat, lon),
        nasa_power_service.get_agroclimate_history(lat, lon),
    )

    # Calculate soil NPK deficiency and crop suitability
    soil_analysis = soil_model.analyze_nutrient_deficiency(
        ph=soil_raw["ph"],
        nitrogen=soil_raw["nitrogen_mg_kg"],
        phosphorus=soil_raw["phosphorus_mg_kg"],
        potassium=soil_raw["potassium_mg_kg"],
        organic_carbon=soil_raw["organic_carbon_pct"],
        crop=farm["crop"]
    )

    # Calculate 7-day irrigation schedule using live soil moisture + weather
    current_moisture = round(
        (soil_raw.get("clay_pct", 32.0) / 100.0) * 60.0 +
        (weather_raw.get("soil_moisture_0_1cm", 0.25) * 100.0),
        1
    )
    irrigation_schedule = irrigation_model.generate_7day_schedule(
        farm_id=farm_id,
        current_moisture=current_moisture,
        weather_forecast=weather_raw["forecast_7day"]
    )
    water_stress = irrigation_model.calculate_water_stress(current_moisture, farm["soil_type"])

    # Image inference
    inference_raw = vision_model.run_inference("IMG-SAMPLE-4081")

    return {
        "farm": farm,
        "soil": {
            "farm_id": farm_id,
            "source": soil_raw["source"],
            "ph": soil_raw["ph"],
            "organic_carbon_pct": soil_raw["organic_carbon_pct"],
            "nitrogen_mg_kg": soil_raw["nitrogen_mg_kg"],
            "phosphorus_mg_kg": soil_raw["phosphorus_mg_kg"],
            "potassium_mg_kg": soil_raw["potassium_mg_kg"],
            "clay_pct": soil_raw["clay_pct"],
            "sand_pct": soil_raw["sand_pct"],
            "silt_pct": soil_raw["silt_pct"],
            "cec_cmolc_kg": soil_raw.get("cec_cmolc_kg", 18.5),
            "soil_class": soil_raw.get("soil_class", "Clay Loam"),
            "crop_suitability": soil_analysis["suitability_ranking"],
            "dosing_recommendation": soil_analysis["recommended_dosing"],
        },
        "weather": {
            "farm_id": farm_id,
            # Core temperatures
            "temperature": weather_raw["temperature_c"],
            "apparent_temp_c": weather_raw.get("apparent_temp_c", weather_raw["temperature_c"]),
            "dew_point_c": weather_raw.get("dew_point_c", weather_raw["temperature_c"] - 5),
            # Humidity & precipitation
            "humidity": weather_raw["humidity_pct"],
            "rainfall_mm": weather_raw["rainfall_mm"],
            "rainfall_7day_mm": weather_raw.get("rainfall_7day_mm", 0.0),
            # Atmospheric
            "weather_code": weather_raw.get("weather_code", 0),
            "pressure_hpa": weather_raw.get("pressure_hpa", 1013.0),
            "cloud_cover_pct": weather_raw.get("cloud_cover_pct", 30),
            # Wind
            "wind_speed_kmh": weather_raw["wind_speed_kmh"],
            "wind_direction_deg": weather_raw.get("wind_direction_deg", 180),
            # Soil surface
            "soil_temp_0cm_c": weather_raw.get("soil_temp_0cm_c", weather_raw["temperature_c"] - 2),
            "soil_moisture_0_1cm": weather_raw.get("soil_moisture_0_1cm", 0.25),
            # ET0 & forecast
            "et0_mm_day": weather_raw["et0_mm_day"],
            "source": weather_raw["source"],
            "forecast_7day": weather_raw["forecast_7day"],
        },
        "irrigation": {
            "farm_id": farm_id,
            "current_moisture_pct": current_moisture,
            "stress_status": water_stress["status"],
            "schedule_7day": irrigation_schedule,
        },
        "latest_inference": inference_raw,
        "satellite": {
            **satellite_raw,
            # Merge rainfall from both sources (use Open-Meteo weather as primary)
            "rainfall_24h_mm": max(
                satellite_raw.get("rainfall_24h_mm", 0.0),
                weather_raw.get("rainfall_mm", 0.0)
            ),
            "rainfall_7day_mm": max(
                satellite_raw.get("rainfall_7day_mm", 0.0),
                weather_raw.get("rainfall_7day_mm", 0.0)
            ),
        },
        "nasa_power": {
            "source": nasa_raw.get("source", "NASA POWER"),
            "historical_avg_temp_c": nasa_raw.get("historical_avg_temp", 26.8),
            "historical_annual_precip_mm": nasa_raw.get("historical_annual_precip_mm", 1150.0),
            "solar_irradiance_kw_m2": nasa_raw.get("solar_irradiance_kw_m2", 5.4),
            "status": nasa_raw.get("status", "FALLBACK"),
        }
    }
