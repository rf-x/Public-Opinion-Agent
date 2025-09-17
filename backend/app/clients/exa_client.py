import aiohttp
from typing import Tuple, List

from app.core.config import get_settings


class ExaClient:
    """Thin async client for Exa Answer API."""

    def __init__(self):
        self.settings = get_settings()

    async def answer_question(self, query: str) -> Tuple[str, List[str]]:
        if not self.settings.EXA_API_KEY:
            # No key provided, return empty answer
            return "", []
        url = f"{self.settings.EXA_BASE_URL}/answer"
        headers = {
            "Authorization": f"Bearer {self.settings.EXA_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "query": query,
            "max_results": 8,
            "include_sources": True,
        }
        connector = aiohttp.TCPConnector(ssl=False)
        async with aiohttp.ClientSession(connector=connector) as session:
            async with session.post(url, json=payload, headers=headers) as resp:
                resp.raise_for_status()
                data = await resp.json()
                answer = data.get("answer") or data.get("summary") or ""
                sources = []
                for src in data.get("sources", []) or data.get("citations", []) or []:
                    link = src.get("url") or src.get("source_url") or src.get("link")
                    if link:
                        sources.append(link)
                return answer, sources
