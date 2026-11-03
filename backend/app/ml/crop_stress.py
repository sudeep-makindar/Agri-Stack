from typing import Dict, Any

class CropStressFusionModel:
    def evaluate_crop_stress(
        self,
        moisture_pct: float,
        temperature_c: float,
        ndvi: float,
        yolo_status: str = "HEALTHY"
    ) -> Dict[str, Any]:
        """
        Multimodal feature fusion: Moisture + Temperature + Satellite NDVI + YOLO vision.
        Categorizes stress into NORMAL / WATCH / STRESSED / SEVERE_WARNING.
        """
        stress_flags = []
        
        if moisture_pct < 32.0:
            stress_flags.append("Soil Moisture Deficit")
        if temperature_c > 35.0 or temperature_c < 10.0:
            stress_flags.append("Microclimate Thermal Anomaly")
        if ndvi < 0.60:
            stress_flags.append("Satellite Crop Vigor Decline (Low NDVI)")
        if yolo_status != "HEALTHY":
            stress_flags.append(f"Visual Symptom Flag: {yolo_status}")

        if not stress_flags:
            state = "NORMAL"
            severity = "INFO"
        elif len(stress_flags) == 1:
            state = "WATCH"
            severity = "LOW"
        elif len(stress_flags) == 2:
            state = "STRESSED"
            severity = "MEDIUM"
        else:
            state = "SEVERE_WARNING"
            severity = "HIGH"

        return {
            "crop_stress_state": state,
            "severity": severity,
            "active_stress_flags": stress_flags,
            "evidence": f"Evaluated moisture ({moisture_pct}%), temp ({temperature_c}°C), NDVI ({ndvi}), and vision status ({yolo_status})."
        }

crop_stress_model = CropStressFusionModel()
