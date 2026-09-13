"""
Multi-Provider AI Service (Google Gemini + Groq)

Communicates with Google Gemini API using google-genai SDK
and Groq API using official groq Python SDK.
Handles system prompt injection, history truncation, provider routing,
timeout enforcement, error handling, and Server-Sent Event (SSE) streaming.
"""

import asyncio
import json
import logging
from typing import List, AsyncGenerator, Optional
from google import genai
from google.genai import types
from groq import AsyncGroq

from app.config import settings
from app.models.chat import ChatMessage

logger = logging.getLogger("uvicorn.error")

# Maximum number of conversation history messages passed to the model
MAX_HISTORY_MESSAGES = 30

# User-facing sanitized generic error message (never leak provider details)
GENERIC_ERROR_MESSAGE = "Sorry, I'm having trouble responding right now. Please try again."

# System instruction controlling NOVA persona, adaptiveness, and human-centric response quality
SYSTEM_INSTRUCTION = (
    "You are NOVA, an intelligent, versatile, and highly capable conversational AI assistant.\n\n"
    "## Core Philosophy & Persona\n"
    "- Communicate naturally, warmly, and directly, like a knowledgeable and thoughtful human collaborator.\n"
    "- Avoid robotic formulas: NEVER start with filler like 'Certainly!', 'Sure!', 'Here is an overview of...', "
    "or 'As an AI language model...'. Jump straight into the answer.\n"
    "- Avoid canned closings like 'I hope this helps! Let me know if you have further questions!'. Conclude naturally.\n\n"
    "## Adaptive Response Length & Depth (Crucial)\n"
    "Dynamically match your response depth to the scope and nuance of the question. Do NOT use a rigid, one-size-fits-all format:\n"
    "1. Simple / Introductory Questions (e.g., 'What is Earth?', 'What is Python?', 'Who was Galileo?'):\n"
    "   - Keep answers direct, accessible, and concise (1 to 3 short paragraphs or a few clean sentences).\n"
    "   - Focus on the intuitive core concept in plain English.\n"
    "   - DO NOT dump massive scientific tables, raw statistics, orbital measurements, or multi-heading outlines for simple concepts.\n"
    "   - If relevant (such as for a programming language), include a minimal, clean illustrative snippet (e.g., print(\"Hello, world!\")).\n"
    "2. Moderate Questions (e.g., 'How do airplanes fly?', 'Difference between let and const'):\n"
    "   - Provide a focused, clear explanation (2 to 4 paragraphs or a concise bullet list).\n"
    "   - Highlight the primary mechanisms or principles clearly without tangential minutiae.\n"
    "3. Complex / Deep-Dive Questions (e.g., architectural comparisons, comprehensive guides, nuanced analysis):\n"
    "   - Provide structured, in-depth explanations with clear headings, detailed breakdowns, and trade-offs.\n"
    "4. Technical & Code Questions:\n"
    "   - Provide clean, modern, idiomatic, working code.\n"
    "   - Explain key parts concisely. Avoid overwhelming simple code requests with excessive boilerplate or textbook theory unless asked.\n\n"
    "## Formatting Guidelines\n"
    "- Format naturally using Markdown (bold text, lists, code blocks) to make reading effortless.\n"
    "- Do NOT use tables unless presenting side-by-side comparisons or when the user explicitly requests tabular data.\n"
    "- Do NOT add unprompted 'TL;DR' or summary sections to short or moderate answers.\n"
    "- Use section headings (##, ###) only for genuinely multifaceted or long-form answers.\n\n"
    "## Context & Follow-ups\n"
    "- Maintain context awareness across the conversation.\n"
    "- If the user asks for more detail ('tell me more', 'deep dive'), expand with depth and enthusiasm.\n"
    "- If the user asks a quick follow-up, answer directly without resetting or re-explaining earlier points."
)


