import aiohttp
from typing import Optional
import ssl
from app.core.config import get_settings
from app.providers.llm_provider import LLMProvider


class DeepSeekProvider(LLMProvider):
    def __init__(self, model: str):
        self.model = model
        self.settings = get_settings()

    async def complete(self, system_message: str, user_message: str) -> str:
        # DeepSeek OpenAI-compatible Chat Completions API
        url = f"{self.settings.DEEPSEEK_BASE_URL}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.settings.DEEPSEEK_API_KEY}",
            "Content-Type": "application/json",
        }
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
                return data["choices"][0]["message"]["content"]


if __name__ == "__main__":
    import asyncio

    async def _main():
        settings = get_settings()
        provider = DeepSeekProvider(model=settings.LLM_MODEL)
        try:
            resp = await provider.complete(
                system_message="You are a helpful assistant.",
                user_message="用一句话自我介绍，并说今天的日期（若不确定可说明不确定）。"
            )
            print("DeepSeek response:\n", resp)
        except Exception as e:
            print("Error:", e)

    asyncio.run(_main())
