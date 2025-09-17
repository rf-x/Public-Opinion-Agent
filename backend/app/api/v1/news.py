from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import time

router = APIRouter()

# 静态示例数据：涵盖关键词/标题/话题/来源/情感/时间/事件分组
# 说明：
# - sourceType: main(主流媒体) / social(社交平台)
# - eventId: 用于事件聚合，前端可在 TopicAnalysis 页面按事件查看
STATIC_NEWS: List[Dict[str, Any]] = [
    {
        'id': 'n-1001',
        'title': '科技创新驱动数字经济发展',
        'content': '多部门联合发布支持政策，推动人工智能与实体经济深度融合。',
        'source': '新华社',
        'sourceType': 'main',
        'url': 'https://example.com/news/1001',
        'publishedAt': '2025-08-23T10:15:00',
        'category': '科技',
        'keywords': ['科技', '创新', '数字经济', '人工智能'],
        'topic': '科技创新',
        'sentiment': '正面',
        'region': '北京',
        'eventId': 'e-001',
    },
    {
        'id': 'n-1002',
        'title': '社交平台热议新能源车补贴调整',
        'content': '网友对补贴细则展开讨论，意见分化明显，引发广泛关注。',
        'source': '微博',
        'sourceType': 'social',
        'url': 'https://example.com/news/1002',
        'publishedAt': '2025-08-24T09:00:00',
        'category': '经济',
        'keywords': ['新能源', '补贴', '汽车', '政策'],
        'topic': '新能源汽车',
        'sentiment': '中性',
        'region': '上海',
        'eventId': 'e-002',
    },
    {
        'id': 'n-1003',
        'title': '关于科技创新的最新政策解读',
        'content': '专家称新政将优化资源配置，带动上下游产业链协同发展。',
        'source': '人民日报',
        'sourceType': 'main',
        'url': 'https://example.com/news/1003',
        'publishedAt': '2025-08-24T14:30:00',
        'category': '政策',
        'keywords': ['政策', '解读', '产业链', '创新'],
        'topic': '科技创新',
        'sentiment': '正面',
        'region': '北京',
        'eventId': 'e-001',
    },
    {
        'id': 'n-1004',
        'title': '环保行动升级：多地开展专项整治',
        'content': '生态环境部门强调持续加大执法力度，改善城市空气质量。',
        'source': '澎湃新闻',
        'sourceType': 'main',
        'url': 'https://example.com/news/1004',
        'publishedAt': '2025-08-20T08:20:00',
        'category': '环保',
        'keywords': ['环保', '整治', '空气质量'],
        'topic': '环保行动',
        'sentiment': '正面',
        'region': '广东',
        'eventId': 'e-003',
    },
    {
        'id': 'n-1005',
        'title': '国际合作受挫引发市场波动',
        'content': '分析称短期不确定性上升，需警惕外部风险传导。',
        'source': '新浪微博',
        'sourceType': 'social',
        'url': 'https://example.com/news/1005',
        'publishedAt': '2025-08-18T20:10:00',
        'category': '国际',
        'keywords': ['合作', '市场', '风险'],
        'topic': '国际合作',
        'sentiment': '负面',
        'region': '国际',
        'eventId': 'e-004',
    },
    {
        'id': 'n-1006',
        'title': '网民对环保行动成效表达担忧',
        'content': '部分地区治理效果未达预期，居民呼吁加大投入与透明度。',
        'source': '知乎',
        'sourceType': 'social',
        'url': 'https://example.com/news/1006',
        'publishedAt': '2025-08-21T11:05:00',
        'category': '环保',
        'keywords': ['环保', '治理', '公众参与'],
        'topic': '环保行动',
        'sentiment': '负面',
        'region': '浙江',
        'eventId': 'e-003',
    },
]

STATIC_CATEGORIES = sorted(list({n['category'] for n in STATIC_NEWS}))
STATIC_TOPICS = sorted(list({n.get('topic') for n in STATIC_NEWS if n.get('topic')}))
STATIC_SOURCES = sorted(list({n['source'] for n in STATIC_NEWS}))
STATIC_SENTIMENTS = ['正面', '负面', '中性']


@router.get("/news")
async def get_news_list():
    try:
        return {
            'news': STATIC_NEWS,
            'total': len(STATIC_NEWS),
            'categories': STATIC_CATEGORIES,
            'topics': STATIC_TOPICS,
            'sources': STATIC_SOURCES,
            'sentiments': STATIC_SENTIMENTS,
            'updateTime': time.strftime('%Y-%m-%d %H:%M:%S')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取新闻列表失败: {str(e)}")


@router.get("/events")
async def get_events_overview():
    """按事件分组聚合，供 TopicAnalysis 使用。"""
    try:
        events: Dict[str, Dict[str, Any]] = {}
        for n in STATIC_NEWS:
            event_id = n.get('eventId', 'unknown')
            if event_id not in events:
                events[event_id] = {
                    'eventId': event_id,
                    'topic': n.get('topic'),
                    'category': n.get('category'),
                    'firstSeen': n.get('publishedAt'),
                    'lastSeen': n.get('publishedAt'),
                    'count': 0,
                    'sentiments': {'正面': 0, '负面': 0, '中性': 0},
                    'sources': set(),
                }
            e = events[event_id]
            e['count'] += 1
            e['lastSeen'] = max(e['lastSeen'], n.get('publishedAt'))
            e['firstSeen'] = min(e['firstSeen'], n.get('publishedAt'))
            s = n.get('sentiment')
            if s in e['sentiments']:
                e['sentiments'][s] += 1
            e['sources'].add(n.get('source'))
        # 转换 set 为 list
        for ev in events.values():
            ev['sources'] = sorted(list(ev['sources']))
        return {'events': list(events.values())}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取事件聚合失败: {str(e)}")


@router.get("/search")
async def search_news(
    keyword: str = '',
    title: str = '',
    topic: str = '',
    source: str = '',
    sentiment: str = '',
    category: str = '',
    dateFrom: str = '',
    dateTo: str = ''
):
    try:
        def to_ts(date_str: str) -> int:
            try:
                if not date_str:
                    return 0
                # 输入为 yyyy-mm-dd，统一到 00:00:00
                return int(time.mktime(time.strptime(date_str + 'T00:00:00', '%Y-%m-%dT%H:%M:%S')))
            except Exception:
                return 0

        def news_ts(n: Dict[str, Any]) -> int:
            try:
                return int(time.mktime(time.strptime(n['publishedAt'], '%Y-%m-%dT%H:%M:%S')))
            except Exception:
                return 0

        df, dt = to_ts(dateFrom), to_ts(dateTo) if dateTo else 0

        results = []
        for n in STATIC_NEWS:
            if keyword:
                kw = keyword.lower()
                if kw not in n['title'].lower() and kw not in n['content'].lower() \
                   and not any(kw in k.lower() for k in n.get('keywords', [])):
                    continue
            if title and title.lower() not in n['title'].lower():
                continue
            if topic and topic != n.get('topic', ''):
                continue
            if source and source != n.get('source', ''):
                continue
            if sentiment and sentiment != n.get('sentiment', ''):
                continue
            if category and category != n.get('category', ''):
                continue
            if dateFrom and news_ts(n) < df:
                continue
            if dateTo and news_ts(n) > (int(time.mktime(time.strptime(dateTo + 'T23:59:59', '%Y-%m-%dT%H:%M:%S')))):
                continue
            results.append(n)

        return {
            'total': len(results),
            'news': results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"搜索新闻失败: {str(e)}")
