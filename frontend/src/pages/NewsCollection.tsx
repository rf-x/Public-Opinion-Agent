import React, { useEffect, useState } from "react";

type NewsItem = {
  id: string;
  title: string;
  content: string;
  source: string;
  url: string;
  publishedAt: string;
  author?: string;
  summary?: string;
  keywords?: string[];
  topic?: string;
  sentiment?: string;
};

type NewsCollection = {
  id: string;
  topic: string;
  keywords: string;
  startDate: string;
  endDate: string;
  news: NewsItem[];
  createdAt: number;
  totalNews: number;
};

export default function NewsCollection() {
  // 设置页面标题
  useEffect(() => {
    document.title = "舆情分析智能体 - 新闻收集";
  }, []);

  // 获取默认时间范围（当前日期往前一个月）
  const getDefaultDateRange = () => {
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);

    return {
      startDate: oneMonthAgo.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
    };
  };

  // 新闻收集相关状态
  const [newsCollection, setNewsCollection] = useState(() => {
    const defaultDates = getDefaultDateRange();
    return {
      topic: "",
      keywords: "",
      startDate: defaultDates.startDate,
      endDate: defaultDates.endDate,
      maxResults: 20,
    };
  });
  const [collectedNews, setCollectedNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsCollections, setNewsCollections] = useState<NewsCollection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | null
  >(null);

  useEffect(() => {
    loadNewsCollections();
  }, []);

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

  async function collectNews() {
    if (!newsCollection.topic) {
      alert("话题不能为空，请输入要收集的新闻话题");
      return;
    }

    if (!newsCollection.startDate || !newsCollection.endDate) {
      alert("时间范围不能为空，请选择开始和结束时间");
      return;
    }

    setNewsLoading(true);
    try {
      const res = await fetch("/api/v1/collect-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newsCollection),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      setCollectedNews(data.news || []);
      setSelectedCollectionId(data.collectionId);
      loadNewsCollections(); // 刷新收集列表
    } catch (e: any) {
      alert("收集失败: " + e.message);
    } finally {
      setNewsLoading(false);
    }
  }

  async function loadNewsCollection(id: string) {
    try {
      const res = await fetch(`/api/v1/news-collections/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCollectedNews(data.news || []);
        setSelectedCollectionId(id);
        setNewsCollection({
          topic: data.topic || "",
          keywords: data.keywords || "",
          startDate: data.startDate || "",
          endDate: data.endDate || "",
          maxResults: 20,
        });
      }
    } catch (e: any) {
      alert("加载失败: " + e.message);
    }
  }

  async function deleteNewsCollection(id: string) {
    if (!confirm("确认删除该新闻收集？")) return;
    try {
      const res = await fetch(`/api/v1/news-collections/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (selectedCollectionId === id) {
          setSelectedCollectionId(null);
          setCollectedNews([]);
        }
        loadNewsCollections();
      }
    } catch (e: any) {
      alert("删除失败: " + e.message);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
      {/* Sidebar - 收集历史 */}
      <aside
        style={{
          borderRight: "1px solid #e2e8f0",
          padding: 20,
          overflowY: "auto",
          background: "white",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            marginBottom: 16,
            fontSize: 16,
            color: "#1e293b",
          }}
        >
          📰 收集历史
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {newsCollections.length === 0 && (
            <div
              style={{
                color: "#64748b",
                fontSize: 14,
                textAlign: "center",
                padding: "20px 0",
              }}
            >
              暂无收集记录
            </div>
          )}
          {newsCollections.map((collection) => (
            <div key={collection.id} style={{ position: "relative" }}>
              <button
                onClick={() => loadNewsCollection(collection.id)}
                style={{
                  textAlign: "left",
                  background:
                    selectedCollectionId === collection.id
                      ? "#eff6ff"
                      : "transparent",
                  color:
                    selectedCollectionId === collection.id
                      ? "#1e40af"
                      : "#374151",
                  border:
                    selectedCollectionId === collection.id
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
              <button
                onClick={() => deleteNewsCollection(collection.id)}
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
                  opacity: 0.7,
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
              >
                删除
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        style={{
          padding: "24px 20px 20px 20px",
          overflowY: "auto",
          background: "#f8fafc",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* 新闻收集表单 */}
          <div
            style={{
              background: "white",
              padding: 24,
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 20,
                color: "#1e293b",
              }}
            >
              📰 新闻收集设置
            </h2>
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: 8,
                  }}
                >
                  话题 *
                </label>
                <input
                  type="text"
                  value={newsCollection.topic}
                  onChange={(e) =>
                    setNewsCollection({
                      ...newsCollection,
                      topic: e.target.value,
                    })
                  }
                  placeholder="请输入要收集的新闻话题"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s",
                    boxSizing: "border-box",
                    maxWidth: "100%",
                    overflowX: "hidden",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "#3b82f6")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "#d1d5db")
                  }
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: 8,
                  }}
                >
                  关键词
                </label>
                <input
                  type="text"
                  value={newsCollection.keywords}
                  onChange={(e) =>
                    setNewsCollection({
                      ...newsCollection,
                      keywords: e.target.value,
                    })
                  }
                  placeholder="请输入关键词，多个关键词用逗号分隔（可选）"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s",
                    boxSizing: "border-box",
                    maxWidth: "100%",
                    overflowX: "hidden",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "#3b82f6")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "#d1d5db")
                  }
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: 8,
                    }}
                  >
                    开始时间 *
                  </label>
                  <input
                    type="date"
                    value={newsCollection.startDate}
                    onChange={(e) =>
                      setNewsCollection({
                        ...newsCollection,
                        startDate: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      fontSize: 14,
                      outline: "none",
                      transition: "border-color 0.2s",
                      boxSizing: "border-box",
                      maxWidth: "100%",
                      overflowX: "hidden",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "#3b82f6")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "#d1d5db")
                    }
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: 8,
                    }}
                  >
                    结束时间 *
                  </label>
                  <input
                    type="date"
                    value={newsCollection.endDate}
                    onChange={(e) =>
                      setNewsCollection({
                        ...newsCollection,
                        endDate: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      fontSize: 14,
                      outline: "none",
                      transition: "border-color 0.2s",
                      boxSizing: "border-box",
                      maxWidth: "100%",
                      overflowX: "hidden",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "#3b82f6")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "#d1d5db")
                    }
                  />
                </div>
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: 8,
                  }}
                >
                  收集个数
                </label>
                <input
                  type="number"
                  value={newsCollection.maxResults}
                  onChange={(e) =>
                    setNewsCollection({
                      ...newsCollection,
                      maxResults: parseInt(e.target.value) || 20,
                    })
                  }
                  min="1"
                  max="100"
                  placeholder="最多收集的新闻条数"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s",
                    boxSizing: "border-box",
                    maxWidth: "100%",
                    overflowX: "hidden",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "#3b82f6")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "#d1d5db")
                  }
                />
              </div>
              <button
                onClick={collectNews}
                disabled={newsLoading}
                style={{
                  background: newsLoading ? "#9ca3af" : "#3b82f6",
                  color: "white",
                  border: "none",
                  padding: "14px 24px",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: newsLoading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
                onMouseEnter={(e) => {
                  if (!newsLoading) {
                    e.currentTarget.style.background = "#2563eb";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!newsLoading) {
                    e.currentTarget.style.background = "#3b82f6";
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
              >
                {newsLoading ? (
                  <>
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        border: "2px solid #ffffff",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        display: "inline-block",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    正在收集...
                  </>
                ) : (
                  "🔍 开始收集新闻"
                )}
              </button>
            </div>
          </div>

          {/* 收集结果展示 */}
          {collectedNews.length > 0 && (
            <div
              style={{
                background: "white",
                padding: 24,
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              }}
            >
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  marginBottom: 16,
                  color: "#1e293b",
                }}
              >
                📋 收集结果 ({collectedNews.length} 条)
              </h3>
              <div style={{ display: "grid", gap: 16 }}>
                {collectedNews.map((news, index) => (
                  <div
                    key={news.id || index}
                    style={{
                      padding: 16,
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      background: "#f9fafb",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: "#1e293b",
                        marginBottom: 8,
                        lineHeight: 1.4,
                      }}
                    >
                      {news.title}
                    </div>
                    <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
                      <span
                        style={{
                          fontSize: 12,
                          color: "#6b7280",
                          background: "#e5e7eb",
                          padding: "2px 8px",
                          borderRadius: 4,
                        }}
                      >
                        {news.source}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: "#6b7280",
                        }}
                      >
                        {formatDate(news.publishedAt)}
                      </span>
                      {news.author && (
                        <span
                          style={{
                            fontSize: 12,
                            color: "#6b7280",
                          }}
                        >
                          作者: {news.author}
                        </span>
                      )}
                    </div>
                    {news.summary && (
                      <div
                        style={{
                          fontSize: 14,
                          color: "#4b5563",
                          lineHeight: 1.5,
                          marginBottom: 8,
                        }}
                      >
                        {news.summary}
                      </div>
                    )}
                    <a
                      href={news.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 12,
                        color: "#3b82f6",
                        textDecoration: "none",
                        wordBreak: "break-all",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.textDecoration = "underline")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.textDecoration = "none")
                      }
                    >
                      {news.url}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
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
        
        /* 主内容区域滚动条 */
        main::-webkit-scrollbar {
          width: 8px;
        }
        
        main::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        main::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        
        main::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        `}
      </style>
    </div>
  );
}
