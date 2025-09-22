from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import asyncio
from pydantic import BaseModel
from typing import List, Optional
from fastapi import Response
import os
import json
import time
import uuid

from app.services.report_service import ReportService


class GenerateReportRequest(BaseModel):
    topic: str
    outline: List[str]
    refinements: Optional[List[str]] = None
    model: Optional[str] = None
    provider: Optional[str] = None
    # 报告设置字段
    outlineType: Optional[str] = None
    causeReq: Optional[str] = None
    analysisReq: Optional[str] = None
    measuresReq: Optional[str] = None
    customOutlineSections: Optional[int] = None
    customOutlineTitles: Optional[List[str]] = None
    customOutlineReqs: Optional[List[str]] = None
    # 新闻上下文
    newsContext: Optional[dict] = None


class GenerateReportResponse(BaseModel):
    report_markdown: str
    sources: List[str]


router = APIRouter()


@router.post("/report", response_model=GenerateReportResponse)
async def generate_report(payload: GenerateReportRequest):
    try:
        service = ReportService(model=payload.model, provider=payload.provider)
        markdown, sources = await service.generate_report(
            topic=payload.topic,
            outline=payload.outline,
            refinements=payload.refinements or [],
            news_context=payload.newsContext,
        )
        return GenerateReportResponse(report_markdown=markdown, sources=sources)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/report/stream")
async def generate_report_stream(payload: GenerateReportRequest):
    async def event_stream():
        try:
            service = ReportService(model=payload.model, provider=payload.provider)
            markdown, sources = await service.generate_report(
                topic=payload.topic,
                outline=payload.outline,
                refinements=payload.refinements or [],
                news_context=payload.newsContext,
            )
            # Save to file-based history first
            item = _save_history(
                topic=payload.topic, 
                markdown=markdown, 
                sources=sources,
                outlineType=payload.outlineType,
                causeReq=payload.causeReq,
                analysisReq=payload.analysisReq,
                measuresReq=payload.measuresReq,
                customOutlineSections=payload.customOutlineSections,
                customOutlineTitles=payload.customOutlineTitles,
                customOutlineReqs=payload.customOutlineReqs
            )
            # Emit meta event
            yield ("{" + "\"type\":\"meta\",\"id\":" + json_escape(item["id"]) + ",\"createdAt\":" + str(item["createdAt"]) + "}" + "\n")
            # Pseudo-stream: emit markdown in chunks, then sources, then done
            chunk_size = 400
            for i in range(0, len(markdown), chunk_size):
                chunk = markdown[i : i + chunk_size]
                yield ("{" + "\"type\":\"chunk\",\"data\":" + json_escape(chunk) + "}" + "\n")
                await asyncio.sleep(0)  # yield control
            yield ("{" + "\"type\":\"sources\",\"sources\":" + json_array_escape(sources) + "}" + "\n")
            yield ("{\"type\":\"done\"}\n")
        except Exception as e:
            err = str(e).replace("\n", " ")
            yield ("{" + "\"type\":\"error\",\"message\":" + json_escape(err) + "}" + "\n")

    def json_escape(s: str) -> str:
        # minimal JSON string escaper
        return '"' + (
            s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\r", "\\r").replace("\n", "\\n")
        ) + '"'

    def json_array_escape(arr: List[str]) -> str:
        return "[" + ",".join([json_escape(x) for x in arr]) + "]"

    return StreamingResponse(event_stream(), media_type="application/x-ndjson")


# ---------------- History (file-based) ----------------

HISTORY_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models", "reports")

def _ensure_history_dir():
    os.makedirs(HISTORY_DIR, exist_ok=True)

def _save_history(topic: str, markdown: str, sources: List[str], **kwargs):
    _ensure_history_dir()
    now = int(time.time() * 1000)
    history_id = str(uuid.uuid4())
    obj = {
        "id": history_id,
        "topic": topic,
        "markdown": markdown,
        "sources": sources or [],
        "createdAt": now,
    }
    
    # 添加报告设置字段
    if kwargs.get('outlineType'):
        obj['outlineType'] = kwargs['outlineType']
    if kwargs.get('causeReq'):
        obj['causeReq'] = kwargs['causeReq']
    if kwargs.get('analysisReq'):
        obj['analysisReq'] = kwargs['analysisReq']
    if kwargs.get('measuresReq'):
        obj['measuresReq'] = kwargs['measuresReq']
    if kwargs.get('customOutlineSections'):
        obj['customOutlineSections'] = kwargs['customOutlineSections']
    if kwargs.get('customOutlineTitles'):
        obj['customOutlineTitles'] = kwargs['customOutlineTitles']
    if kwargs.get('customOutlineReqs'):
        obj['customOutlineReqs'] = kwargs['customOutlineReqs']

    path = os.path.join(HISTORY_DIR, f"{history_id}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False)
    return obj

def _list_history():
    _ensure_history_dir()
    items = []
    for name in os.listdir(HISTORY_DIR):
        if not name.endswith('.json'):
            continue
        path = os.path.join(HISTORY_DIR, name)
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                items.append({"id": data.get("id"), "topic": data.get("topic"), "createdAt": data.get("createdAt")})
        except Exception:
            continue
    items.sort(key=lambda x: x.get("createdAt") or 0, reverse=True)
    return items

def _get_history(history_id: str):
    _ensure_history_dir()
    path = os.path.join(HISTORY_DIR, f"{history_id}.json")
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def _delete_history(history_id: str) -> bool:
    _ensure_history_dir()
    path = os.path.join(HISTORY_DIR, f"{history_id}.json")
    if os.path.exists(path):
        os.remove(path)
        return True
    return False


@router.get("/history")
async def list_history():
    try:
        return _list_history()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{history_id}")
async def get_history(history_id: str):
    item = _get_history(history_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.delete("/history/{history_id}")
async def delete_history(history_id: str):
    ok = _delete_history(history_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Not found")
    return Response(status_code=204)
