from fastapi import APIRouter, UploadFile, File
from datetime import datetime

router = APIRouter(prefix="/images", tags=["images"])

@router.post("")
async def upload_crop_image(file: UploadFile = File(...), farm_id: str = "FARM-AGRI-2026-01"):
    """
    Upload crop foliage frame from ESP32-CAM or smartphone.
    """
    image_id = f"IMG-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    return {
        "status": "UPLOADED",
        "image_id": image_id,
        "filename": file.filename,
        "farm_id": farm_id,
        "timestamp": datetime.utcnow()
    }
