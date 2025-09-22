import React, { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportGenerator() {
  // 设置页面标题
  useEffect(() => {
    document.title = "舆情分析智能体 - 智能报告生成";
  }, []);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");
  const [sources, setSources] = useState<string[]>([]);

  // 舆情咨询数据相关状态
  const [newsCollections, setNewsCollections] = useState<any[]>([]);
  const [selectedNewsCollection, setSelectedNewsCollection] = useState<
    string | null
  >(null);
  const [selectedNews, setSelectedNews] = useState<any[]>([]);

  // 大纲类型选择
  const [outlineType, setOutlineType] = useState<"fixed" | "custom">("fixed");

  // 固定大纲
  const fixedOutline = useMemo(() => ["事件起因", "事件分析", "建议措施"], []);

  // 每节自定义要求（每行一条）
  const [causeReq, setCauseReq] = useState("");
  const [analysisReq, setAnalysisReq] = useState("");
  const [measuresReq, setMeasuresReq] = useState("");

  // 自定义大纲相关状态
  const [customOutlineSections, setCustomOutlineSections] = useState(3);
  const [customOutlineTitles, setCustomOutlineTitles] = useState(["", "", ""]);
  const [customOutlineReqs, setCustomOutlineReqs] = useState(["", "", ""]);

  // 更新自定义大纲节数
  const updateCustomOutlineSections = (count: number) => {
    setCustomOutlineSections(count);
    if (count > customOutlineTitles.length) {
      setCustomOutlineTitles([
        ...customOutlineTitles,
        ...Array(count - customOutlineTitles.length).fill(""),
      ]);
      setCustomOutlineReqs([
        ...customOutlineReqs,
        ...Array(count - customOutlineReqs.length).fill(""),
      ]);
    } else if (count < customOutlineTitles.length) {
      setCustomOutlineTitles(customOutlineTitles.slice(0, count));
      setCustomOutlineReqs(customOutlineReqs.slice(0, count));
    }
  };

  // 更新自定义大纲标题
  const updateCustomOutlineTitle = (index: number, title: string) => {
    const newTitles = [...customOutlineTitles];
    newTitles[index] = title;
    setCustomOutlineTitles(newTitles);
  };

  // 更新自定义大纲要求
  const updateCustomOutlineReq = (index: number, req: string) => {
    const newReqs = [...customOutlineReqs];
    newReqs[index] = req;
    setCustomOutlineReqs(newReqs);
  };

  // 获取当前大纲和要求
  const currentOutline = useMemo(() => {
    if (outlineType === "fixed") {
      return fixedOutline;
    } else {
      return customOutlineTitles.filter((title) => title.trim());
    }
  }, [outlineType, fixedOutline, customOutlineTitles]);

  const refinements = useMemo(() => {
    if (outlineType === "fixed") {
      const format = (t: string, section: string) =>
        t
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => `【${section}】${s}`);
      return [
        ...format(causeReq, "事件起因"),
        ...format(analysisReq, "事件分析"),
        ...format(measuresReq, "建议措施"),
      ];
    } else {
      const result: string[] = [];
      customOutlineTitles.forEach((title, index) => {
        if (title.trim()) {
          const req = customOutlineReqs[index] || "";
          const format = (t: string, section: string) =>
            t
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
              .map((s) => `【${section}】${s}`);
          result.push(...format(req, title));
        }
      });
      return result;
    }
  }, [
    outlineType,
    causeReq,
    analysisReq,
    measuresReq,
    customOutlineTitles,
    customOutlineReqs,
  ]);

  type HistoryLite = { id: string; topic: string; createdAt: number };
  type HistoryItem = {
    id: string;
    topic: string;
    markdown: string;
    sources: string[];
    createdAt: number;
    // 报告设置字段
    outlineType?: "fixed" | "custom";
    outline?: string[];
    causeReq?: string;
    analysisReq?: string;
    measuresReq?: string;
    customOutlineSections?: number;
    customOutlineTitles?: string[];
    customOutlineReqs?: string[];
  };
  const [history, setHistory] = useState<HistoryLite[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(
    null
  );
  const [hoveredHistory, setHoveredHistory] = useState<string | null>(null);

  async function refreshHistory() {
    try {
      const res = await fetch("/api/v1/history");
      if (!res.ok) throw new Error(await res.text());
      const items = await res.json();
      setHistory(items || []);
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    refreshHistory();
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
      // ignore
    }
  }

  async function loadNewsCollection(id: string) {
    try {
      const res = await fetch(`/api/v1/news-collections/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedNews(data.news || []);
        setSelectedNewsCollection(id);
      }
    } catch (e: any) {
      alert("加载失败: " + e.message);
    }
  }

  async function loadHistory(id: string) {
    try {
      const res = await fetch(`/api/v1/history/${id}`);
      if (!res.ok) throw new Error(await res.text());
      const it: HistoryItem = await res.json();
      setSelectedHistoryId(id);
      setTopic(it.topic);
      setReport(it.markdown);
      setSources(it.sources || []);

      // 恢复报告设置 - 先重置所有字段，然后设置有值的字段
      setOutlineType(it.outlineType || "fixed");
      setCauseReq(it.causeReq || "");
      setAnalysisReq(it.analysisReq || "");
      setMeasuresReq(it.measuresReq || "");
      setCustomOutlineSections(it.customOutlineSections || 3);
      setCustomOutlineTitles(it.customOutlineTitles || ["", "", ""]);
      setCustomOutlineReqs(it.customOutlineReqs || ["", "", ""]);
    } catch (e: any) {
      alert("加载失败: " + e.message);
    }
  }

  async function deleteHistory(id: string) {
    if (!confirm("确认删除该报告？")) return;
    try {
      const res = await fetch(`/api/v1/history/${id}`, { method: "DELETE" });
      if (res.status !== 204) throw new Error(await res.text());
      if (selectedHistoryId === id) {
        setSelectedHistoryId(null);
        setReport("");
        setSources([]);
      }
      refreshHistory();
    } catch (e: any) {
      alert("删除失败: " + e.message);
    }
  }

  async function generate() {
    if (!topic || loading) return;
    setLoading(true);
    setReport("");
    setSources([]);
    setSelectedHistoryId(null);
    try {
      const res = await fetch("/api/v1/report/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          outline: currentOutline,
          refinements,
          // 保存报告设置
          outlineType,
          causeReq,
          analysisReq,
          measuresReq,
          customOutlineSections,
          customOutlineTitles,
          customOutlineReqs,
          // 传递新闻数据
          newsContext:
            selectedNews.length > 0
              ? {
                  collectionId: selectedNewsCollection,
                  news: selectedNews,
                }
              : null,
        }),
      });
      if (!res.ok || !res.body) throw new Error(await res.text());
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const evt = JSON.parse(line);
            if (evt.type === "meta") {
              // history id from backend
              setSelectedHistoryId(evt.id);
              refreshHistory();
            } else if (evt.type === "chunk") {
              setReport((prev) => prev + (evt.data || ""));
            } else if (evt.type === "sources") {
              setSources(evt.sources || []);
            } else if (evt.type === "error") {
              throw new Error(evt.message || "未知错误");
            }
          } catch {
            // ignore malformed line
          }
        }
      }
      // 完成
      setLoading(false);
    } catch (e: any) {
      setLoading(false);
      alert("生成失败: " + e.message);
    }
  }

  return (
    <div
      className="layout"
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(200px, 22vw) 1fr",
        height: "92vh",
        width: "100%",
        color: "#1e293b",
        overflow: "hidden",
        paddingTop: "64px",
      }}
    >
      <aside
        style={{
          borderRight: "1px solid #e2e8f0",
          padding: 20,
          overflowY: "auto",
          background: "white",
        }}
      >
        {/* 新报告按钮 */}
        <button
          onClick={() => {
            setReport("");
            setSources([]);
            setSelectedHistoryId(null);
            setTopic("");
            setCauseReq("");
            setAnalysisReq("");
            setMeasuresReq("");
            setCustomOutlineSections(3);
            setCustomOutlineTitles(["", "", ""]);
            setCustomOutlineReqs(["", "", ""]);
            setOutlineType("fixed");
          }}
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
          ✨ 新报告
        </button>

        <div
          style={{
            fontWeight: 700,
            marginBottom: 16,
            fontSize: 16,
            color: "#1e293b",
          }}
        >
          历史报告
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {history.length === 0 && (
            <div
              style={{
                color: "#64748b",
                textAlign: "center",
                padding: "20px 0",
              }}
            >
              暂无历史
            </div>
          )}
          {history.map((h) => (
            <div
              key={h.id}
              style={{ position: "relative" }}
              onMouseEnter={() => setHoveredHistory(h.id)}
              onMouseLeave={() => setHoveredHistory(null)}
            >
              <button
                onClick={() => loadHistory(h.id)}
                style={{
                  textAlign: "left",
                  background:
                    selectedHistoryId === h.id ? "#eff6ff" : "transparent",
                  color: selectedHistoryId === h.id ? "#1e40af" : "#374151",
                  border:
                    selectedHistoryId === h.id
                      ? "1px solid #3b82f6"
                      : "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: 12,
                  width: "100%",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (selectedHistoryId !== h.id) {
                    e.currentTarget.style.background = "#f8fafc";
                    e.currentTarget.style.borderColor = "#d1d5db";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedHistoryId !== h.id) {
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
                  {h.topic}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  {new Date(h.createdAt).toLocaleString()}
                </div>
              </button>

              <button
                onClick={() => deleteHistory(h.id)}
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
                  opacity: hoveredHistory === h.id ? 1 : 0,
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
      <main
        style={{
          display: "grid",
          gridTemplateRows: "auto 1fr",
          height: "100%",
          overflow: "hidden",
          background: "white",
        }}
      >
        <div
          className="contentGrid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(200px, 22vw) 1fr",
            height: "100%",
            overflow: "hidden",
          }}
        >
          <section
            style={{
              padding: 20,
              borderRight: "1px solid #e2e8f0",
              overflowY: "auto",
              background: "#f8fafc",
              height: "100%",
            }}
          >
            {/* 报告设置面板 */}
            <div
              style={{
                background: "white",
                borderRadius: 12,
                padding: 20,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e2e8f0",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 16,
                  color: "#1e293b",
                  marginBottom: 20,
                  paddingBottom: 12,
                  borderBottom: "2px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                📋 报告设置
              </div>

              <div style={{ display: "grid", gap: 16 }}>
                <label>
                  <div
                    style={{
                      marginBottom: 8,
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    主题
                  </div>
                  <input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="例如：某地重大事故应对复盘"
                    style={{
                      width: "100%",
                      maxWidth: "100%",
                      boxSizing: "border-box",
                      padding: "12px 16px",
                      borderRadius: 10,
                      background: "white",
                      border: "1px solid #e2e8f0",
                      color: "#374151",
                      fontSize: 14,
                      outline: "none",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "#3b82f6")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "#e2e8f0")
                    }
                  />
                </label>

                {/* 本地参考信息 */}
                <div>
                  <div
                    style={{
                      marginBottom: 8,
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    本地参考信息
                  </div>
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: "#6b7280",
                        marginBottom: 8,
                      }}
                    >
                      选择舆情咨询中收集的新闻数据作为报告参考
                    </div>
                    <select
                      value={selectedNewsCollection || ""}
                      onChange={(e) => {
                        if (e.target.value) {
                          loadNewsCollection(e.target.value);
                        } else {
                          setSelectedNewsCollection(null);
                          setSelectedNews([]);
                        }
                      }}
                      style={{
                        width: "100%",
                        maxWidth: "100%",
                        boxSizing: "border-box",
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: "white",
                        border: "1px solid #e2e8f0",
                        color: "#374151",
                        fontSize: 14,
                        outline: "none",
                        transition: "border-color 0.2s",
                      }}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = "#3b82f6")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor = "#e2e8f0")
                      }
                    >
                      <option value="">不使用新闻数据</option>
                      {newsCollections.map((collection) => (
                        <option key={collection.id} value={collection.id}>
                          {collection.topic} ({collection.news.length} 条新闻)
                        </option>
                      ))}
                    </select>
                    {selectedNews.length > 0 && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: 8,
                          background: "#eff6ff",
                          borderRadius: 6,
                          fontSize: 12,
                          color: "#1e40af",
                        }}
                      >
                        ✅ 已选择 {selectedNews.length} 条新闻作为参考数据
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{ marginTop: 8, fontWeight: 700, color: "#374151" }}
                >
                  大纲类型
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => setOutlineType("fixed")}
                    style={{
                      background:
                        outlineType === "fixed" ? "#3b82f6" : "transparent",
                      color: outlineType === "fixed" ? "white" : "#374151",
                      border:
                        outlineType === "fixed"
                          ? "1px solid #3b82f6"
                          : "1px solid #e5e7eb",
                      borderRadius: 10,
                      padding: "10px 16px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (outlineType !== "fixed")
                        e.currentTarget.style.background = "#2563eb";
                    }}
                    onMouseLeave={(e) => {
                      if (outlineType !== "fixed")
                        e.currentTarget.style.background = "transparent";
                    }}
                  >
                    预设大纲
                  </button>
                  <button
                    onClick={() => setOutlineType("custom")}
                    style={{
                      background:
                        outlineType === "custom" ? "#3b82f6" : "transparent",
                      color: outlineType === "custom" ? "white" : "#374151",
                      border:
                        outlineType === "custom"
                          ? "1px solid #3b82f6"
                          : "1px solid #e5e7eb",
                      borderRadius: 10,
                      padding: "10px 16px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (outlineType !== "custom")
                        e.currentTarget.style.background = "#2563eb";
                    }}
                    onMouseLeave={(e) => {
                      if (outlineType !== "custom")
                        e.currentTarget.style.background = "transparent";
                    }}
                  >
                    自定义大纲
                  </button>
                </div>

                {outlineType === "fixed" && (
                  <>
                    <div
                      style={{
                        marginTop: 8,
                        fontWeight: 700,
                        color: "#374151",
                      }}
                    >
                      固定大纲
                    </div>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: 20,
                        color: "#6b7280",
                        fontSize: 14,
                      }}
                    >
                      {fixedOutline.map((s, i) => (
                        <li key={i} style={{ marginBottom: 4 }}>
                          {s}
                        </li>
                      ))}
                    </ul>

                    <label>
                      <div
                        style={{
                          marginBottom: 8,
                          fontWeight: 600,
                          color: "#374151",
                        }}
                      >
                        事件起因
                      </div>
                      <textarea
                        value={causeReq}
                        onChange={(e) => setCauseReq(e.target.value)}
                        rows={3}
                        placeholder={
                          "每行一条要求，例如：\n给出时间线\n强调法规符合性"
                        }
                        style={{
                          width: "100%",
                          maxWidth: "100%",
                          boxSizing: "border-box",
                          padding: "12px 16px",
                          borderRadius: 10,
                          background: "white",
                          border: "1px solid #e2e8f0",
                          color: "#374151",
                          fontSize: 14,
                          resize: "vertical",
                          outline: "none",
                          transition: "border-color 0.2s",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = "#3b82f6")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = "#e2e8f0")
                        }
                      />
                    </label>
                    <label>
                      <div
                        style={{
                          marginBottom: 8,
                          fontWeight: 600,
                          color: "#374151",
                        }}
                      >
                        事件分析
                      </div>
                      <textarea
                        value={analysisReq}
                        onChange={(e) => setAnalysisReq(e.target.value)}
                        rows={4}
                        placeholder={
                          "每行一条要求，例如：\n对标国内外类似事件\n用表格总结影响面"
                        }
                        style={{
                          width: "100%",
                          maxWidth: "100%",
                          boxSizing: "border-box",
                          padding: "12px 16px",
                          borderRadius: 10,
                          background: "white",
                          border: "1px solid #e2e8f0",
                          color: "#374151",
                          fontSize: 14,
                          resize: "vertical",
                          outline: "none",
                          transition: "border-color 0.2s",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = "#3b82f6")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = "#e2e8f0")
                        }
                      />
                    </label>
                    <label>
                      <div
                        style={{
                          marginBottom: 8,
                          fontWeight: 600,
                          color: "#374151",
                        }}
                      >
                        建议措施
                      </div>
                      <textarea
                        value={measuresReq}
                        onChange={(e) => setMeasuresReq(e.target.value)}
                        rows={3}
                        placeholder={
                          "每行一条要求，例如：\n短中长期分层建议\n量化考核指标"
                        }
                        style={{
                          width: "100%",
                          maxWidth: "100%",
                          boxSizing: "border-box",
                          padding: "12px 16px",
                          borderRadius: 10,
                          background: "white",
                          border: "1px solid #e2e8f0",
                          color: "#374151",
                          fontSize: 14,
                          resize: "vertical",
                          outline: "none",
                          transition: "border-color 0.2s",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = "#3b82f6")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = "#e2e8f0")
                        }
                      />
                    </label>
                  </>
                )}

                {outlineType === "custom" && (
                  <>
                    <div
                      style={{
                        marginTop: 8,
                        fontWeight: 700,
                        color: "#374151",
                      }}
                    >
                      自定义大纲节数
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 16,
                      }}
                    >
                      <span style={{ fontSize: 14, color: "#374151" }}>
                        节数：
                      </span>
                      <input
                        type="number"
                        value={customOutlineSections}
                        onChange={(e) =>
                          updateCustomOutlineSections(Number(e.target.value))
                        }
                        min="1"
                        style={{
                          width: "50px",
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                          color: "#374151",
                          fontSize: 14,
                          textAlign: "center",
                          outline: "none",
                          transition: "border-color 0.2s",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = "#3b82f6")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = "#e2e8f0")
                        }
                      />
                    </div>
                    {customOutlineTitles.map((title, index) => (
                      <div key={index} style={{ display: "grid", gap: 8 }}>
                        <label>
                          <div
                            style={{
                              marginBottom: 4,
                              fontWeight: 600,
                              color: "#374151",
                            }}
                          >
                            第 {index + 1} 节标题
                          </div>
                          <input
                            value={title}
                            onChange={(e) =>
                              updateCustomOutlineTitle(index, e.target.value)
                            }
                            placeholder={`例如：${index + 1}节标题`}
                            style={{
                              width: "100%",
                              maxWidth: "100%",
                              boxSizing: "border-box",
                              padding: "12px 16px",
                              borderRadius: 10,
                              background: "white",
                              border: "1px solid #e2e8f0",
                              color: "#374151",
                              fontSize: 14,
                              outline: "none",
                              transition: "border-color 0.2s",
                            }}
                            onFocus={(e) =>
                              (e.currentTarget.style.borderColor = "#3b82f6")
                            }
                            onBlur={(e) =>
                              (e.currentTarget.style.borderColor = "#e2e8f0")
                            }
                          />
                        </label>
                        <label>
                          <div
                            style={{
                              marginBottom: 4,
                              fontWeight: 600,
                              color: "#374151",
                            }}
                          >
                            额外要求
                          </div>
                          <textarea
                            value={customOutlineReqs[index]}
                            onChange={(e) =>
                              updateCustomOutlineReq(index, e.target.value)
                            }
                            rows={3}
                            placeholder={`每行一条要求，例如：\n短中长期分层建议\n量化考核指标`}
                            style={{
                              width: "100%",
                              maxWidth: "100%",
                              boxSizing: "border-box",
                              padding: "12px 16px",
                              borderRadius: 10,
                              background: "white",
                              border: "1px solid #e2e8f0",
                              color: "#374151",
                              fontSize: 14,
                              resize: "vertical",
                              outline: "none",
                              transition: "border-color 0.2s",
                            }}
                            onFocus={(e) =>
                              (e.currentTarget.style.borderColor = "#3b82f6")
                            }
                            onBlur={(e) =>
                              (e.currentTarget.style.borderColor = "#e2e8f0")
                            }
                          />
                        </label>
                      </div>
                    ))}
                  </>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginTop: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={generate}
                    disabled={loading || !topic}
                    style={{
                      background: "#3b82f6",
                      color: "white",
                      border: "none",
                      padding: "12px 20px",
                      borderRadius: 10,
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: loading || !topic ? "not-allowed" : "pointer",
                      opacity: loading || !topic ? 0.5 : 1,
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!loading && topic)
                        e.currentTarget.style.background = "#2563eb";
                    }}
                    onMouseLeave={(e) => {
                      if (!loading && topic)
                        e.currentTarget.style.background = "#3b82f6";
                    }}
                  >
                    {loading ? "生成中…" : "生成报告"}
                  </button>
                  <button
                    onClick={() => {
                      setReport("");
                      setSources([]);
                      setSelectedHistoryId(null);
                      setTopic("");
                      setCauseReq("");
                      setAnalysisReq("");
                      setMeasuresReq("");
                      setCustomOutlineSections(3);
                      setCustomOutlineTitles(["", "", ""]);
                      setCustomOutlineReqs(["", "", ""]);
                    }}
                    style={{
                      background: "#6b7280",
                      color: "white",
                      border: "none",
                      padding: "12px 20px",
                      borderRadius: 10,
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#4b5563")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "#6b7280")
                    }
                  >
                    清空设置
                  </button>
                  <button
                    onClick={() =>
                      report && download(`${topic || "report"}.md`, report)
                    }
                    disabled={!report}
                    style={{
                      background: "#10b981",
                      color: "white",
                      border: "none",
                      padding: "12px 20px",
                      borderRadius: 10,
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: report ? "pointer" : "not-allowed",
                      opacity: report ? 1 : 0.5,
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (report) e.currentTarget.style.background = "#059669";
                    }}
                    onMouseLeave={(e) => {
                      if (report) e.currentTarget.style.background = "#10b981";
                    }}
                  >
                    导出报告
                  </button>
                </div>
              </div>
            </div>
          </section>
          <section
            style={{
              padding: 20,
              overflowY: "auto",
              position: "relative",
              background: "white",
              height: "100%",
            }}
          >
            <div
              style={{
                marginBottom: 16,
                fontWeight: 700,
                fontSize: 16,
                color: "#1e293b",
              }}
            >
              预览
            </div>
            <div style={{ position: "relative" }}>
              {loading && (
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "#6b7280",
                    background: "white",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <span
                    className="spinner"
                    style={{
                      width: 14,
                      height: 14,
                      border: "2px solid #d1d5db",
                      borderTopColor: "#3b82f6",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    正在生成…
                  </span>
                </div>
              )}
              <div
                style={{
                  background: "white",
                  padding: 20,
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  minHeight: "calc(100vh - 300px)",
                  overflowX: "auto",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                }}
              >
                {report ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h1
                          style={{
                            fontSize: "1.8em",
                            fontWeight: 700,
                            margin: "0 0 20px 0",
                            color: "#1e293b",
                            borderBottom: "2px solid #e5e7eb",
                            paddingBottom: "8px",
                          }}
                        >
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2
                          style={{
                            fontSize: "1.5em",
                            fontWeight: 600,
                            margin: "24px 0 16px 0",
                            color: "#1e293b",
                          }}
                        >
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3
                          style={{
                            fontSize: "1.3em",
                            fontWeight: 600,
                            margin: "20px 0 12px 0",
                            color: "#1e293b",
                          }}
                        >
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p
                          style={{
                            margin: "0 0 16px 0",
                            lineHeight: 1.7,
                            color: "#374151",
                          }}
                        >
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul
                          style={{
                            margin: "12px 0",
                            paddingLeft: "24px",
                            color: "#374151",
                          }}
                        >
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol
                          style={{
                            margin: "12px 0",
                            paddingLeft: "24px",
                            color: "#374151",
                          }}
                        >
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li style={{ margin: "6px 0", lineHeight: 1.6 }}>
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
                            padding: "3px 6px",
                            borderRadius: 4,
                            fontSize: "0.9em",
                            fontFamily: "monospace",
                            color: "#dc2626",
                          }}
                        >
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre
                          style={{
                            background: "#f8fafc",
                            padding: "16px",
                            borderRadius: 8,
                            overflow: "auto",
                            fontSize: "0.9em",
                            border: "1px solid #e2e8f0",
                            margin: "16px 0",
                          }}
                        >
                          {children}
                        </pre>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote
                          style={{
                            borderLeft: "4px solid #3b82f6",
                            paddingLeft: "20px",
                            margin: "16px 0",
                            color: "#64748b",
                            fontStyle: "italic",
                            background: "#f8fafc",
                            padding: "12px 20px",
                            borderRadius: "0 8px 8px 0",
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
                            (e.currentTarget.style.textDecoration = "underline")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.textDecoration = "none")
                          }
                        >
                          {children}
                        </a>
                      ),
                      table: ({ children }) => (
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            margin: "16px 0",
                            border: "1px solid #e5e7eb",
                          }}
                        >
                          {children}
                        </table>
                      ),
                      th: ({ children }) => (
                        <th
                          style={{
                            border: "1px solid #e5e7eb",
                            padding: "12px",
                            background: "#f8fafc",
                            fontWeight: 600,
                            textAlign: "left",
                          }}
                        >
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td
                          style={{
                            border: "1px solid #e5e7eb",
                            padding: "12px",
                          }}
                        >
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {report}
                  </ReactMarkdown>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#9ca3af",
                      padding: "40px 20px",
                      fontSize: 16,
                    }}
                  >
                    <div style={{ marginBottom: 16, fontSize: 48 }}>📄</div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 600,
                        marginBottom: 8,
                        color: "#6b7280",
                      }}
                    >
                      报告预览
                    </div>
                    <div style={{ fontSize: 14, color: "#9ca3af" }}>
                      填写主题和要求后，点击生成报告即可在此处预览
                    </div>
                  </div>
                )}
              </div>
            </div>
            {sources.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: 12,
                    fontSize: 16,
                    color: "#1e293b",
                  }}
                >
                  参考链接
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {sources.map((s, i) => {
                    try {
                      const u = new URL(s);
                      const host = u.hostname;
                      const path = (u.pathname + u.search).slice(0, 80);
                      const favicon = `${u.protocol}//${u.hostname}/favicon.ico`;
                      return (
                        <a
                          key={i}
                          href={s}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: 12,
                            borderRadius: 10,
                            border: "1px solid #e5e7eb",
                            background: "white",
                            color: "inherit",
                            textDecoration: "none",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#3b82f6";
                            e.currentTarget.style.boxShadow =
                              "0 2px 8px rgba(59, 130, 246, 0.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "#e5e7eb";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          <img
                            src={favicon}
                            alt=""
                            width={16}
                            height={16}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                          <div style={{ display: "grid" }}>
                            <div
                              style={{
                                fontSize: 13,
                                color: "#374151",
                                fontWeight: 500,
                              }}
                            >
                              {host}
                            </div>
                            <div style={{ fontSize: 12, color: "#6b7280" }}>
                              {path}
                            </div>
                          </div>
                        </a>
                      );
                    } catch {
                      return (
                        <a
                          key={i}
                          href={s}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: 12,
                            borderRadius: 10,
                            border: "1px solid #e5e7eb",
                            background: "white",
                            color: "#374151",
                            textDecoration: "none",
                            wordBreak: "break-all",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#3b82f6";
                            e.currentTarget.style.boxShadow =
                              "0 2px 8px rgba(59, 130, 246, 0.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "#e5e7eb";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          {s}
                        </a>
                      );
                    }
                  })}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
      <style>
        {`
        @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        .layout { width: 100%; }
        @media (max-width: 900px) {
          .layout { grid-template-columns: 1fr !important; }
          .contentGrid { grid-template-columns: 1fr !important; }
        }
        
        input, textarea, pre {
          box-sizing: border-box;
          max-width: 100%;
          overflow-x: hidden;
        }
        
        /* 滚动条样式优化 */
        section::-webkit-scrollbar {
          width: 8px;
        }
        
        section::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        section::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        
        section::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        /* 左侧边栏滚动条 */
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
        
        .layout { 
          width: 100%; 
          grid-template-columns: minmax(200px, 22vw) 1fr !important;
        }
        
        .contentGrid { 
          grid-template-columns: minmax(200px, 22vw) 1fr !important;
        }
        `}
      </style>
    </div>
  );
}
