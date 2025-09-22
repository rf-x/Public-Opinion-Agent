from fastapi import APIRouter

from app.api.v1 import report, conversation, news, news_collection

router = APIRouter()

router.include_router(report.router, prefix="/v1", tags=["report"])
router.include_router(conversation.router, prefix="/v1", tags=["conversation"])
router.include_router(news.router, prefix="/v1", tags=["news"])
router.include_router(news_collection.router, prefix="/v1", tags=["news-collection"])
