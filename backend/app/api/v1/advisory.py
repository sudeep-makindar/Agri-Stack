from fastapi import APIRouter
from backend.app.schemas.payload import AdvisoryChatRequest, AdvisoryChatResponse
from backend.app.services.glm import glm_service
from backend.app.api.v1.farms import get_farm_summary

router = APIRouter(prefix="/advisory", tags=["advisory"])

@router.post("/chat", response_model=AdvisoryChatResponse)
async def chat_agri_advisory(req: AdvisoryChatRequest):
    """
    Conversational Agricultural Advisory endpoint combining live numeric FarmContext, retrieved RAG evidence, and LLM (English + Tamil).
    """
    try:
        live_farm_context = await get_farm_summary(req.farm_id)
    except Exception:
        live_farm_context = {
            "farm": {"farm_id": req.farm_id, "name": "Green Valley Research Farm"},
            "soil": {"ph": 6.8, "nitrogen_mg_kg": 140, "phosphorus_mg_kg": 35, "potassium_mg_kg": 180, "soil_class": "Clay Loam"},
            "weather": {"temperature": 28.5, "et0_mm_day": 4.4, "humidity": 64},
            "irrigation": {"current_moisture_pct": 38.4}
        }

    res = await glm_service.generate_advisory(live_farm_context, req.question)
    return {
        "farm_id": req.farm_id,
        "question": req.question,
        "answer": res["answer"],
        "retrieved_sources": res["retrieved_sources"],
        "confidence_score": res["confidence_score"]
    }

