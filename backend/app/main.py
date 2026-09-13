"""
FastAPI Application Entry Point - Stage 2 (OpenAI Streaming Core)

Integrates:
- Health check router (/health)
- Chat SSE stream router (/api/chat/stream)
- CORS Middleware configured with FRONTEND_URL
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes.health import router as health_router
from app.routes.chat import router as chat_router

app = FastAPI(
    title="AI Chatbot Backend API",
    description="Full-stack AI Chatbot backend with real-time SSE token streaming.",
    version="2.0.0"
)

# Configure CORS Middleware using FRONTEND_URL
origins = [
    settings.FRONTEND_URL,
    "https://nova-ai-eight-alpha.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

# De-duplicate origins list
origins = list(set(origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register routers
app.include_router(health_router)
app.include_router(chat_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
