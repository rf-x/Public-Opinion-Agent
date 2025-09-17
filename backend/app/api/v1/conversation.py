from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
import json
import time
import uuid

from app.providers.llm_factory import get_llm_provider
from app.clients.exa_client import ExaClient

router = APIRouter()

# File-based conversation storage
CONVERSATIONS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models", "conversations")

def _ensure_conversations_dir():
    os.makedirs(CONVERSATIONS_DIR, exist_ok=True)

def _save_conversation(conv_id: str, title: str, messages: List[dict]):
    _ensure_conversations_dir()
    obj = {
        "id": conv_id,
        "title": title,
        "messages": messages,
        "createdAt": int(time.time() * 1000)
    }
    path = os.path.join(CONVERSATIONS_DIR, f"{conv_id}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False)

def _list_conversations():
    _ensure_conversations_dir()
    items = []
    for name in os.listdir(CONVERSATIONS_DIR):
        if not name.endswith('.json'):
            continue
        path = os.path.join(CONVERSATIONS_DIR, name)
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                items.append({
                    "id": data.get("id"),
                    "title": data.get("title"),
                    "createdAt": data.get("createdAt")
                })
        except Exception:
            continue
    items.sort(key=lambda x: x.get("createdAt") or 0, reverse=True)
    return items

def _get_conversation(conv_id: str):
    _ensure_conversations_dir()
    path = os.path.join(CONVERSATIONS_DIR, f"{conv_id}.json")
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def _delete_conversation(conv_id: str) -> bool:
    _ensure_conversations_dir()
    path = os.path.join(CONVERSATIONS_DIR, f"{conv_id}.json")
    if os.path.exists(path):
        os.remove(path)
        return True
    return False

class ChatRequest(BaseModel):
    conversationId: Optional[str] = None
    message: str
    history: List[dict]
    enableSearch: bool = False

class ChatResponse(BaseModel):
    response: str
    conversationId: str
    searchResults: Optional[List[str]] = None

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        llm = get_llm_provider()
        exa_client = ExaClient()
        
        # Build conversation context
        system_prompt = """你是一个专业的舆情分析专家。请基于用户的问题和对话历史，提供专业、准确的舆情分析和建议。
        
        回答要求：
        1. 保持专业性和客观性
        2. 提供具体的数据和事实支撑
        3. 给出实用的建议和解决方案
        4. 使用清晰的结构和逻辑
        5. 如果涉及敏感话题，保持谨慎和负责任的态度
        6. 如果提供了搜索结果，请基于搜索结果进行分析，并引用相关来源"""
        
        # Format conversation history
        conversation_text = ""
        for msg in request.history[-10:]:  # Keep last 10 messages for context
            role = "用户" if msg.get("role") == "user" else "助手"
            conversation_text += f"{role}: {msg.get('content', '')}\n"
        
        # Get search results if enabled
        search_results = []
        search_context = ""
        if request.enableSearch:
            try:
                search_answer, search_sources = await exa_client.answer_question(request.message)
                search_results = search_sources
                if search_answer:
                    search_context = f"\n\n搜索结果：\n{search_answer}\n\n相关来源：\n" + "\n".join([f"- {source}" for source in search_sources])
            except Exception as e:
                search_context = f"\n\n搜索时出现错误：{str(e)}"
        
        user_prompt = f"""对话历史：
{conversation_text}

用户当前问题：{request.message}{search_context}

请提供专业的舆情分析和建议："""

        # Get AI response
        response = await llm.complete(
            system_message=system_prompt,
            user_message=user_prompt
        )

        # Create or update conversation
        conv_id = request.conversationId or str(uuid.uuid4())
        title = request.message[:50] + "..." if len(request.message) > 50 else request.message
        
        # Add new messages to history
        assistant_message = {
            "role": "assistant", 
            "content": response, 
            "timestamp": int(time.time() * 1000)
        }
        # Add search results if they exist
        if search_results:
            assistant_message["searchResults"] = search_results
            
        new_messages = request.history + [
            {"role": "user", "content": request.message, "timestamp": int(time.time() * 1000)},
            assistant_message
        ]
        
        _save_conversation(conv_id, title, new_messages)
        
        return ChatResponse(
            response=response, 
            conversationId=conv_id,
            searchResults=search_results if request.enableSearch else None
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversations")
async def list_conversations():
    try:
        return _list_conversations()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversations/{conv_id}")
async def get_conversation(conv_id: str):
    conv = _get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv

@router.delete("/conversations/{conv_id}")
async def delete_conversation(conv_id: str):
    success = _delete_conversation(conv_id)
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"status": "deleted"}
