#!/usr/bin/env python3
"""
Exa API 使用示例
简单的新闻搜索示例
"""

import asyncio
import json
from datetime import datetime, timedelta
from test_exa_news_search import ExaNewsSearcher


async def search_ai_news():
    """搜索AI相关新闻示例"""
    
    searcher = ExaNewsSearcher()
    
    # 搜索参数
    query = "人工智能 机器学习 最新发展"
    start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%dT00:00:00.000Z")
    end_date = datetime.now().strftime("%Y-%m-%dT23:59:59.999Z")
    
    print(f"搜索关键词: {query}")
    print(f"时间范围: 最近7天")
    print("-" * 50)
    
    try:
        # 执行搜索
        results = await searcher.search_news(
            query=query,
            start_date=start_date,
            end_date=end_date,
            num_results=5,
            category="news"
        )
        
        # 显示结果
        news_items = results.get("results", [])
        print(f"找到 {len(news_items)} 条相关新闻:\n")
        
        for i, item in enumerate(news_items, 1):
            print(f"{i}. {item.get('title', '无标题')}")
            print(f"   URL: {item.get('url', '无链接')}")
            print(f"   发布时间: {item.get('publishedDate', '未知')}")
            print(f"   摘要: {item.get('summary', '无摘要')[:150]}...")
            print()
        
        # 保存结果
        filename = f"ai_news_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        searcher.save_results(results, filename)
        
        return results
        
    except Exception as e:
        print(f"搜索失败: {str(e)}")
        return None


async def search_research_papers():
    """搜索研究论文示例"""
    
    searcher = ExaNewsSearcher()
    
    # 搜索参数
    query = "large language models transformer architecture"
    start_date = "2024-01-01T00:00:00.000Z"
    end_date = "2024-12-31T23:59:59.999Z"
    
    print(f"搜索关键词: {query}")
    print(f"时间范围: 2024年全年")
    print("-" * 50)
    
    try:
        # 执行搜索
        results = await searcher.search_news(
            query=query,
            start_date=start_date,
            end_date=end_date,
            num_results=3,
            category="research paper"  # 专门搜索研究论文
        )
        
        # 显示结果
        papers = results.get("results", [])
        print(f"找到 {len(papers)} 篇相关论文:\n")
        
        for i, paper in enumerate(papers, 1):
            print(f"{i}. {paper.get('title', '无标题')}")
            print(f"   作者: {paper.get('author', '未知')}")
            print(f"   URL: {paper.get('url', '无链接')}")
            print(f"   发布时间: {paper.get('publishedDate', '未知')}")
            print(f"   摘要: {paper.get('summary', '无摘要')[:200]}...")
            print()
        
        # 保存结果
        filename = f"research_papers_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        searcher.save_results(results, filename)
        
        return results
        
    except Exception as e:
        print(f"搜索失败: {str(e)}")
        return None


if __name__ == "__main__":
    print("Exa API 使用示例")
    print("=" * 60)
    
    # 运行示例
    asyncio.run(search_ai_news())
    print("\n" + "=" * 60)
    asyncio.run(search_research_papers())
