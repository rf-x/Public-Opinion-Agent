#!/usr/bin/env python3
"""
测试DeepSeek API连接和配置
"""
import asyncio
import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import get_settings
from app.providers.deepseek_provider import DeepSeekProvider

async def test_deepseek_api():
    """测试DeepSeek API连接"""
    print("=== DeepSeek API 连接测试 ===")
    
    settings = get_settings()
    print(f"API Base URL: {settings.DEEPSEEK_BASE_URL}")
    print(f"Model: {settings.LLM_MODEL}")
    print(f"API Key: {settings.DEEPSEEK_API_KEY[:10]}...")
    
    provider = DeepSeekProvider(model=settings.LLM_MODEL)
    
    try:
        print("\n发送测试请求...")
        response = await provider.complete(
            system_message="你是一个有用的助手。",
            user_message="请简单介绍一下你自己。"
        )
        print(f"✅ API调用成功!")
        print(f"响应: {response}")
        return True
        
    except Exception as e:
        print(f"❌ API调用失败: {str(e)}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_deepseek_api())
    if not success:
        print("\n建议检查:")
        print("1. DEEPSEEK_API_KEY 是否正确")
        print("2. 网络连接是否正常")
        print("3. DeepSeek API服务是否可用")
        sys.exit(1)
    else:
        print("\n✅ DeepSeek API配置正常!")
