from fastapi import APIRouter
from backend.app.services.openmeteo import openmeteo_service
from backend.app.ml.irrigation import irrigation_model

router = APIRouter(prefix="/irrigation", tags=["irrigation"])

@router.get("/{farm_id}/schedule")
async def get_irrigation_schedule(farm_id: str, lat: float = 18.5204, lon: float = 73.8567):
    """
    Returns 7-day precision irrigation schedule and soil water stress evaluation.
    """
    weather = await openmeteo_service.get_weather_forecast(lat, lon)
    current_moisture = 38.4
    schedule = irrigation_model.generate_7day_schedule(farm_id, current_moisture, weather["forecast_7day"])
    stress = irrigation_model.calculate_water_stress(current_moisture)

    return {
        "farm_id": farm_id,
        "current_moisture_pct": current_moisture,
        "stress_status": stress["status"],
        "action": stress["action"],
        "schedule_7day": schedule
    }
