import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  searchResults?: string[];
};

type ConversationHistory = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
};

type NewsCollection = {
  id: string;
  topic: string;
  keywords: string;
  startDate: string;
  endDate: string;
  news: any[];
  createdAt: number;
  totalNews: number;
};

export default function IntelligentChat() {
  // 设置页面标题
  useEffect(() => {
    document.title = "舆情分析智能体 - 智能对话";
  }, []);

  // 对话相关状态
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<ConversationHistory[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [enableSearch, setEnableSearch] = useState(false);
  const [hoveredConversation, setHoveredConversation] = useState<string | null>(
    null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 新闻收集相关状态
  const [newsCollections, setNewsCollections] = useState<NewsCollection[]>([]);
  const [selectedNewsCollection, setSelectedNewsCollection] = useState<
    string | null
  >(null);
  const [selectedNews, setSelectedNews] = useState<any[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadConversations();
    loadNewsCollections();
  }, []);

  // 当选择新闻收集时，加载对应的新闻数据
  useEffect(() => {
    if (selectedNewsCollection) {
      loadNewsCollection(selectedNewsCollection);
    } else {
      setSelectedNews([]);
    }
  }, [selectedNewsCollection]);

  async function loadConversations() {
    try {
      const res = await fetch("/api/v1/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data || []);
      }
    } catch (e) {
      console.error("加载对话历史失败:", e);
    }
  }

  async function loadNewsCollections() {
    try {
      const res = await fetch("/api/v1/news-collections");
      if (res.ok) {
        const data = await res.json();
        setNewsCollections(data || []);
      }
    } catch (e) {
      console.error("加载新闻收集列表失败:", e);
    }
  }

  async function loadNewsCollection(id: string) {
    try {
      const res = await fetch(`/api/v1/news-collections/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedNews(data.news || []);
      }
    } catch (e: any) {
      console.error("加载新闻收集失败:", e);
    }
  }

  async function loadConversation(id: string) {
    try {
      const res = await fetch(`/api/v1/conversations/${id}`);
      if (res.ok) {
        const conv: ConversationHistory = await res.json();
        setMessages(conv.messages || []);
        setCurrentConversationId(id);

        // 加载对话后滚动到顶部，确保第一个消息可见
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = 0;
          }
        }, 100);
      }
    } catch (e: any) {
      alert("加载失败: " + e.message);
    }
  }

  async function deleteConversation(id: string) {
    if (!confirm("确认删除该对话？")) return;
    try {
      const res = await fetch(`/api/v1/conversations/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (currentConversationId === id) {
          setCurrentConversationId(null);
          setMessages([]);
        }
        loadConversations();
      }
    } catch (e: any) {
      alert("删除失败: " + e.message);
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;

    // 检查是否选择了新闻收集
    if (!selectedNewsCollection || selectedNews.length === 0) {
      alert("请先选择一个新闻收集作为对话基础");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: currentConversationId,
          message: userMessage.content,
          history: messages,
          enableSearch: enableSearch,
          // 传递当前选择的新闻数据
          newsContext: {
            collectionId: selectedNewsCollection,
            news: selectedNews,
          },
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: Date.now(),
        searchResults: data.searchResults,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Update conversation ID if this is a new conversation
      if (data.conversationId && !currentConversationId) {
        setCurrentConversationId(data.conversationId);
        loadConversations();
      }
    } catch (e: any) {
      alert("发送失败: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  function startNewConversation() {
    setMessages([]);
    setCurrentConversationId(null);
    setInput("");
    setEnableSearch(false);
    setHoveredConversation(null);
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(280px, 40vw) 1fr",
        height: "92vh",
        width: "100%",
        color: "#1e293b",
        overflow: "hidden",
        paddingTop: "64px",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          borderRight: "1px solid #e2e8f0",
          padding: 20,
          overflowY: "auto",
          background: "white",
        }}
      >
        {/* 新对话按钮 */}
        <button
          onClick={startNewConversation}
          style={{
            background: "#10b981",
            color: "white",
            border: "none",
            padding: "12px 16px",
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            width: "100%",
            marginBottom: 16,
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#059669")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#10b981")}
        >
          ✨ 新对话
        </button>

        {/* 新闻收集选择 */}
        <div
          style={{
            fontWeight: 700,
            marginBottom: 16,
            fontSize: 16,
            color: "#1e293b",
          }}
        >
          📰 选择新闻基础
        </div>
        <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
          {newsCollections.length === 0 && (
            <div
              style={{
                color: "#64748b",
                fontSize: 14,
                textAlign: "center",
                padding: "20px 0",
              }}
            >
              暂无新闻收集
            </div>
          )}
          {newsCollections.map((collection) => (
            <button
              key={collection.id}
              onClick={() => setSelectedNewsCollection(collection.id)}
              style={{
                textAlign: "left",
                background:
                  selectedNewsCollection === collection.id
                    ? "#eff6ff"
                    : "transparent",
                color:
                  selectedNewsCollection === collection.id
                    ? "#1e40af"
                    : "#374151",
                border:
                  selectedNewsCollection === collection.id
                    ? "1px solid #3b82f6"
                    : "1px solid #e5e7eb",
                borderRadius: 10,
                padding: 12,
                width: "100%",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  marginBottom: 4,
                }}
              >
                {collection.topic}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {collection.totalNews || collection.news.length} 条新闻
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {new Date(collection.createdAt).toLocaleString()}
              </div>
            </button>
          ))}
        </div>

        {/* 对话历史 */}
        <div
          style={{
            fontWeight: 700,
            marginBottom: 16,
            fontSize: 16,
            color: "#1e293b",
          }}
        >
          💬 对话历史
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {conversations.length === 0 && (
            <div
              style={{
                color: "#64748b",
                fontSize: 14,
                textAlign: "center",
                padding: "20px 0",
              }}
            >
              暂无对话
            </div>
          )}
          {conversations.map((conv) => (
            <div
              key={conv.id}
              style={{ position: "relative" }}
              onMouseEnter={() => setHoveredConversation(conv.id)}
              onMouseLeave={() => setHoveredConversation(null)}
            >
              <button
                onClick={() => loadConversation(conv.id)}
                style={{
                  textAlign: "left",
                  background:
                    currentConversationId === conv.id
                      ? "#eff6ff"
                      : "transparent",
                  color:
                    currentConversationId === conv.id ? "#1e40af" : "#374151",
                  border:
                    currentConversationId === conv.id
                      ? "1px solid #3b82f6"
                      : "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: 12,
                  width: "100%",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (currentConversationId !== conv.id) {
                    e.currentTarget.style.background = "#f8fafc";
                    e.currentTarget.style.borderColor = "#d1d5db";
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentConversationId !== conv.id) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "#e5e7eb";
                  }
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    marginBottom: 4,
                  }}
                >
                  {conv.title}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  {new Date(conv.createdAt).toLocaleString()}
                </div>
              </button>
              <button
                onClick={() => deleteConversation(conv.id)}
                title="删除"
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 8px",
                  fontSize: 11,
                  cursor: "pointer",
                  opacity: hoveredConversation === conv.id ? 1 : 0,
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#dc2626")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#ef4444")
                }
              >
                删除
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main
        style={{
          display: "grid",
          gridTemplateRows: "1fr auto",
          height: "100%",
          overflow: "hidden",
          background: "white",
        }}
      >
        {/* Messages */}
        <div
          ref={messagesContainerRef}
          style={{
            padding: "24px 20px 20px 20px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 20,
            background: "#f8fafc",
            minHeight: "calc(100vh - 200px)",
            flex: 1,
          }}
        >
          {messages.length === 0 && (
            <div
              style={{
                textAlign: "center",
                color: "#64748b",
                padding: "120px 20px",
                fontSize: 16,
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div style={{ marginBottom: 20, fontSize: 48 }}>🤖</div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: "#374151",
                }}
              >
                智能舆情分析对话
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "#6b7280",
                  textAlign: "center",
                  maxWidth: 400,
                }}
              >
                请先在左侧选择一个新闻收集作为对话基础，然后开始您的舆情分析咨询
              </div>
              {selectedNewsCollection && selectedNews.length > 0 && (
                <div
                  style={{
                    fontSize: 14,
                    color: "#10b981",
                    marginTop: 16,
                    padding: "8px 16px",
                    background: "#f0fdf4",
                    borderRadius: 8,
                    border: "1px solid #bbf7d0",
                  }}
                >
                  ✅ 已选择新闻基础：
                  {
                    newsCollections.find((c) => c.id === selectedNewsCollection)
                      ?.topic
                  }{" "}
                  ({selectedNews.length} 条新闻)
                </div>
              )}
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={message.id}
              style={{
                display: "flex",
                justifyContent:
                  message.role === "user" ? "flex-end" : "flex-start",
                marginBottom: 8,
                marginTop: index === 0 ? 8 : 0,
              }}
            >
              <div
                style={{
                  maxWidth: "75%",
                  padding: "16px 20px",
                  borderRadius: 16,
                  background: message.role === "user" ? "#3b82f6" : "white",
                  color: message.role === "user" ? "white" : "#374151",
                  border:
                    message.role === "user" ? "none" : "1px solid #e5e7eb",
                  boxShadow:
                    message.role === "user"
                      ? "0 2px 8px rgba(59, 130, 246, 0.3)"
                      : "0 2px 8px rgba(0, 0, 0, 0.1)",
                  lineHeight: 1.6,
                }}
              >
                {message.role === "assistant" ? (
                  <div style={{ fontSize: 14 }}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => (
                          <h1
                            style={{
                              fontSize: "1.5em",
                              fontWeight: 700,
                              margin: "0 0 16px 0",
                              color: "#1e293b",
                            }}
                          >
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2
                            style={{
                              fontSize: "1.3em",
                              fontWeight: 600,
                              margin: "16px 0 12px 0",
                              color: "#1e293b",
                            }}
                          >
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3
                            style={{
                              fontSize: "1.1em",
                              fontWeight: 600,
                              margin: "12px 0 8px 0",
                              color: "#1e293b",
                            }}
                          >
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p style={{ margin: "0 0 12px 0", lineHeight: 1.6 }}>
                            {children}
                          </p>
                        ),
                        ul: ({ children }) => (
                          <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol style={{ margin: "8px 0", paddingLeft: "20px" }}>
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li style={{ margin: "4px 0", lineHeight: 1.5 }}>
                            {children}
                          </li>
                        ),
                        strong: ({ children }) => (
                          <strong style={{ fontWeight: 600, color: "#1e293b" }}>
                            {children}
                          </strong>
                        ),
                        em: ({ children }) => (
                          <em style={{ fontStyle: "italic" }}>{children}</em>
                        ),
                        code: ({ children }) => (
                          <code
                            style={{
                              background: "#f1f5f9",
                              padding: "2px 6px",
                              borderRadius: 4,
                              fontSize: "0.9em",
                              fontFamily: "monospace",
                            }}
                          >
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre
                            style={{
                              background: "#f8fafc",
                              padding: "12px",
                              borderRadius: 8,
                              overflow: "auto",
                              fontSize: "0.9em",
                              border: "1px solid #e2e8f0",
                            }}
                          >
                            {children}
                          </pre>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote
                            style={{
                              borderLeft: "4px solid #3b82f6",
                              paddingLeft: "16px",
                              margin: "12px 0",
                              color: "#64748b",
                              fontStyle: "italic",
                            }}
                          >
                            {children}
                          </blockquote>
                        ),
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#3b82f6", textDecoration: "none" }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.textDecoration =
                                "underline")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.textDecoration = "none")
                            }
                          >
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div style={{ whiteSpace: "pre-wrap" }}>
                    {message.content}
                  </div>
                )}
                {message.role === "assistant" &&
                  message.searchResults &&
                  message.searchResults.length > 0 && (
                    <div
                      style={{
                        marginTop: 16,
                        paddingTop: 16,
                        borderTop: "1px solid #e5e7eb",
                        fontSize: 12,
                        color: "#6b7280",
                      }}
                    >
                      <div
                        style={{
                          marginBottom: 8,
                          fontWeight: 600,
                          color: "#374151",
                        }}
                      >
                        🔍 搜索结果来源：
                      </div>
                      {message.searchResults.map((source, index) => (
                        <div key={index} style={{ marginBottom: 4 }}>
                          <a
                            href={source}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#3b82f6",
                              textDecoration: "none",
                              wordBreak: "break-all",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.textDecoration =
                                "underline")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.textDecoration = "none")
                            }
                          >
                            {source}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div
                style={{
                  padding: "16px 20px",
                  borderRadius: 16,
                  background: "white",
                  color: "#6b7280",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span
                  className="spinner"
                  style={{
                    width: 16,
                    height: 16,
                    border: "2px solid #d1d5db",
                    borderTopColor: "#3b82f6",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 1s linear infinite",
                  }}
                />
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                  正在思考...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          style={{
            padding: 20,
            borderTop: "1px solid #e2e8f0",
            background: "white",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 14,
                color: "#6b7280",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={enableSearch}
                onChange={(e) => setEnableSearch(e.target.checked)}
                style={{
                  width: 16,
                  height: 16,
                  accentColor: "#3b82f6",
                }}
              />
              联网搜索
            </label>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && !e.shiftKey && sendMessage()
              }
              placeholder="输入您的问题..."
              style={{
                flex: 1,
                padding: "16px 20px",
                borderRadius: 12,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                color: "#374151",
                fontSize: 14,
                outline: "none",
                transition: "all 0.2s",
                minHeight: "52px",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim() || !selectedNewsCollection}
              style={{
                background: !selectedNewsCollection ? "#9ca3af" : "#3b82f6",
                color: "white",
                border: "none",
                padding: "16px 28px",
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 14,
                cursor:
                  loading || !input.trim() || !selectedNewsCollection
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  loading || !input.trim() || !selectedNewsCollection ? 0.5 : 1,
                transition: "all 0.2s",
                minHeight: "52px",
              }}
              onMouseEnter={(e) => {
                if (!loading && input.trim() && selectedNewsCollection) {
                  e.currentTarget.style.background = "#2563eb";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && input.trim() && selectedNewsCollection) {
                  e.currentTarget.style.background = "#3b82f6";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              发送
            </button>
          </div>
        </div>
      </main>

      <style>
        {`
        @keyframes spin { 
          from { transform: rotate(0deg);} 
          to { transform: rotate(360deg);} 
        }
        
        input, textarea, pre {
          box-sizing: border-box;
          max-width: 100%;
          overflow-x: hidden;
        }
        
        /* 滚动条样式优化 */
        aside::-webkit-scrollbar {
          width: 8px;
        }
        
        aside::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        aside::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        
        aside::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        /* 对话内容区域滚动条 */
        main > div:first-child::-webkit-scrollbar {
          width: 8px;
        }
        
        main > div:first-child::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        main > div:first-child::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        
        main > div:first-child::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        `}
      </style>
    </div>
  );
}
