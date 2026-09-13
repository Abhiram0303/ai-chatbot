"""
Health Check Router
"""

from datetime import datetime
from fastapi import APIRouter, status
from pydantic import BaseModel
from app.config import settings

router = APIRouter(tags=["System"])

class HealthResponse(BaseModel):
    status: str
    message: str
    gemini_configured: bool
    groq_configured: bool
    model: str
    groq_model: str
    timestamp: str

@router.get("/health", response_model=HealthResponse, status_code=status.HTTP_200_OK)
def get_health():
    """
    GET /health
    System health check verifying backend operational status, Gemini and Groq configuration.
    """
    return HealthResponse(
        status="healthy",
        message="FastAPI AI Chatbot backend (Gemini & Groq API) is up and running!",
        gemini_configured=settings.is_gemini_configured,
        groq_configured=settings.is_groq_configured,
        model=settings.GEMINI_MODEL,
        groq_model=settings.GROQ_MODEL,
        timestamp=datetime.utcnow().isoformat()
    )

