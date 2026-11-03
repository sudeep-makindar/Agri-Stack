import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

AGRI_KNOWLEDGE_BASE = [
    {
        "id": "KB-SOIL-01",
        "category": "nutrient",
        "keywords": ["nitrogen", "npk", "urea", "maize", "dosing"],
        "content": "For Maize (Zea mays) in Clay Loam soil with pH 6.8, optimal target NPK is 150:40:150 kg/ha. When soil test shows N at 140 mg/kg, apply top-dressing of 25 kg/ha Nitrogen (Urea 46% N) at V4-V6 growth stage to prevent leaf yellowing."
    },
    {
        "id": "KB-IRR-02",
        "category": "irrigation",
        "keywords": ["moisture", "drip", "schedule", "evapotranspiration", "water"],
        "content": "Clay Loam field capacity is 38-42% volumetric water content. Wilting point is 18%. When root zone moisture drops below 35% with forecast ET0 exceeding 4.0 mm/day and <20% rain probability, schedule 12-15 L/m² drip irrigation early morning."
    },
    {
        "id": "KB-DISEASE-03",
        "category": "disease",
        "keywords": ["blight", "yolo", "foliage", "fungicide", "copper"],
        "content": "Early Blight (Alternaria solani / Exserohilum turcicum) on maize foliage appears as concentric dark spots. At early stage (<5% leaf coverage detected by YOLO vision), apply copper hydroxide or azoxystrobin spray during cool morning hours."
    },
    {
        "id": "KB-WEATHER-04",
        "category": "weather",
        "keywords": ["microclimate", "frost", "heat", "temperature", "humidity"],
        "content": "Field SHT31 sensor readings microclimate correction adjusts regional forecast by -0.3°C. Temperatures between 20-30°C with RH 65-75% represent optimal vegetative growth conditions."
    }
]

class AgriRagService:
    def retrieve_evidence(self, query: str, category: str = "all") -> List[Dict[str, Any]]:
        """
        Retrieves matching agricultural document evidence based on keyword matching & domain relevance.
        """
        query_terms = query.lower().split()
        results = []

        for doc in AGRI_KNOWLEDGE_BASE:
            score = 0
            for term in query_terms:
                if any(kw in term or term in kw for kw in doc["keywords"]):
                    score += 1
            if score > 0 or category == "all" or doc["category"] == category:
                results.append({
                    "id": doc["id"],
                    "content": doc["content"],
                    "relevance_score": round(0.85 + score * 0.05, 2)
                })

        if not results:
            results.append(AGRI_KNOWLEDGE_BASE[0])

        return results

rag_service = AgriRagService()
