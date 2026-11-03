import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
ENV_PATH = BASE_DIR / ".env"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Agri-Resource & Climate Intelligence Stack Backend"
    API_V1_STR: str = "/api/v1"
    
    # ESP32 Hardware Configuration
    ESP32_IP: str = "http://192.168.137.33"
    ESP32_HOST: str = "192.168.137.33"
    
    # Copernicus Data Space Ecosystem Credentials
    COPERNICUS_CLIENT_ID: str = ""
    COPERNICUS_CLIENT_SECRET: str = ""
    COPERNICUS_BASE_URL: str = "https://catalogue.dataspace.copernicus.eu/odata/v1"
    COPERNICUS_TOKEN_URL: str = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
    
    # Earth Search STAC & SoilGrids APIs
    ELEMENT84_STAC_URL: str = "https://earth-search.aws.element84.com/v1/search"
    SOILGRIDS_BASE_URL: str = "https://rest.isric.org/soilgrids/v2.0"
    SOILGRIDS_TIMEOUT: int = 15
    
    # Open-Meteo Weather API
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1/forecast"
    
    # NASA POWER Agroclimate API
    NASA_POWER_BASE_URL: str = "https://power.larc.nasa.gov/api/temporal/daily/point"
    
    # Database & GLM Credentials
    DATABASE_URL: str = "sqlite:///./agri_stack.db"
    GLM_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=str(ENV_PATH) if ENV_PATH.exists() else None,
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
