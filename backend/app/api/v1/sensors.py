from fastapi import APIRouter
from datetime import datetime
from typing import List, Dict, Any
from backend.app.schemas.payload import SensorReadingCreate

router = APIRouter(prefix="/sensors", tags=["sensors"])

READINGS_DB = []

@router.post("/readings")
async def ingest_sensor_reading(reading: SensorReadingCreate):
    """
    Ingest IoT sensor reading (ESP32 soil moisture, SHT31 temperature, tipping bucket rain).
    """
    data = reading.dict()
    data["timestamp"] = data["timestamp"] or datetime.utcnow()
    READINGS_DB.append(data)
    return {
        "status": "INGESTED",
        "reading": data
    }

@router.get("/farms/{farm_id}/sensors")
async def get_farm_sensor_history(farm_id: str):
    """
    Retrieve historical sensor readings for a farm.
    """
    return {
        "farm_id": farm_id,
        "total_readings": len(READINGS_DB),
        "sensors": [
            {
                "sensor_id": "SENSOR-MOISTURE-01",
                "type": "soil_moisture",
                "current_value": 38.4,
                "unit": "% VWC",
                "status": "OPTIMAL"
            },
            {
                "sensor_id": "SENSOR-TEMP-HUMID-01",
                "type": "sht31_climate",
                "temperature_c": 27.4,
                "humidity_pct": 68.0,
                "unit": "°C / %",
                "status": "LIVE"
            }
        ]
    }
