import React, { useEffect, useState } from 'react'

type NewsItem = {
  id: string
  title: string
  content: string
  source: string
  sourceType?: 'main' | 'social' | string
  url: string
  publishedAt: string
  category: string
  keywords: string[]
  topic?: string // 新增话题字段
  sentiment?: string // 新增情感字段
  region?: string // 新增地域字段
  eventId?: string // 事件ID，用于事件聚合
}

type SearchFilters = {
  keyword: string
  title: string
  category: string
  dateFrom: string
  dateTo: string
  source: string
  topic: string
  sentiment: string
}

export default function NewsSearch() {
  // 设置页面标题
  useEffect(() => {
    document.title = '舆情分析智能体 - 舆情检索'
  }, [])
  
  const [news, setNews] = useState<NewsItem[]>([])
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    keyword: '',
    title: '',
    category: '',
    dateFrom: '',
    dateTo: '',
    source: '',
    topic: '',
    sentiment: ''
  })
  const [categories, setCategories] = useState<string[]>([])
  const [sources, setSources] = useState<string[]>([])
  const [topics, setTopics] = useState<string[]>([])
  const [sentiments, setSentiments] = useState<string[]>(['正面', '负面', '中性'])

  useEffect(() => {
    loadNews()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [news, filters])

  async function loadNews() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/news')
      if (res.ok) {
        const data = await res.json()
        setNews(data.news || [])
        
        // Extract unique categories, sources, and topics
        const uniqueCategories = [...new Set(data.news?.map((item: NewsItem) => item.category) || [])] as string[]
        const uniqueSources = [...new Set(data.news?.map((item: NewsItem) => item.source) || [])] as string[]
        const uniqueTopics = [...new Set(data.news?.map((item: NewsItem) => item.topic).filter(Boolean) || [])] as string[]
        setCategories(uniqueCategories)
        setSources(uniqueSources)
        setTopics(uniqueTopics)
      }
    } catch (e) {
      console.error('Failed to load news:', e)
    } finally {
      setLoading(false)
    }
  }

  function applyFilters() {
    let filtered = [...news]

    // Keyword search (title and content)
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase()
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(keyword) ||
        item.content.toLowerCase().includes(keyword) ||
        item.keywords.some(k => k.toLowerCase().includes(keyword))
      )
    }

    // Title-only search
    if (filters.title) {
      const titleKw = filters.title.toLowerCase()
      filtered = filtered.filter(item => item.title.toLowerCase().includes(titleKw))
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(item => item.category === filters.category)
    }

    // Source filter
    if (filters.source) {
      filtered = filtered.filter(item => item.source === filters.source)
    }

    // Topic filter
    if (filters.topic) {
      filtered = filtered.filter(item => item.topic === filters.topic)
    }

    // Sentiment filter
    if (filters.sentiment) {
      filtered = filtered.filter(item => item.sentiment === filters.sentiment)
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(item => new Date(item.publishedAt) >= new Date(filters.dateFrom))
    }
    if (filters.dateTo) {
      filtered = filtered.filter(item => new Date(item.publishedAt) <= new Date(filters.dateTo))
    }

    setFilteredNews(filtered)
  }

  function clearFilters() {
    setFilters({
      keyword: '',
      title: '',
      category: '',
      dateFrom: '',
      dateTo: '',
      source: '',
      topic: '',
      sentiment: ''
    })
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div style={{ 
      minHeight: 'calc(100vh - 64px)', 
      background: '#f8fafc', 
      color: '#1e293b',
      paddingTop: '64px' // 添加顶部内边距，避免被导航栏遮挡
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <header style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 12px 0', color: '#1e293b' }}>舆情检索</h1>
          <p style={{ fontSize: 18, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            快速、精准的信息搜索和检索功能，支持多种数据源和检索方式
          </p>
        </header>

        {/* Search Filters */}
        <div style={{ 
          background: 'white', 
          borderRadius: 16, 
          padding: 28, 
          marginBottom: 32,
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {/* Keyword Search */}
            <div>
              <label style={{ display: 'block', marginBottom: 10, fontWeight: 600, color: '#374151' }}>关键词搜索</label>
              <input
                type="text"
                value={filters.keyword}
                onChange={e => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
                placeholder="搜索标题、内容或关键词..."
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#374151',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Title-only Search */}
            <div>
              <label style={{ display: 'block', marginBottom: 10, fontWeight: 600, color: '#374151' }}>标题词</label>
              <input
                type="text"
                value={filters.title}
                onChange={e => setFilters(prev => ({ ...prev, title: e.target.value }))}
                placeholder="仅搜索标题中的词..."
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#374151',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Category Filter */}
            <div>
              <label style={{ display: 'block', marginBottom: 10, fontWeight: 600, color: '#374151' }}>分类筛选</label>
              <select
                value={filters.category}
                onChange={e => setFilters(prev => ({ ...prev, category: e.target.value }))}
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#374151',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <option value="">全部分类</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Source Filter */}
            <div>
              <label style={{ display: 'block', marginBottom: 10, fontWeight: 600, color: '#374151' }}>来源筛选</label>
              <select
                value={filters.source}
                onChange={e => setFilters(prev => ({ ...prev, source: e.target.value }))}
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#374151',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <option value="">全部来源</option>
                {sources.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>

            {/* Topic Filter */}
            <div>
              <label style={{ display: 'block', marginBottom: 10, fontWeight: 600, color: '#374151' }}>话题筛选</label>
              <select
                value={filters.topic}
                onChange={e => setFilters(prev => ({ ...prev, topic: e.target.value }))}
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#374151',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <option value="">全部话题</option>
                {topics.map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </div>

            {/* Sentiment Filter */}
            <div>
              <label style={{ display: 'block', marginBottom: 10, fontWeight: 600, color: '#374151' }}>情感筛选</label>
              <select
                value={filters.sentiment}
                onChange={e => setFilters(prev => ({ ...prev, sentiment: e.target.value }))}
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#374151',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <option value="">全部情感</option>
                {sentiments.map(sentiment => (
                  <option key={sentiment} value={sentiment}>{sentiment}</option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label style={{ display: 'block', marginBottom: 10, fontWeight: 600, color: '#374151' }}>开始日期</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={e => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#374151',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 10, fontWeight: 600, color: '#374151' }}>结束日期</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={e => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#374151',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, marginTop: 20, alignItems: 'center' }}>
            <button
              onClick={clearFilters}
              style={{
                background: '#6b7280',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 10,
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 14,
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#4b5563'}
              onMouseLeave={e => e.currentTarget.style.background = '#6b7280'}
            >
              清除筛选
            </button>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              color: '#64748b',
              fontSize: 14,
              fontWeight: 500
            }}>
              共找到 {filteredNews.length} 条结果
            </div>
          </div>
        </div>

        {/* News List */}
        <div style={{ display: 'grid', gap: 20 }}>
          {loading && (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 40px', 
              color: '#64748b',
              background: 'white',
              borderRadius: 16,
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ marginBottom: 20, fontSize: 48 }}>📰</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#374151' }}>正在加载新闻数据...</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>请稍候，正在获取最新资讯</div>
            </div>
          )}

          {!loading && filteredNews.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 40px', 
              color: '#64748b',
              background: 'white',
              borderRadius: 16,
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ marginBottom: 20, fontSize: 48 }}>🔍</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#374151' }}>没有找到匹配的新闻</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>请尝试调整搜索条件或关键词</div>
            </div>
          )}

          {filteredNews.map(item => (
            <div
              key={item.id}
              style={{
                background: 'white',
                borderRadius: 16,
                padding: 24,
                border: '1px solid #e2e8f0',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <h3 style={{ 
                  fontSize: 20, 
                  fontWeight: 600, 
                  margin: 0, 
                  lineHeight: 1.4,
                  color: '#1e293b'
                }}>
                  {item.title}
                </h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ 
                    background: '#3b82f6', 
                    color: 'white', 
                    padding: '6px 12px', 
                    borderRadius: 8, 
                    fontSize: 12,
                    fontWeight: 600
                  }}>
                    {item.category}
                  </div>
                  {item.topic && (
                    <div style={{ 
                      background: '#10b981', 
                      color: 'white', 
                      padding: '6px 12px', 
                      borderRadius: 8, 
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      // 点击话题词，跳转到话题分析页面
                      if (item.topic) {
                        window.open(`/topic/${encodeURIComponent(item.topic)}`, '_blank')
                      }
                    }}>
                      {item.topic}
                    </div>
                  )}
                </div>
              </div>

              <p style={{ 
                color: '#64748b', 
                lineHeight: 1.7, 
                margin: '0 0 16px 0',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                fontSize: 15
              }}>
                {item.content}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 20, fontSize: 14, color: '#6b7280' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>📰 {item.source}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>🕒 {formatDate(item.publishedAt)}</span>
                  {item.sentiment && (
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 4,
                      color: item.sentiment === '正面' ? '#10b981' : 
                             item.sentiment === '负面' ? '#ef4444' : '#6b7280'
                    }}>
                      {item.sentiment === '正面' ? '😊' : item.sentiment === '负面' ? '😞' : '😐'} {item.sentiment}
                    </span>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: 8 }}>
                  {item.keywords.slice(0, 3).map((keyword, index) => (
                    <span
                      key={index}
                      style={{
                        background: '#f1f5f9',
                        color: '#475569',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 500
                      }}
                    >
                      {keyword}
                    </span>
                  ))}
                  {item.keywords.length > 3 && (
                    <span style={{ color: '#6b7280', fontSize: 12, display: 'flex', alignItems: 'center' }}>
                      +{item.keywords.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {item.url && (
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#3b82f6',
                      textDecoration: 'none',
                      fontSize: 14,
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#2563eb'}
                    onMouseLeave={e => e.currentTarget.style.color = '#3b82f6'}
                  >
                    查看原文 →
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
