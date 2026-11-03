from fastapi import APIRouter, File, UploadFile, Request
from pydantic import BaseModel
from typing import Optional
from backend.app.ml.vision import vision_model

router = APIRouter(prefix="/inference", tags=["inference"])

class Base64ImagePayload(BaseModel):
    image_base64: Optional[str] = None
    filename: Optional[str] = "camera_snapshot.jpg"

@router.post("/disease")
async def run_disease_inference(image_id: str = "IMG-SAMPLE-4081"):
    """
    Run Ultralytics YOLO & Hugging Face Vision Transformer foliage disease and pest detection.
    """
    return vision_model.run_inference(image_id)

@router.post("/analyze-image")
async def analyze_crop_image(
    request: Request,
    file: Optional[UploadFile] = File(None)
):
    """
    Analyze uploaded camera frame or Base64 image using Hugging Face & Ultralytics pre-trained AI pipeline.
    Rejects human faces or non-plant subjects cleanly.
    """
    if file:
        image_bytes = await file.read()
        return vision_model.analyze_image(image_bytes=image_bytes, filename=file.filename)

    try:
        data = await request.json()
        image_base64 = data.get("image_base64")
        filename = data.get("filename", "camera_snapshot.jpg")
        return vision_model.analyze_image(image_base64=image_base64, filename=filename)
    except Exception:
        pass

    return vision_model.analyze_image(filename="camera_snapshot_default.jpg")
