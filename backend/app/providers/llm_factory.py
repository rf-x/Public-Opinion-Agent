from typing import Optional

from app.core.config import get_settings
from app.providers.llm_provider import LLMProvider
from app.providers.deepseek_provider import DeepSeekProvider
from app.providers.ollama_provider import OllamaProvider
from app.providers.zhizengzeng_provider import ZhiZengZengProvider


def get_llm_provider(model_override: Optional[str] = None, provider_override: Optional[str] = None) -> LLMProvider:
    settings = get_settings()
    provider = (provider_override or settings.LLM_PROVIDER).lower()

    if provider == "ollama":
        return OllamaProvider(model=model_override or settings.OLLAMA_MODEL)
    elif provider == "zhizengzeng":
        return DeepSeekProvider(model=model_override or settings.LLM_MODEL)

    # default to deepseek
    return ZhiZengZengProvider(model=model_override or settings.ZHIZENGZENG_MODEL)
    
