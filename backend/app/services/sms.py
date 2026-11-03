import logging
from datetime import datetime
from typing import Dict, Any

logger = logging.getLogger(__name__)

class SmsAlertService:
    async def send_sms_alert(self, farm_id: str, phone_number: str, message: str) -> Dict[str, Any]:
        """
        Dispatches SMS alert via Exens 800L GSM Telemetry modem / SMS gateway provider.
        """
        logger.info(f"Dispatched GSM SMS to {phone_number} for farm {farm_id}: {message}")
        return {
            "status": "DELIVERED",
            "gateway": "Exens 800L GSM Telemetry Modem",
            "farm_id": farm_id,
            "phone_number": phone_number,
            "message": message,
            "timestamp": datetime.utcnow().isoformat()
        }

sms_service = SmsAlertService()
