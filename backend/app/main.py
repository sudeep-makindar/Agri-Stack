import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import engine, Base
from backend.app.api.v1.router import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("agri_backend")

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Centralized Python FastAPI Backend & Intelligence Layer for Agri-Resource & Climate Intelligence Stack.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for React/PWA frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "title": settings.PROJECT_NAME,
        "status": "ONLINE",
        "version": "1.0.0",
        "docs": "/docs",
        "copernicus_auth": "CONFIGURED",
        "apis": {
            "farms": f"{settings.API_V1_STR}/farms",
            "soil": f"{settings.API_V1_STR}/soil",
            "weather": f"{settings.API_V1_STR}/weather",
            "irrigation": f"{settings.API_V1_STR}/irrigation",
            "advisory": f"{settings.API_V1_STR}/advisory/chat"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
