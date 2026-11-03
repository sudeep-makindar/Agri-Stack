from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, JSON, ForeignKey
from backend.app.core.database import Base

class Farm(Base):
    __tablename__ = "farms"

    farm_id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    polygon = Column(JSON, nullable=True)
    soil_type = Column(String, default="Clay Loam")
    crop = Column(String, default="Maize")
    area_ha = Column(Float, default=1.0)
    water_source = Column(String, default="Groundwater Drip")
    created_at = Column(DateTime, default=datetime.utcnow)

class Sensor(Base):
    __tablename__ = "sensors"

    sensor_id = Column(String, primary_key=True, index=True)
    farm_id = Column(String, ForeignKey("farms.farm_id"), nullable=False)
    type = Column(String, nullable=False)  # soil_moisture, temperature, humidity, rain_gauge
    unit = Column(String, nullable=False)
    calibration = Column(String, default="Factory Default")
    sampling_interval = Column(Integer, default=300)

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    sensor_id = Column(String, ForeignKey("sensors.sensor_id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    value = Column(Float, nullable=False)
    quality_flag = Column(String, default="GOOD")

class WeatherRecord(Base):
    __tablename__ = "weather_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    farm_id = Column(String, ForeignKey("farms.farm_id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    source = Column(String, default="open-meteo")
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    rainfall = Column(Float, nullable=True)
    wind_speed = Column(Float, nullable=True)
    et0 = Column(Float, nullable=True)

class SatelliteObservation(Base):
    __tablename__ = "satellite_observations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    farm_id = Column(String, ForeignKey("farms.farm_id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    source = Column(String, default="sentinel-2")
    cloud_cover = Column(Float, default=0.0)
    ndvi = Column(Float, default=0.76)
    ndre = Column(Float, default=0.68)
    bands = Column(JSON, nullable=True)

class SoilProfile(Base):
    __tablename__ = "soil_profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    farm_id = Column(String, ForeignKey("farms.farm_id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    source = Column(String, default="soilgrids")
    ph = Column(Float, default=6.8)
    organic_carbon = Column(Float, default=1.42)
    nitrogen = Column(Float, default=140.0)
    phosphorus = Column(Float, default=35.0)
    potassium = Column(Float, default=180.0)
    clay = Column(Float, default=32.0)
    sand = Column(Float, default=40.0)
    silt = Column(Float, default=28.0)
    cec = Column(Float, default=18.5)

class ImageRecord(Base):
    __tablename__ = "image_records"

    image_id = Column(String, primary_key=True, index=True)
    farm_id = Column(String, ForeignKey("farms.farm_id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    storage_uri = Column(String, nullable=False)

class InferenceRecord(Base):
    __tablename__ = "inference_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    image_id = Column(String, ForeignKey("image_records.image_id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    model_version = Column(String, default="YOLO26n-Agri")
    disease_class = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    bbox = Column(JSON, nullable=True)

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    farm_id = Column(String, ForeignKey("farms.farm_id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    type = Column(String, nullable=False)  # nutrient, irrigation, disease, weather
    severity = Column(String, default="INFO")
    action = Column(Text, nullable=False)
    evidence = Column(Text, nullable=True)
    model_version = Column(String, default="GLM-Agri-v2")
    confidence = Column(Float, default=0.95)
