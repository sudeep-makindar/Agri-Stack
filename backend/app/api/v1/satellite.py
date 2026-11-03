from fastapi import APIRouter
from backend.app.services.copernicus import copernicus_service

router = APIRouter(prefix="/satellite", tags=["satellite"])

@router.get("/farms/{farm_id}")
async def get_satellite_observation(farm_id: str, lat: float = 18.5204, lon: float = 73.8567):
    """
    Retrieve Copernicus Sentinel-2 observation data & vegetation indices (NDVI/NDRE).
    """
    return await copernicus_service.fetch_sentinel2_observation(lat, lon)
