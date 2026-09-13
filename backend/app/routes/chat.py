"""
Chat SSE Streaming Router
"""

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from app.models.chat import ChatStreamRequest
from app.services.ai_service import ai_service

router = APIRouter(prefix="/api/chat", tags=["Chat"])

@router.post(
    "/stream",
    summary="Stream AI Response Tokens (SSE)",
    response_description="Server-Sent Event stream containing response text deltas"
)
async def chat_stream_endpoint(request: ChatStreamRequest):
    """
    POST /api/chat/stream
    
    Receives conversation message history, validates input data,
    and returns a Server-Sent Events (SSE) stream yielding response tokens.
    """
    if not request.messages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request messages array cannot be empty."
        )

    # Stream response deltas from AI Service via StreamingResponse
    return StreamingResponse(
        ai_service.stream_chat_completion(
            messages=request.messages,
            model=request.model,
            provider=request.provider
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disables proxy buffering (e.g. Nginx)
        }
    )

