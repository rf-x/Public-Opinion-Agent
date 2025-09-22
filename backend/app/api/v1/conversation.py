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
    newsContext: Optional[dict] = None

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
        system_prompt = """你是一个数据分析专家。请基于用户的问题和对话历史，提供专业、准确的回答。"""
        
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
        
        # Add news context if provided
        news_context = ""
        if request.newsContext and request.newsContext.get("news"):
            news_data = request.newsContext["news"]
            news_context = f"\n\n相关新闻数据（共{len(news_data)}条）：\n"
            for i, news in enumerate(news_data, 1):  # 限制显示前10条新闻
                news_context += f"\n{i}. 标题：{news.get('title', '无标题')}\n"
                news_context += f"   来源：{news.get('source', '未知')}\n"
                news_context += f"   时间：{news.get('publishedAt', '未知')}\n"
                news_context += f"   作者：{news.get('author', '')}\n"
                news_context += f"   内容：{news.get('content', '')}\n"
                news_context += f"   链接：{news.get('url', '')}\n"
                    
        
        user_prompt = f"""对话历史：
{conversation_text}

相关参考信息：
{search_context}{news_context}

用户当前问题：{request.message}"""
        print(user_prompt)

        # Get AI response with better error handling
        try:
            response = await llm.complete(
                system_message=system_prompt,
                user_message=user_prompt
            )
        except Exception as e:
            error_msg = str(e)
            print(f"LLM API调用失败: {error_msg}")
            
            # 根据错误类型提供更友好的错误信息
            if "401" in error_msg or "API密钥" in error_msg:
                raise HTTPException(status_code=500, detail="API密钥配置错误，请联系管理员检查DeepSeek API密钥设置")
            elif "400" in error_msg:
                raise HTTPException(status_code=500, detail="请求参数错误，可能是模型名称不正确或请求格式有问题")
            elif "429" in error_msg:
                raise HTTPException(status_code=500, detail="API调用频率过高，请稍后重试")
            else:
                raise HTTPException(status_code=500, detail=f"AI服务暂时不可用: {error_msg}")

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
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"对话处理失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"对话处理失败: {str(e)}")

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
