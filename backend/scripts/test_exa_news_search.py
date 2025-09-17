#!/usr/bin/env python3
"""
Exa API 新闻搜索测试脚本
根据关键词和时间范围搜索新闻，获取内容并保存到models文件夹
"""

import asyncio
import aiohttp
import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any
from pathlib import Path

# 添加项目根目录到Python路径
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.config import get_settings


class ExaNewsSearcher:
    """Exa API 新闻搜索器"""
    
    def __init__(self):
        self.settings = get_settings()
        self.base_url = "https://api.exa.ai"
        self.headers = {
            "x-api-key": self.settings.EXA_API_KEY,
            "Content-Type": "application/json"
        }
        
    async def search_news(
        self, 
        query: str, 
        start_date: str = None, 
        end_date: str = None,
        num_results: int = 10,
        category: str = "news"
    ) -> Dict[str, Any]:
        """
        搜索新闻
        
        Args:
            query: 搜索关键词
            start_date: 开始日期 (ISO 8601格式，如 "2024-01-01T00:00:00.000Z")
            end_date: 结束日期 (ISO 8601格式，如 "2024-12-31T23:59:59.999Z")
            num_results: 返回结果数量
            category: 搜索类别 (news, research paper, company等)
        """
        url = f"{self.base_url}/search"
        
        payload = {
            "query": query,
            "type": "auto",  # 自动选择搜索类型
            "category": category,
            "numResults": min(num_results, 100),  # Exa限制最多100个结果
            "text": True,  # 获取文本内容
            "contents": {
                "text": True,
                "summary": True,
                "highlights": True,
                "context": True
            }
        }
        
        # 添加时间范围过滤
        if start_date:
            payload["startPublishedDate"] = start_date
        if end_date:
            payload["endPublishedDate"] = end_date
            
        print(f"搜索参数: {json.dumps(payload, indent=2, ensure_ascii=False)}")
        
        connector = aiohttp.TCPConnector(ssl=False)
        async with aiohttp.ClientSession(connector=connector) as session:
            async with session.post(url, json=payload, headers=self.headers) as resp:
                resp.raise_for_status()
                return await resp.json()
    
    async def get_content_details(self, url: str) -> Dict[str, Any]:
        """
        获取网页详细内容
        
        Args:
            url: 网页URL
        """
        content_url = f"{self.base_url}/contents"
        
        payload = {
            "urls": [url],
            "text": True,
            "summary": True,
            "highlights": True
        }
        
        connector = aiohttp.TCPConnector(ssl=False)
        async with aiohttp.ClientSession(connector=connector) as session:
            async with session.post(content_url, json=payload, headers=self.headers) as resp:
                resp.raise_for_status()
                return await resp.json()
    
    def save_results(self, results: Dict[str, Any], filename: str = None):
        """
        保存搜索结果到models文件夹
        
        Args:
            results: 搜索结果
            filename: 保存文件名，如果不指定则自动生成
        """
        # 确保models目录存在
        models_dir = Path(__file__).parent.parent / "app" / "models"
        models_dir.mkdir(exist_ok=True)
        
        # 生成文件名
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            query = results.get("results", [{}])[0].get("title", "search")[:20] if results.get("results") else "search"
            filename = f"exa_news_{query}_{timestamp}.json"
        
        filepath = models_dir / filename
        
        # 保存结果
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        print(f"搜索结果已保存到: {filepath}")
        return filepath


async def main():
    """主函数 - 执行新闻搜索测试"""
    
    # 检查API密钥
    settings = get_settings()
    if not settings.EXA_API_KEY:
        print("错误: 未设置EXA_API_KEY环境变量")
        return
    
    searcher = ExaNewsSearcher()
    
    # 测试参数
    test_queries = [
        "人工智能最新发展",
        "ChatGPT 4.0 发布",
        "机器学习研究进展"
    ]
    
    # 设置时间范围 (最近30天)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    
    start_date_str = start_date.strftime("%Y-%m-%dT00:00:00.000Z")
    end_date_str = end_date.strftime("%Y-%m-%dT23:59:59.999Z")
    
    print(f"搜索时间范围: {start_date_str} 到 {end_date_str}")
    print("=" * 60)
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n[{i}/{len(test_queries)}] 搜索关键词: {query}")
        print("-" * 40)
        
        try:
            # 执行搜索
            search_results = await searcher.search_news(
                query=query,
                start_date=start_date_str,
                end_date=end_date_str,
                num_results=5,  # 每个查询获取5个结果
                category="news"
            )
            
            # 显示搜索结果摘要
            results = search_results.get("results", [])
            print(f"找到 {len(results)} 条新闻:")
            
            for j, result in enumerate(results, 1):
                print(f"  {j}. {result.get('title', '无标题')}")
                print(f"     来源: {result.get('url', '无URL')}")
                print(f"     发布时间: {result.get('publishedDate', '未知')}")
                if result.get('summary'):
                    print(f"     摘要: {result['summary'][:100]}...")
                print()
            
            # 保存结果
            filename = f"exa_news_{query.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            searcher.save_results(search_results, filename)
            
            # 显示成本信息
            cost_info = search_results.get("costDollars", {})
            if cost_info:
                print(f"本次搜索成本: ${cost_info.get('total', 0):.4f}")
            
        except Exception as e:
            print(f"搜索失败: {str(e)}")
            continue
        
        # 避免请求过于频繁
        if i < len(test_queries):
            print("等待2秒后继续...")
            await asyncio.sleep(2)
    
    print("\n" + "=" * 60)
    print("所有搜索任务完成!")


async def test_single_search():
    """测试单个搜索"""
    searcher = ExaNewsSearcher()
    
    # 测试参数
    query = "宗庆后"
    start_date = "2025-01-01T00:00:00.000Z"
    end_date = "2025-12-31T23:59:59.999Z"
    
    print(f"测试搜索: {query}")
    print(f"时间范围: {start_date} 到 {end_date}")
    
    try:
        results = await searcher.search_news(
            query=query,
            start_date=start_date,
            end_date=end_date,
            num_results=10,
            category="news"
        )
        
        # 保存结果
        searcher.save_results(results, "test_single_search.json")
        
        # 显示结果
        for i, result in enumerate(results.get("results", []), 1):
            print(f"\n结果 {i}:")
            print(f"标题: {result.get('title')}")
            print(f"URL: {result.get('url')}")
            print(f"发布时间: {result.get('publishedDate')}")
            print(f"摘要: {result.get('summary', '无摘要')}")
            
    except Exception as e:
        print(f"搜索失败: {str(e)}")


if __name__ == "__main__":
    print("Exa API 新闻搜索测试")
    print("=" * 60)

    asyncio.run(test_single_search())
    
    # 选择运行模式
    # import sys
    # if len(sys.argv) > 1 and sys.argv[1] == "single":
    #     asyncio.run(test_single_search())
    # else:
    #     asyncio.run(main())
