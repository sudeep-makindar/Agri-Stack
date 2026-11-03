from fastapi import APIRouter
from backend.app.api.v1 import (
    farms,
    sensors,
    satellite,
    soil,
    weather,
    irrigation,
    images,
    inference,
    recommendations,
    advisory,
    esp32,
)

api_router = APIRouter()

api_router.include_router(farms.router)
api_router.include_router(sensors.router)
api_router.include_router(satellite.router)
api_router.include_router(soil.router)
api_router.include_router(weather.router)
api_router.include_router(irrigation.router)
api_router.include_router(images.router)
api_router.include_router(inference.router)
api_router.include_router(recommendations.router)
api_router.include_router(advisory.router)
api_router.include_router(esp32.router)

