from abc import ABC, abstractmethod


class LLMProvider(ABC):
    @abstractmethod
    async def complete(self, system_message: str, user_message: str) -> str:
        raise NotImplementedError
