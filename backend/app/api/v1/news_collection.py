from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
import json
import time
import uuid
import asyncio
import aiohttp
from datetime import datetime

from app.core.config import get_settings

router = APIRouter()

# 新闻收集存储目录
NEWS_COLLECTIONS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models", "news_collections")

def _ensure_news_collections_dir():
    os.makedirs(NEWS_COLLECTIONS_DIR, exist_ok=True)

class NewsCollectionRequest(BaseModel):
    topic: str
    keywords: str
    startDate: str
    endDate: str
    maxResults: Optional[int] = 20

class NewsCollectionResponse(BaseModel):
    collectionId: str
    news: List[dict]
    total: int

class NewsItem(BaseModel):
    id: str
    title: str
    content: str
    source: str
    url: str
    publishedAt: str
    author: Optional[str] = None
    summary: Optional[str] = None
    keywords: Optional[List[str]] = None
    topic: Optional[str] = None
    sentiment: Optional[str] = None

def _save_news_collection(collection_id: str, topic: str, keywords: str, start_date: str, end_date: str, news: List[dict]):
    """保存新闻收集到文件"""
    _ensure_news_collections_dir()
    obj = {
        "id": collection_id,
        "topic": topic,
        "keywords": keywords,
        "startDate": start_date,
        "endDate": end_date,
        "news": news,
        "createdAt": int(time.time() * 1000),
        "totalNews": len(news)
    }
    path = os.path.join(NEWS_COLLECTIONS_DIR, f"{collection_id}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False)

def _find_existing_collection_by_topic(topic: str):
    """根据话题查找现有的新闻收集"""
    _ensure_news_collections_dir()
    for name in os.listdir(NEWS_COLLECTIONS_DIR):
        if not name.endswith('.json'):
            continue
        path = os.path.join(NEWS_COLLECTIONS_DIR, name)
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if data.get("topic") == topic:
                    return data
        except Exception:
            continue
    return None

def _merge_news_collections(existing_collection: dict, new_news: List[dict], new_keywords: str, new_start_date: str, new_end_date: str):
    """合并新闻收集"""
    # 合并关键词
    existing_keywords = existing_collection.get("keywords", "").split(",")
    new_keywords_list = new_keywords.split(",")
    all_keywords = list(set([kw.strip() for kw in existing_keywords + new_keywords_list if kw.strip()]))
    merged_keywords = ",".join(all_keywords)
    
    # 合并新闻，去重（基于URL）
    existing_news = existing_collection.get("news", [])
    existing_urls = {news_item.get("url") for news_item in existing_news}
    
    merged_news = existing_news.copy()
    for news_item in new_news:
        if news_item.get("url") not in existing_urls:
            merged_news.append(news_item)
    
    # 更新日期范围
    existing_start = existing_collection.get("startDate", "")
    existing_end = existing_collection.get("endDate", "")
    
    # 取最早的开始时间和最晚的结束时间
    merged_start_date = min(existing_start, new_start_date) if existing_start and new_start_date else (existing_start or new_start_date)
    merged_end_date = max(existing_end, new_end_date) if existing_end and new_end_date else (existing_end or new_end_date)
    
    # 更新收集信息
    updated_collection = {
        **existing_collection,
        "keywords": merged_keywords,
        "startDate": merged_start_date,
        "endDate": merged_end_date,
        "news": merged_news,
        "totalNews": len(merged_news),
        "lastUpdated": int(time.time() * 1000)
    }
    
    return updated_collection

def _list_news_collections():
    """列出所有新闻收集"""
    _ensure_news_collections_dir()
    items = []
    for name in os.listdir(NEWS_COLLECTIONS_DIR):
        if not name.endswith('.json'):
            continue
        path = os.path.join(NEWS_COLLECTIONS_DIR, name)
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                items.append({
                    "id": data.get("id"),
                    "topic": data.get("topic"),
                    "keywords": data.get("keywords"),
                    "startDate": data.get("startDate"),
                    "endDate": data.get("endDate"),
                    "news": data.get("news", []),
                    "createdAt": data.get("createdAt"),
                    "totalNews": data.get("totalNews", len(data.get("news", [])))
                })
        except Exception:
            continue
    items.sort(key=lambda x: x.get("createdAt") or 0, reverse=True)
    return items

def _get_news_collection(collection_id: str):
    """获取单个新闻收集"""
    _ensure_news_collections_dir()
    path = os.path.join(NEWS_COLLECTIONS_DIR, f"{collection_id}.json")
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def _delete_news_collection(collection_id: str) -> bool:
    """删除新闻收集"""
    _ensure_news_collections_dir()
    path = os.path.join(NEWS_COLLECTIONS_DIR, f"{collection_id}.json")
    if os.path.exists(path):
        os.remove(path)
        return True
    return False

async def _collect_news_from_exa(topic: str, keywords: str, start_date: str, end_date: str, max_results: int = 20) -> List[dict]:
    """使用Exa API收集新闻"""
    settings = get_settings()
    
    if not settings.EXA_API_KEY:
        # 如果没有API密钥，返回模拟数据
        return _generate_mock_news(topic, keywords, start_date, end_date)
    
    base_url = "https://api.exa.ai"
    headers = {
        "x-api-key": settings.EXA_API_KEY,
        "Content-Type": "application/json"
    }
    
    # 构建搜索查询
    query = f"{topic} {keywords}"
    
    # 转换日期格式
    start_date_iso = f"{start_date}T00:00:00.000Z"
    end_date_iso = f"{end_date}T23:59:59.999Z"
    
    payload = {
        "query": query,
        "type": "auto",
        "category": "news",
        "numResults": max_results,
        "text": True,
        "startPublishedDate": start_date_iso,
        "endPublishedDate": end_date_iso,
        "userLocation":"cn",
        "contents": {
            "text": True,
            "summary": True,
            "highlights": True
        }
    }
    
    try:
        connector = aiohttp.TCPConnector(ssl=False)
        async with aiohttp.ClientSession(connector=connector) as session:
            async with session.post(f"{base_url}/search", json=payload, headers=headers) as resp:
                resp.raise_for_status()
                data = await resp.json()
                
                news_items = []
                for result in data.get("results", []):
                    news_item = {
                        "id": str(uuid.uuid4()),
                        "title": result.get("title", ""),
                        "content": result.get("text", ""),
                        "source": result.get("url", "").split("/")[2] if result.get("url") else "未知来源",
                        "url": result.get("url", ""),
                        "publishedAt": result.get("publishedDate", ""),
                        "author": result.get("author", ""),
                        "summary": result.get("summary", ""),
                        "keywords": keywords.split(",") if keywords else [],
                        "topic": topic,
                        "sentiment": _analyze_sentiment(result.get("text", ""))
                    }
                    news_items.append(news_item)
                
                return news_items
                
    except Exception as e:
        print(f"Exa API调用失败: {str(e)}")
        # 如果API调用失败，返回模拟数据
        return _generate_mock_news(topic, keywords, start_date, end_date)

def _generate_mock_news(topic: str, keywords: str, start_date: str, end_date: str) -> List[dict]:
    """生成模拟新闻数据"""
    mock_news = [
        {
            "id": str(uuid.uuid4()),
            "title": f"{topic}相关重要进展",
            "content": f"关于{topic}的最新发展情况，涉及{keywords}等多个方面。",
            "source": "新华社",
            "url": "https://example.com/news/1",
            "publishedAt": f"{start_date}T10:00:00Z",
            "author": "记者",
            "summary": f"本文报道了{topic}领域的最新动态。",
            "keywords": keywords.split(",") if keywords else [],
            "topic": topic,
            "sentiment": "正面"
        },
        {
            "id": str(uuid.uuid4()),
            "title": f"{topic}市场分析报告",
            "content": f"专业机构发布{topic}市场分析，重点关注{keywords}等关键因素。",
            "source": "经济日报",
            "url": "https://example.com/news/2",
            "publishedAt": f"{start_date}T14:30:00Z",
            "author": "分析师",
            "summary": f"深度分析{topic}市场现状和未来趋势。",
            "keywords": keywords.split(",") if keywords else [],
            "topic": topic,
            "sentiment": "中性"
        },
        {
            "id": str(uuid.uuid4()),
            "title": f"{topic}技术突破",
            "content": f"在{topic}领域取得重大技术突破，特别是在{keywords}方面。",
            "source": "科技日报",
            "url": "https://example.com/news/3",
            "publishedAt": f"{end_date}T09:15:00Z",
            "author": "科技记者",
            "summary": f"报道{topic}领域的技术创新成果。",
            "keywords": keywords.split(",") if keywords else [],
            "topic": topic,
            "sentiment": "正面"
        }
    ]
    return mock_news

def _analyze_sentiment(text: str) -> str:
    """简单的情感分析"""
    positive_words = ["好", "优秀", "成功", "进步", "发展", "创新", "突破", "增长", "提升", "改善"]
    negative_words = ["问题", "困难", "挑战", "下降", "失败", "危机", "风险", "担忧", "批评", "争议"]
    
    text_lower = text.lower()
    positive_count = sum(1 for word in positive_words if word in text_lower)
    negative_count = sum(1 for word in negative_words if word in text_lower)
    
    if positive_count > negative_count:
        return "正面"
    elif negative_count > positive_count:
        return "负面"
    else:
        return "中性"

@router.post("/collect-news", response_model=NewsCollectionResponse)
async def collect_news(request: NewsCollectionRequest):
    """收集新闻"""
    try:
        # 使用Exa API收集新闻
        news_items = await _collect_news_from_exa(
            request.topic,
            request.keywords,
            request.startDate,
            request.endDate,
            request.maxResults or 20
        )
        
        # 检查是否存在相同话题的收集
        existing_collection = _find_existing_collection_by_topic(request.topic)
        
        if existing_collection:
            # 合并到现有收集
            merged_collection = _merge_news_collections(
                existing_collection,
                news_items,
                request.keywords,
                request.startDate,
                request.endDate
            )
            
            # 保存合并后的收集
            collection_id = existing_collection.get("id")
            path = os.path.join(NEWS_COLLECTIONS_DIR, f"{collection_id}.json")
            with open(path, "w", encoding="utf-8") as f:
                json.dump(merged_collection, f, ensure_ascii=False)
            
            return NewsCollectionResponse(
                collectionId=collection_id,
                news=merged_collection.get("news", []),
                total=merged_collection.get("totalNews", 0)
            )
        else:
            # 创建新的收集
            collection_id = str(uuid.uuid4())
            
            # 保存收集结果
            _save_news_collection(
                collection_id,
                request.topic,
                request.keywords,
                request.startDate,
                request.endDate,
                news_items
            )
            
            return NewsCollectionResponse(
                collectionId=collection_id,
                news=news_items,
                total=len(news_items)
            )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"收集新闻失败: {str(e)}")

@router.get("/news-collections")
async def list_news_collections():
    """列出所有新闻收集"""
    try:
        return _list_news_collections()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取收集列表失败: {str(e)}")

@router.get("/news-collections/{collection_id}")
async def get_news_collection(collection_id: str):
    """获取单个新闻收集"""
    collection = _get_news_collection(collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="新闻收集不存在")
    return collection

@router.delete("/news-collections/{collection_id}")
async def delete_news_collection(collection_id: str):
    """删除新闻收集"""
    success = _delete_news_collection(collection_id)
    if not success:
        raise HTTPException(status_code=404, detail="新闻收集不存在")
    return {"status": "deleted"}
