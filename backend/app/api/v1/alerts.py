from fastapi import APIRouter
from backend.app.schemas.payload import SmsAlertRequest, SmsAlertResponse
from backend.app.services.sms import sms_service

router = APIRouter(prefix="/alerts", tags=["alerts"])

@router.post("/sms", response_model=SmsAlertResponse)
async def trigger_sms_alert(req: SmsAlertRequest):
    """
    Trigger actionable farmer alert via Exens 800L GSM Telemetry modem / SMS gateway.
    """
    return await sms_service.send_sms_alert(req.farm_id, req.phone_number, req.message)