class AIService:
    """Service wrapping Google GenAI and Groq SDK interactions with SSE streaming."""

    def __init__(self):
        self._gemini_client = None
        self._groq_client = None

    def _get_gemini_client(self) -> genai.Client:
        """Lazily initialize Google GenAI client when key is configured."""
        if not self._gemini_client:
            self._gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
        return self._gemini_client

    def _get_groq_client(self) -> AsyncGroq:
        """Lazily initialize Groq Async client when key is configured."""
        if not self._groq_client:
            self._groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        return self._groq_client

    async def stream_groq(
        self,
        messages: List[ChatMessage],
        model: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """Stream response tokens using Groq API with sanitized error outputs."""
        logger.info("[AI] Groq request started")

        if settings.AI_TEST_BOTH_FAIL:
            logger.error("[AI] Simulating Groq failure (AI_TEST_BOTH_FAIL=true)")
            yield f"data: {json.dumps({'type': 'error', 'message': GENERIC_ERROR_MESSAGE})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            return

        if not settings.is_groq_configured:
            logger.warning("[AI] Groq API key is not configured.")
            yield f"data: {json.dumps({'type': 'error', 'message': GENERIC_ERROR_MESSAGE})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            return

        recent_messages = messages[-MAX_HISTORY_MESSAGES:]
        formatted_messages = [{"role": "system", "content": SYSTEM_INSTRUCTION}]
        for msg in recent_messages:
            role = "user" if msg.role == "user" else "assistant"
            formatted_messages.append({"role": role, "content": msg.content})

        target_model = model if (model and not "gemini" in model.lower()) else settings.GROQ_MODEL

        try:
            client = self._get_groq_client()
            logger.info(f"[AI] Groq streaming started with model {target_model}")

            response_stream = await asyncio.wait_for(
                client.chat.completions.create(
                    model=target_model,
                    messages=formatted_messages,
                    temperature=0.7,
                    stream=True,
                ),
                timeout=settings.AI_PROVIDER_TIMEOUT_SECONDS
            )

            async for chunk in response_stream:
                if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                    delta_text = chunk.choices[0].delta.content
                    sse_payload = json.dumps({"type": "text", "content": delta_text})
                    yield f"data: {sse_payload}\n\n"

            logger.info("[AI] Groq streaming completed successfully")
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except asyncio.CancelledError:
            logger.info("[AI] Groq stream cancelled by client stop.")
            raise
        except asyncio.TimeoutError:
            logger.error("[AI] Groq request timed out")
            error_payload = json.dumps({
                "type": "error",
                "message": GENERIC_ERROR_MESSAGE
            })
            yield f"data: {error_payload}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as err:
            logger.error(f"[AI] Groq API Error ({type(err).__name__}): {str(err)}")
            error_payload = json.dumps({
                "type": "error",
                "message": GENERIC_ERROR_MESSAGE
            })
            yield f"data: {error_payload}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

    async def stream_gemini(
        self,
        messages: List[ChatMessage],
        model: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """Stream response tokens using Google Gemini API with seamless silent fallback to Groq."""
        logger.info("[AI] Gemini request started")

        # Pre-stream test failure simulation
        if settings.AI_TEST_GEMINI_FAILURE:
            logger.warning("[AI] Gemini pre-stream test failure simulated (AI_TEST_GEMINI_FAILURE=true)")
            if settings.is_groq_configured and not settings.AI_TEST_BOTH_FAIL:
                logger.info("[AI] Falling back silently to Groq")
                async for event in self.stream_groq(messages, model):
                    yield event
                return
            else:
                logger.error("[AI] Gemini pre-stream failed and Groq fallback is unavailable.")
                yield f"data: {json.dumps({'type': 'error', 'message': GENERIC_ERROR_MESSAGE})}\n\n"
                yield f"data: {json.dumps({'type': 'done'})}\n\n"
                return

        if not settings.is_gemini_configured:
            logger.warning("[AI] Gemini API key is not configured.")
            if settings.is_groq_configured and not settings.AI_TEST_BOTH_FAIL:
                logger.info("[AI] Gemini not configured. Falling back silently to Groq.")
                async for event in self.stream_groq(messages, model):
                    yield event
                return
            yield f"data: {json.dumps({'type': 'error', 'message': GENERIC_ERROR_MESSAGE})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            return

        recent_messages = messages[-MAX_HISTORY_MESSAGES:]
        formatted_contents = []
        for msg in recent_messages:
            role = "user" if msg.role == "user" else "model"
            formatted_contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=msg.content)]
                )
            )

        target_model = model if (model and "gemini" in model.lower()) else settings.GEMINI_MODEL

        tokens_streamed = 0
        try:
            # Mid-stream test failure simulation
            if settings.AI_TEST_GEMINI_MIDSTREAM_FAILURE:
                logger.info("[AI] Simulating partial Gemini stream tokens before 503 failure...")
                tokens_streamed += 1
                yield f"data: {json.dumps({'type': 'text', 'content': 'Java is a popular, '})}\n\n"
                await asyncio.sleep(0.05)
                tokens_streamed += 1
                yield f"data: {json.dumps({'type': 'text', 'content': 'high-level programming language '})}\n\n"
                await asyncio.sleep(0.05)
                logger.warning("[AI] Simulating Gemini 503 UNAVAILABLE mid-stream error now.")
                raise Exception("503 UNAVAILABLE: The model is currently experiencing high demand. Please try again later.")

            client = self._get_gemini_client()
            config = types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.7,
            )

            # Enforce request creation timeout
            response_stream = await asyncio.wait_for(
                client.aio.models.generate_content_stream(
                    model=target_model,
                    contents=formatted_contents,
                    config=config,
                ),
                timeout=settings.AI_PROVIDER_TIMEOUT_SECONDS
            )

            # Iterate stream with per-token / chunk timeout
            stream_iterator = response_stream.__aiter__()
            while True:
                chunk = await asyncio.wait_for(
                    stream_iterator.__anext__(),
                    timeout=settings.AI_PROVIDER_TIMEOUT_SECONDS
                )
                if chunk.text:
                    tokens_streamed += 1
                    sse_payload = json.dumps({"type": "text", "content": chunk.text})
                    yield f"data: {sse_payload}\n\n"

        except StopAsyncIteration:
            # Normal stream completion
            logger.info(f"[AI] Gemini streaming completed successfully ({tokens_streamed} tokens).")
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            return
        except asyncio.CancelledError:
            logger.info("[AI] Gemini stream cancelled by client stop.")
            raise
        except (asyncio.TimeoutError, Exception) as err:
            logger.warning(
                f"[AI] Gemini failure ({type(err).__name__}: {str(err)}). "
                f"Tokens emitted prior to failure: {tokens_streamed}."
            )

            # Fall back to Groq if Groq is configured and not in both-fail test mode
            if settings.is_groq_configured and not settings.AI_TEST_BOTH_FAIL:
                if tokens_streamed > 0:
                    logger.info("[AI] Discarding partial Gemini response: Emitting reset SSE event to client.")
                    yield f"data: {json.dumps({'type': 'reset'})}\n\n"

                logger.info("[AI] Seamlessly transitioning to Groq fallback stream.")
                async for event in self.stream_groq(messages, model):
                    yield event
                return

            # Both providers failed or Groq not configured
            logger.error("[AI] Both providers unavailable or failed. Emitting sanitized error.")
            if tokens_streamed > 0:
                yield f"data: {json.dumps({'type': 'reset'})}\n\n"

            yield f"data: {json.dumps({'type': 'error', 'message': GENERIC_ERROR_MESSAGE})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            return

    async def stream_chat_completion(
        self,
        messages: List[ChatMessage],
        model: Optional[str] = None,
        provider: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """
        Asynchronously yields Server-Sent Event (SSE) data strings.
        Routes to requested provider or falls back seamlessly.

        Provider routing:
        - "auto" or None: Try Gemini first (if configured), fallback to Groq
        - "gemini": Use Gemini directly (with Groq fallback on failure)
        - "groq": Use Groq directly (no Gemini attempted)
        """
        if settings.AI_TEST_MODE:
            logger.info("[AI] AI_TEST_MODE=true: Returning diagnostic SSE test response.")
            yield f"data: {json.dumps({'type': 'text', 'content': 'Hello! The NOVA streaming connection is working.'})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            return

        effective_provider = (provider or "").lower().strip() or "auto"
        logger.info(f"[AI] Provider routing: provider={effective_provider}, model={model}")

        if effective_provider == "groq":
            # Direct Groq — no Gemini attempted
            async for event in self.stream_groq(messages, model):
                yield event
        elif effective_provider == "gemini":
            # Direct Gemini with Groq fallback on failure
            async for event in self.stream_gemini(messages, model):
                yield event
        else:
            # Auto mode: Gemini-first if configured, else immediate Groq
            async for event in self.stream_gemini(messages, model):
                yield event


# Export singleton AI service instance
ai_service = AIService()


