from fastapi import APIRouter
from backend.app.services.openmeteo import openmeteo_service
from backend.app.services.nasa_power import nasa_power_service

router = APIRouter(prefix="/weather", tags=["weather"])

@router.get("/{farm_id}")
async def get_farm_weather(farm_id: str, lat: float = 18.5204, lon: float = 73.8567):
    """
    Get Open-Meteo current & 7-day forecast combined with NASA POWER historical agroclimate data.
    """
    forecast = await openmeteo_service.get_weather_forecast(lat, lon)
    history = await nasa_power_service.get_agroclimate_history(lat, lon)
    return {
        "farm_id": farm_id,
        "forecast": forecast,
        "historical_agroclimate": history
    }
