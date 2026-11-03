from datetime import datetime, timedelta
from typing import Dict, Any, List

class IrrigationMLModel:
    def calculate_water_stress(self, moisture_pct: float, soil_type: str = "Clay Loam") -> Dict[str, Any]:
        """
        Determines soil water stress state based on moisture percentage:
        Field Capacity: 38-42%
        Stress threshold: < 32%
        Wilting point: < 18%
        """
        if moisture_pct >= 36.0:
            status = "OPTIMAL"
            stress_level = 0.0
            action = "No irrigation required today."
        elif moisture_pct >= 30.0:
            status = "WATCH"
            stress_level = 0.25
            action = "Monitor root zone moisture trajectory."
        elif moisture_pct >= 20.0:
            status = "STRESSED"
            stress_level = 0.65
            action = "Schedule drip irrigation within 12 hours."
        else:
            status = "SEVERE_WARNING"
            stress_level = 0.95
            action = "CRITICAL: Immediate irrigation cycle mandatory to avoid crop wilting."

        return {
            "moisture_pct": moisture_pct,
            "soil_type": soil_type,
            "status": status,
            "stress_level": stress_level,
            "action": action
        }

    def generate_7day_schedule(
        self,
        farm_id: str,
        current_moisture: float,
        weather_forecast: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Computes 7-day daily irrigation schedule (L/m²) fusing root moisture, Open-Meteo ET0, and rain probability.
        """
        schedule = []
        simulated_moisture = current_moisture

        for i, day_data in enumerate(weather_forecast[:7]):
            et0 = day_data.get("et0_mm", 4.2)
            rain_mm = day_data.get("rain_sum_mm", 0.0)
            rain_prob = day_data.get("rain_prob_pct", 10.0)

            # Daily moisture draw-down equation
            simulated_moisture = simulated_moisture - (et0 * 0.8) + (rain_mm * 0.7)
            
            if simulated_moisture < 32.0 and rain_prob < 40.0:
                water_req = round(et0 * 2.8, 1)
                action = f"Drip Irrigation Cycle: {water_req} L/m²"
                simulated_moisture += (water_req * 0.6)  # Soil replenishment
            else:
                water_req = 0.0
                action = "Hold Irrigation (Natural Rainfall / Sufficient Moisture)"

            schedule.append({
                "day": day_data.get("day", f"Day {i+1}"),
                "date": day_data.get("date", datetime.utcnow().strftime("%Y-%m-%d")),
                "moisture_pct": round(max(15.0, min(42.0, simulated_moisture)), 1),
                "et0_mm": et0,
                "rain_prob_pct": rain_prob,
                "water_required_liters_m2": water_req,
                "action": action
            })

        return schedule

irrigation_model = IrrigationMLModel()
