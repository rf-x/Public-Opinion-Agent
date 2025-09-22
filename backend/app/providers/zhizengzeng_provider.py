import aiohttp
from typing import Optional
import ssl
import json
from app.core.config import get_settings
from app.providers.llm_provider import LLMProvider


class ZhiZengZengProvider(LLMProvider):
    def __init__(self, model: str):
        self.model = model
        self.settings = get_settings()

    async def complete(self, system_message: str, user_message: str) -> str:
        # 智增增 OpenAI-compatible Chat Completions API
        url = f"{self.settings.ZHIZENGZENG_BASE_URL}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.settings.ZHIZENGZENG_API_KEY}",
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
        
        # 添加调试信息
        print(f"智增增 API Request:")
        print(f"URL: {url}")
        print(f"Model: {self.model}")
        print(f"API Key: {self.settings.ZHIZENGZENG_API_KEY[:10]}...")
        print(f"Payload: {json.dumps(payload, ensure_ascii=False, indent=2)}")
        
        connector = aiohttp.TCPConnector(ssl=False)
        async with aiohttp.ClientSession(connector=connector) as session:
            try:
                async with session.post(url, json=payload, headers=headers) as resp:
                    print(f"Response Status: {resp.status}")
                    response_text = await resp.text()
                    print(f"Response Text: {response_text}")
                    
                    if resp.status != 200:
                        error_detail = f"HTTP {resp.status}: {response_text}"
                        if resp.status == 400:
                            error_detail += f"\n请求参数可能有问题，请检查模型名称和API密钥是否正确"
                        elif resp.status == 401:
                            error_detail += f"\nAPI密钥无效，请检查ZHIZENGZENG_API_KEY配置"
                        elif resp.status == 429:
                            error_detail += f"\n请求频率过高，请稍后重试"
                        raise Exception(error_detail)
                    
                    data = json.loads(response_text)
                    if "choices" not in data or not data["choices"]:
                        raise Exception(f"API响应格式异常: {response_text}")
                    
                    return data["choices"][0]["message"]["content"]
                    
            except aiohttp.ClientError as e:
                raise Exception(f"网络请求失败: {str(e)}")
            except json.JSONDecodeError as e:
                raise Exception(f"响应解析失败: {str(e)}")
            except Exception as e:
                raise Exception(f"智增增 API调用失败: {str(e)}")


if __name__ == "__main__":
    import asyncio

    async def _main():
        settings = get_settings()
        provider = ZhiZengZengProvider(model=settings.ZHIZENGZENG_MODEL)
        try:
            resp = await provider.complete(
                system_message="你是一个有用的助手。",
                user_message="请简单介绍一下你自己。"
            )
            print("智增增 response:\n", resp)
        except Exception as e:
            print("Error:", e)

    asyncio.run(_main())
