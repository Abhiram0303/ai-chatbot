"""
Chat Request and Response Schemas
"""

from typing import List, Literal, Optional
from pydantic import BaseModel, Field, field_validator, model_validator

class ChatMessage(BaseModel):
    """
    Single chat message schema.
    Only 'user' and 'assistant' roles are permitted from the client.
    System/developer instructions are owned strictly by the backend.
    """
    role: Literal["user", "assistant"] = Field(
        ...,
        description="Role of the message sender (user or assistant)"
    )
    content: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="Text content of the message"
    )

    @field_validator("content")
    @classmethod
    def validate_content_not_empty(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Message content cannot be empty or blank.")
        return v


# Server-side allowlist for providers and models
ALLOWED_PROVIDERS = {"auto", "gemini", "groq"}
ALLOWED_MODELS = {
    "gemini": {"gemini-3.8-flash"},
    "groq": {"openai/gpt-oss-120b", "openai/gpt-oss-20b"},
}


class ChatStreamRequest(BaseModel):
    """
    Incoming chat stream request schema containing conversation history.
    """
    messages: List[ChatMessage] = Field(
        ...,
        min_items=1,
        description="Chronological list of conversation messages"
    )
    model: Optional[str] = Field(
        None,
        description="Optional model identifier (e.g., 'gemini-3.8-flash', 'openai/gpt-oss-120b')"
    )
    provider: Optional[str] = Field(
        None,
        description="Optional provider identifier ('auto', 'gemini', or 'groq')"
    )

    @model_validator(mode="after")
    def validate_provider_model(self):
        """Validate provider/model combinations against the server-side allowlist."""
        if self.provider is not None:
            if self.provider not in ALLOWED_PROVIDERS:
                raise ValueError(f"Invalid provider: '{self.provider}'. Allowed: {', '.join(sorted(ALLOWED_PROVIDERS))}")

            if self.provider == "auto":
                # Auto mode: model should be None (backend decides)
                self.model = None
            elif self.provider in ALLOWED_MODELS:
                if self.model is not None and self.model not in ALLOWED_MODELS[self.provider]:
                    allowed = ', '.join(sorted(ALLOWED_MODELS[self.provider]))
                    raise ValueError(f"Invalid model '{self.model}' for provider '{self.provider}'. Allowed: {allowed}")

        elif self.model is not None:
            # Model specified without provider — validate it exists in any provider's list
            valid = any(self.model in models for models in ALLOWED_MODELS.values())
            if not valid:
                raise ValueError(f"Invalid model: '{self.model}'")

        return self
