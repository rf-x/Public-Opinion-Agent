import aiohttp

from app.core.config import get_settings
from app.providers.llm_provider import LLMProvider


class OllamaProvider(LLMProvider):
    def __init__(self, model: str):
        self.model = model
        self.settings = get_settings()

    async def complete(self, system_message: str, user_message: str) -> str:
        # Ollama generate API
        url = f"{self.settings.OLLAMA_BASE_URL}/api/chat"
        headers = {"Content-Type": "application/json"}
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message},
            ],
            "stream": False,
        }
        connector = aiohttp.TCPConnector(ssl=False)
        async with aiohttp.ClientSession(connector=connector) as session:
            async with session.post(url, json=payload, headers=headers) as resp:
                resp.raise_for_status()
                data = await resp.json()
                # Some Ollama responses use 'message' at root, some mimic OpenAI
                if isinstance(data, dict) and data.get("message"):
                    return data["message"].get("content", "")
                if isinstance(data, dict) and data.get("choices"):
                    return data["choices"][0]["message"]["content"]
                return ""  # fallback
