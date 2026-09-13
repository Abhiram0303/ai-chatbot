"""
Backend Configuration Module

Manages application environment variables and settings safely for Google Gemini API.
Never exposes or logs secret API keys.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file if present
load_dotenv()

class Settings:
    """Application settings loaded from environment variables."""
    
    # Google Gemini Settings
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash").strip()

    # Groq API Settings
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "").strip()
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b").strip()

    # AI Timeout & Testing Settings
    AI_PROVIDER_TIMEOUT_SECONDS: int = int(os.getenv("AI_PROVIDER_TIMEOUT_SECONDS", "15"))
    AI_TEST_GEMINI_FAILURE: bool = os.getenv("AI_TEST_GEMINI_FAILURE", "false").lower() == "true"
    AI_TEST_GEMINI_MIDSTREAM_FAILURE: bool = os.getenv("AI_TEST_GEMINI_MIDSTREAM_FAILURE", "false").lower() == "true"
    AI_TEST_BOTH_FAIL: bool = os.getenv("AI_TEST_BOTH_FAIL", "false").lower() == "true"
    AI_TEST_MODE: bool = os.getenv("AI_TEST_MODE", "false").lower() == "true"


    # Server & Security Settings

    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "127.0.0.1")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173").strip()

    @property
    def is_gemini_configured(self) -> bool:
        """Returns True if a valid non-empty Gemini API key is configured (not a placeholder)."""
        invalid_defaults = {"", "your_gemini_api_key_here", "your_openai_api_key_here"}
        if not self.GEMINI_API_KEY or self.GEMINI_API_KEY in invalid_defaults:
            return False
        # Accept any non-placeholder key; validation happens at API call time
        return True

    @property
    def is_groq_configured(self) -> bool:
        """Returns True if a valid non-empty Groq API key is configured."""
        invalid_defaults = {"", "your_groq_api_key_here"}
        return self.GROQ_API_KEY not in invalid_defaults


# Global singleton settings instance
settings = Settings()
