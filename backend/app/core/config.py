import os
from functools import lru_cache
from typing import List


class Settings:
    """Centralized application settings loaded from environment variables."""

    # Server
    APP_NAME: str = os.getenv("APP_NAME", "舆情分析智能体")
    BACKEND_CORS_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
        if origin.strip()
    ]

    # Providers
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "deepseek")  # deepseek|ollama
    LLM_MODEL: str = os.getenv("LLM_MODEL", "deepseek-chat")

    # DeepSeek (OpenAI-compatible)
    DEEPSEEK_API_KEY: str = os.getenv("DEEPSEEK_API_KEY", "sk-853c28fa6b524928bf8dde917b7d7023")
    DEEPSEEK_BASE_URL: str = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")

    # Ollama
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.1:8b")

    # Exa
    EXA_API_KEY: str = os.getenv("EXA_API_KEY", "caaeff33-5a34-459c-8130-c048a9fc5e9d")
    # EXA_API_KEY: str = os.getenv("EXA_API_KEY", "")
    EXA_BASE_URL: str = os.getenv("EXA_BASE_URL", "https://api.exa.ai")


@lru_cache()
def get_settings() -> Settings:
    return Settings()
