from fastapi import APIRouter
from backend.app.services.soilgrids import soilgrids_service
from backend.app.ml.soil import soil_model

router = APIRouter(prefix="/soil", tags=["soil"])

@router.get("/{farm_id}")
async def get_soil_intelligence(farm_id: str, lat: float = 18.5204, lon: float = 73.8567):
    """
    Get SoilGrids modelled soil properties, ground-truth lab NPK, and precision fertilizer recommendation.
    """
    raw_soil = await soilgrids_service.get_soil_properties(lat, lon)
    analysis = soil_model.analyze_nutrient_deficiency(
        ph=raw_soil["ph"],
        nitrogen=raw_soil["nitrogen_mg_kg"],
        phosphorus=raw_soil["phosphorus_mg_kg"],
        potassium=raw_soil["potassium_mg_kg"],
        organic_carbon=raw_soil["organic_carbon_pct"]
    )
    return {
        "farm_id": farm_id,
        "raw_soil_properties": raw_soil,
        "analysis": analysis
    }
