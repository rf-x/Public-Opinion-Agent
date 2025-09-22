import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import ReportGenerator from "./pages/ReportGenerator";
import NewsCollection from "./pages/NewsCollection";
import IntelligentChat from "./pages/IntelligentChat";
import NewsSearch from "./pages/NewsSearch";
import TopicAnalysis from "./pages/TopicAnalysis";

function Navigation() {
  const location = useLocation();

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        background: "white",
        borderBottom: "1px solid #e5e7eb",
        zIndex: 1000,
        padding: "0 24px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: 1200,
          margin: "0 auto",
          height: 64,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link
            to="/"
            style={{
              textDecoration: "none",
              color: "#111827",
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            舆情分析智能体
          </Link>
          <div style={{ display: "flex", gap: 8 }}>
            <Link
              to="/"
              style={{
                textDecoration: "none",
                color: location.pathname === "/" ? "#3b82f6" : "#6b7280",
                padding: "8px 16px",
                borderRadius: 8,
                background:
                  location.pathname === "/" ? "#eff6ff" : "transparent",
              }}
            >
              首页
            </Link>
            <Link
              to="/report"
              style={{
                textDecoration: "none",
                color: location.pathname === "/report" ? "#3b82f6" : "#6b7280",
                padding: "8px 16px",
                borderRadius: 8,
                background:
                  location.pathname === "/report" ? "#eff6ff" : "transparent",
              }}
            >
              智能报告生成
            </Link>
            <Link
              to="/news-collection"
              style={{
                textDecoration: "none",
                color:
                  location.pathname === "/news-collection"
                    ? "#3b82f6"
                    : "#6b7280",
                padding: "8px 16px",
                borderRadius: 8,
                background:
                  location.pathname === "/news-collection"
                    ? "#eff6ff"
                    : "transparent",
              }}
            >
              新闻收集
            </Link>
            <Link
              to="/intelligent-chat"
              style={{
                textDecoration: "none",
                color:
                  location.pathname === "/intelligent-chat"
                    ? "#3b82f6"
                    : "#6b7280",
                padding: "8px 16px",
                borderRadius: 8,
                background:
                  location.pathname === "/intelligent-chat"
                    ? "#eff6ff"
                    : "transparent",
              }}
            >
              智能对话
            </Link>
            <Link
              to="/search"
              style={{
                textDecoration: "none",
                color: location.pathname === "/search" ? "#3b82f6" : "#6b7280",
                padding: "8px 16px",
                borderRadius: 8,
                background:
                  location.pathname === "/search" ? "#eff6ff" : "transparent",
              }}
            >
              舆情检索
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function HomePage() {
  // 设置页面标题
  React.useEffect(() => {
    document.title = "舆情分析智能体 - 首页";
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        paddingTop: 64,
      }}
    >
      {/* Hero Section */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "80px 24px 60px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 60,
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-block",
              background: "#f1f5f9",
              color: "#475569",
              padding: "6px 12px",
              borderRadius: 20,
              fontSize: 14,
              fontWeight: 500,
              marginBottom: 16,
            }}
          >
            AI 驱动
          </div>
          <h1
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: "#1e293b",
              margin: "0 0 24px 0",
              lineHeight: 1.2,
            }}
          >
            舆情分析智能体
          </h1>
          <p
            style={{
              fontSize: 18,
              color: "#64748b",
              lineHeight: 1.6,
              margin: "0 0 32px 0",
            }}
          >
            基于先进AI技术的舆情分析智能体，提供报告生成、咨询对话、信息检索三大核心功能，为您打造智能化的舆情分析解决方案。
          </p>
          <div style={{ display: "flex", gap: 16 }}>
            <Link
              to="/report"
              style={{
                background: "#1e293b",
                color: "white",
                padding: "12px 24px",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              📊 报告生成 →
            </Link>
            <Link
              to="/news-collection"
              style={{
                background: "#3b82f6",
                color: "white",
                padding: "12px 24px",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              📰 新闻收集 →
            </Link>
            <Link
              to="/intelligent-chat"
              style={{
                background: "#10b981",
                color: "white",
                padding: "12px 24px",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              🤖 智能对话 →
            </Link>
            <Link
              to="/search"
              style={{
                background: "white",
                color: "#1e293b",
                padding: "12px 24px",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 600,
                border: "1px solid #e2e8f0",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              🔍 信息检索 →
            </Link>
          </div>
        </div>

        {/* Report Preview */}
        <div
          style={{
            background: "white",
            borderRadius: 12,
            padding: 24,
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#ef4444",
              }}
            ></div>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#f59e0b",
              }}
            ></div>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#10b981",
              }}
            ></div>
          </div>
          <div
            style={{ fontFamily: "monospace", fontSize: 14, color: "#374151" }}
          >
            <div style={{ fontWeight: 700, marginBottom: 12 }}>
              # 舆情分析报告
            </div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>## 事件概述</div>
            <div style={{ marginBottom: 12 }}>某品牌产品发布引发热议</div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>## 情感分析</div>
            <div style={{ marginBottom: 4 }}>- 正面: 65%</div>
            <div style={{ marginBottom: 4 }}>- 负面: 20%</div>
            <div style={{ marginBottom: 12 }}>- 中性: 15%</div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>## 热点话题</div>
            <div style={{ marginBottom: 4 }}>1. 产品创新 (8.5/10)</div>
            <div style={{ marginBottom: 12 }}>2. 价格合理性 (7.2/10)</div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>## 建议措施</div>
            <div style={{ marginBottom: 4 }}>- 加强正面宣传</div>
            <div>- 及时回应反馈</div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "60px 24px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: "#1e293b",
            margin: "0 0 16px 0",
          }}
        >
          三大核心功能
        </h2>
        <p
          style={{
            fontSize: 18,
            color: "#64748b",
            margin: "0 0 48px 0",
          }}
        >
          点击下方功能卡片，体验智能化的舆情分析服务
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 32,
          }}
        >
          <Link
            to="/report"
            style={{
              background: "white",
              padding: 32,
              borderRadius: 12,
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e2e8f0",
              textDecoration: "none",
              transition: "all 0.2s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                background: "#3b82f6",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: 24,
              }}
            >
              📊
            </div>
            <h3
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "#1e293b",
                margin: "0 0 12px 0",
              }}
            >
              报告生成
            </h3>
            <p
              style={{
                color: "#64748b",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              智能生成专业舆情分析报告
            </p>
          </Link>

          <Link
            to="/news-collection"
            style={{
              background: "white",
              padding: 32,
              borderRadius: 12,
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e2e8f0",
              textDecoration: "none",
              transition: "all 0.2s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                background: "#3b82f6",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: 24,
              }}
            >
              📰
            </div>
            <h3
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "#1e293b",
                margin: "0 0 12px 0",
              }}
            >
              新闻收集
            </h3>
            <p
              style={{
                color: "#64748b",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              智能收集和整理新闻信息
            </p>
          </Link>

          <Link
            to="/intelligent-chat"
            style={{
              background: "white",
              padding: 32,
              borderRadius: 12,
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e2e8f0",
              textDecoration: "none",
              transition: "all 0.2s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                background: "#10b981",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: 24,
              }}
            >
              🤖
            </div>
            <h3
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "#1e293b",
                margin: "0 0 12px 0",
              }}
            >
              智能对话
            </h3>
            <p
              style={{
                color: "#64748b",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              基于新闻的智能分析对话
            </p>
          </Link>

          <Link
            to="/search"
            style={{
              background: "white",
              padding: 32,
              borderRadius: 12,
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e2e8f0",
              textDecoration: "none",
              transition: "all 0.2s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                background: "#f59e0b",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: 24,
              }}
            >
              🔍
            </div>
            <h3
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "#1e293b",
                margin: "0 0 12px 0",
              }}
            >
              信息检索
            </h3>
            <p
              style={{
                color: "#64748b",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              快速精准的信息搜索检索
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Navigation />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/report" element={<ReportGenerator />} />
        <Route path="/news-collection" element={<NewsCollection />} />
        <Route path="/intelligent-chat" element={<IntelligentChat />} />
        <Route path="/search" element={<NewsSearch />} />
        <Route path="/topic/:topic" element={<TopicAnalysis />} />
      </Routes>
    </Router>
  );
}
