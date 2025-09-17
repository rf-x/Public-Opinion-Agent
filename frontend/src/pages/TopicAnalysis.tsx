import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

type TopicData = {
  topic: string
  newsCount: number
  timeSpan: {
    start: string
    end: string
    duration: string
  }
  sentiment: {
    positive: number
    negative: number
    neutral: number
  }
  engagement: {
    total: number
    average: number
    trend: 'up' | 'down' | 'stable'
    socialMedia: Array<{
      platform: string
      count: number
      percentage: number
      trend: 'up' | 'down' | 'stable'
    }>
  }
  sources: Array<{
    name: string
    count: number
    percentage: number
    type: 'official' | 'media' | 'social' | 'other'
  }>
  regions: Array<{
    name: string
    count: number
    percentage: number
    sentiment: number
  }>
  keywords: Array<{
    word: string
    frequency: number
    weight: number
    sentiment: number
  }>
  timeline: Array<{
    date: string
    count: number
    sentiment: number
    engagement: number
  }>
  hotTopics: Array<{
    title: string
    heat: number
    sentiment: number
    source: string
    time: string
  }>
}

// 中国所有省级行政单位
const CHINESE_PROVINCES = [
  '河北省', '山西省', '辽宁省', '吉林省', '黑龙江省', '江苏省', '浙江省', '安徽省', '福建省', '江西省',
  '山东省', '河南省', '湖北省', '湖南省', '广东省', '海南省', '四川省', '贵州省', '云南省', '陕西省',
  '甘肃省', '青海省', '台湾省', '内蒙古自治区', '广西壮族自治区', '西藏自治区', '宁夏回族自治区',
  '新疆维吾尔自治区', '北京市', '天津市', '上海市', '重庆市', '香港特别行政区', '澳门特别行政区'
]

// 中国主要社交媒体平台
const SOCIAL_MEDIA_PLATFORMS = [
  { name: '微信', icon: '💬', color: '#07C160' },
  { name: '抖音', icon: '🎵', color: '#000000' },
  { name: '微博', icon: '📱', color: '#E6162D' },
  { name: '小红书', icon: '📖', color: '#FF2442' },
  { name: '快手', icon: '⚡', color: '#FF6600' },
  { name: 'B站', icon: '📺', color: '#00A1D6' }
]

// 新闻来源类型
const NEWS_SOURCES: Array<{ name: string; type: 'official' | 'media' | 'social' | 'other'; count: number }> = [
  { name: '人民日报', type: 'official', count: 0 },
  { name: '新华社', type: 'official', count: 0 },
  { name: '央视新闻', type: 'official', count: 0 },
  { name: '环球时报', type: 'media', count: 0 },
  { name: '腾讯新闻', type: 'media', count: 0 },
  { name: '网易新闻', type: 'media', count: 0 },
  { name: '新浪新闻', type: 'media', count: 0 },
  { name: '凤凰网', type: 'media', count: 0 },
  { name: '澎湃新闻', type: 'media', count: 0 },
  { name: '界面新闻', type: 'media', count: 0 },
  { name: '财新网', type: 'media', count: 0 },
  { name: '第一财经', type: 'media', count: 0 }
]

// 热门话题模板
const HOT_TOPICS_TEMPLATES = [
  '关于{topic}的最新政策解读',
  '{topic}相关事件引发社会关注',
  '专家分析{topic}发展趋势',
  '{topic}对行业影响分析',
  '民众对{topic}的看法调查',
  '{topic}相关数据报告发布',
  '国际视角看{topic}',
  '{topic}背后的深层原因',
  '{topic}解决方案探讨',
  '{topic}未来发展方向预测'
]

// 关键词模板
const KEYWORDS_TEMPLATES = [
  '政策', '改革', '发展', '创新', '合作', '经济', '社会', '民生', '科技', '教育',
  '医疗', '环保', '文化', '旅游', '交通', '住房', '就业', '养老', '健康', '安全',
  '治理', '服务', '建设', '规划', '投资', '消费', '出口', '进口', '金融', '房地产'
]

// 生成随机中文时间
function generateRandomChineseTime() {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30) - 7)
  
  const endDate = new Date()
  endDate.setDate(endDate.getDate() - Math.floor(Math.random() * 7))
  
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  let duration = ''
  if (diffDays === 1) duration = '1天'
  else if (diffDays < 7) duration = `${diffDays}天`
  else if (diffDays < 30) duration = `${Math.floor(diffDays / 7)}周${diffDays % 7 > 0 ? diffDays % 7 + '天' : ''}`
  else duration = `${Math.floor(diffDays / 30)}个月${diffDays % 30 > 0 ? diffDays % 30 + '天' : ''}`
  
  return {
    start: startDate.toLocaleDateString('zh-CN'),
    end: endDate.toLocaleDateString('zh-CN'),
    duration: duration
  }
}

export default function TopicAnalysis() {
  const { topic } = useParams<{ topic: string }>()
  const [topicData, setTopicData] = useState<TopicData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (topic) {
      document.title = `舆情分析智能体 - ${decodeURIComponent(topic)}话题分析`
      loadTopicData(decodeURIComponent(topic))
    }
  }, [topic])

  async function loadTopicData(topicName: string) {
    setLoading(true)
    try {
      // 调用真实的后端API
      const res = await fetch(`/api/v1/news/topic/${encodeURIComponent(topicName)}`)
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const data = await res.json()
      setTopicData(data)
    } catch (e) {
      console.error('Failed to load topic data:', e)
      // 如果API调用失败，使用模拟数据作为备选
      const mockData = generateMockData(topicName)
      setTopicData(mockData)
    } finally {
      setLoading(false)
    }
  }

  function generateMockData(topicName: string): TopicData {
    const timeSpan = generateRandomChineseTime()
    const newsCount = Math.floor(Math.random() * 500) + 200
    
    // 生成情感数据
    const positive = Math.floor(Math.random() * 30) + 40
    const negative = Math.floor(Math.random() * 25) + 15
    const neutral = 100 - positive - negative
    
    // 生成参与度数据
    const totalEngagement = Math.floor(Math.random() * 50000) + 20000
    const averageEngagement = Math.floor(totalEngagement / newsCount)
    
    // 生成社交媒体数据
    const socialMediaData = SOCIAL_MEDIA_PLATFORMS.map(platform => ({
      platform: platform.name,
      count: Math.floor(Math.random() * 5000) + 1000,
      percentage: 0,
      trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable'
    }))
    
    // 计算社交媒体百分比
    const totalSocialCount = socialMediaData.reduce((sum, s) => sum + s.count, 0)
    socialMediaData.forEach(s => s.percentage = Math.round((s.count / totalSocialCount) * 100))
    
    // 生成新闻来源数据
    const sourcesData = NEWS_SOURCES.map(source => ({
      name: source.name,
      type: source.type,
      count: Math.floor(Math.random() * 50) + 10,
      percentage: 0
    }))
    
    // 计算来源百分比
    const totalSourceCount = sourcesData.reduce((sum, s) => sum + s.count, 0)
    sourcesData.forEach(s => s.percentage = Math.round((s.count / totalSourceCount) * 100))
    
    // 生成地域分布数据（随机选择10-15个省份）
    const selectedProvinces = CHINESE_PROVINCES
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 6) + 10)
      .map(province => ({
        name: province,
        count: Math.floor(Math.random() * 100) + 20,
        percentage: 0,
        sentiment: Math.random() * 2 - 1
      }))
    
    // 计算地域百分比
    const totalRegionCount = selectedProvinces.reduce((sum, r) => sum + r.count, 0)
    selectedProvinces.forEach(r => r.percentage = Math.round((r.count / totalRegionCount) * 100))
    
    // 生成关键词数据
    const keywordsData = KEYWORDS_TEMPLATES
      .sort(() => Math.random() - 0.5)
      .slice(0, 12)
      .map((word, index) => ({
        word: word,
        frequency: Math.floor(Math.random() * 200) + 50,
        weight: Math.random() * 0.5 + 0.5,
        sentiment: Math.random() * 2 - 1
      }))
      .sort((a, b) => b.frequency - a.frequency)
    
    // 生成时间线数据
    const timelineData = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      return {
        date: date.toLocaleDateString('zh-CN'),
        count: Math.floor(Math.random() * 20) + 5,
        sentiment: Math.random() * 2 - 1,
        engagement: Math.floor(Math.random() * 1000) + 200
      }
    })
    
    // 生成热门话题数据
    const hotTopicsData = HOT_TOPICS_TEMPLATES
      .sort(() => Math.random() - 0.5)
      .slice(0, 8)
      .map((template, index) => ({
        title: template.replace('{topic}', topicName),
        heat: Math.floor(Math.random() * 100000) + 10000,
        sentiment: Math.random() * 2 - 1,
        source: NEWS_SOURCES[Math.floor(Math.random() * NEWS_SOURCES.length)].name,
        time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN')
      }))
      .sort((a, b) => b.heat - a.heat)

    return {
      topic: topicName,
      newsCount,
      timeSpan,
      sentiment: { positive, negative, neutral },
      engagement: {
        total: totalEngagement,
        average: averageEngagement,
        trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
        socialMedia: socialMediaData
      },
      sources: sourcesData,
      regions: selectedProvinces,
      keywords: keywordsData,
      timeline: timelineData,
      hotTopics: hotTopicsData
    }
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#0f172a', 
        color: 'white',
        paddingTop: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>📊</div>
          <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>正在加载话题数据...</div>
          <div style={{ fontSize: 16, color: '#94a3b8' }}>请稍候，正在分析舆情数据</div>
        </div>
      </div>
    )
  }

  if (!topicData) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#0f172a', 
        color: 'white',
        paddingTop: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>❌</div>
          <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>加载失败</div>
          <div style={{ fontSize: 16, color: '#94a3b8' }}>无法获取话题数据</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0f172a', 
      color: 'white',
      paddingTop: '64px',
      overflowX: 'hidden'
    }}>
      {/* Header */}
      <header style={{ 
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        padding: '32px 24px',
        borderBottom: '1px solid #334155'
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 12px 0', color: 'white' }}>
                {topicData.topic} 话题分析
              </h1>
              <p style={{ fontSize: 18, color: '#94a3b8', margin: 0 }}>
                实时监控 · 深度分析
              </p>
            </div>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              padding: '16px 24px', 
              borderRadius: 12,
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 4 }}>更新时间</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{new Date().toLocaleString('zh-CN')}</div>
            </div>
          </div>
          
          {/* Key Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            <div style={{ 
              background: 'rgba(59, 130, 246, 0.2)', 
              padding: '20px', 
              borderRadius: 12,
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              <div style={{ fontSize: 14, color: '#93c5fd', marginBottom: 8 }}>新闻总数</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#60a5fa' }}>{topicData.newsCount}</div>
              <div style={{ fontSize: 12, color: '#93c5fd' }}>条</div>
            </div>
            
            <div style={{ 
              background: 'rgba(16, 185, 129, 0.2)', 
              padding: '20px', 
              borderRadius: 12,
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <div style={{ fontSize: 14, color: '#6ee7b7', marginBottom: 8 }}>事件跨度</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#34d399' }}>{topicData.timeSpan.duration}</div>
              <div style={{ fontSize: 12, color: '#6ee7b7' }}>{topicData.timeSpan.start} ~ {topicData.timeSpan.end}</div>
            </div>
            
            <div style={{ 
              background: 'rgba(245, 158, 11, 0.2)', 
              padding: '20px', 
              borderRadius: 12,
              border: '1px solid rgba(245, 158, 11, 0.3)'
            }}>
              <div style={{ fontSize: 14, color: '#fcd34d', marginBottom: 8 }}>总参与度</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#fbbf24' }}>{topicData.engagement.total.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: '#fcd34d' }}>平均 {topicData.engagement.average.toLocaleString()}/条</div>
            </div>
            
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.2)', 
              padding: '20px', 
              borderRadius: 12,
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              <div style={{ fontSize: 14, color: '#fca5a5', marginBottom: 8 }}>情感分布</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#f87171' }}>
                {topicData.sentiment.positive}% 正面
              </div>
              <div style={{ fontSize: 12, color: '#fca5a5' }}>
                {topicData.sentiment.negative}% 负面 · {topicData.sentiment.neutral}% 中性
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 26vw) 1fr', gap: 32, marginBottom: 32 }}>
          {/* Timeline Chart */}
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.05)', 
            padding: '24px', 
            borderRadius: 16,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: 32
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 20px 0', color: 'white' }}>
              📈 话题热度趋势
            </h3>
            <div style={{ height: 300, position: 'relative' }}>
              {/* 横轴线 */}
              <div style={{
                position: 'absolute',
                bottom: 40, // 为日期标签留出空间
                left: 0,
                right: 0,
                height: '2px',
                background: 'rgba(255, 255, 255, 0.3)',
                zIndex: 1
              }} />
              
              {/* 柱状图容器 */}
              <div style={{ 
                height: 'calc(100% - 40px)', // 减去日期标签的高度
                display: 'flex', 
                alignItems: 'end', 
                gap: 2,
                position: 'relative',
                zIndex: 2
              }}>
                {topicData.timeline.map((item, index) => (
                  <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ 
                      width: '100%',
                      height: `${(item.engagement / Math.max(...topicData.timeline.map(t => t.engagement))) * 200}px`,
                      background: `linear-gradient(to top, ${item.sentiment > 0 ? '#10b981' : item.sentiment < 0 ? '#ef4444' : '#6b7280'}, ${item.sentiment > 0 ? '#34d399' : item.sentiment < 0 ? '#f87171' : '#9ca3af'})`,
                      borderRadius: '4px 4px 0 0',
                      minHeight: '4px',
                      transition: 'all 0.2s ease',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }} />
                  </div>
                ))}
              </div>
              
              {/* 日期标签 - 放在柱状图下方 */}
              <div style={{ 
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 40,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 10px'
              }}>
                {topicData.timeline.filter((_, index) => index % 5 === 0).map((item, index) => (
                  <div key={index} style={{ 
                    fontSize: 12, 
                    color: '#94a3b8',
                    textAlign: 'center',
                    flex: 1
                  }}>
                    {item.date.slice(5)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sentiment Distribution */}
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.05)', 
            padding: '24px', 
            borderRadius: 16,
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 20px 0', color: 'white' }}>
              😊 情感分析
            </h3>
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>正面</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    width: 120, 
                    height: 8, 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: `${topicData.sentiment.positive}%`, 
                      height: '100%', 
                      background: '#10b981',
                      borderRadius: 4
                    }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#10b981' }}>
                    {topicData.sentiment.positive}%
                  </span>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>负面</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    width: 120, 
                    height: 8, 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: `${topicData.sentiment.negative}%`, 
                      height: '100%', 
                      background: '#ef4444',
                      borderRadius: 4
                    }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#ef4444' }}>
                    {topicData.sentiment.negative}%
                  </span>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>中性</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    width: 120, 
                    height: 8, 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: `${topicData.sentiment.neutral}%`, 
                      height: '100%', 
                      background: '#6b7280',
                      borderRadius: 4
                    }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#6b7280' }}>
                    {topicData.sentiment.neutral}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Source Distribution and Regional Distribution */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
          {/* Source Distribution */}
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.05)', 
            padding: '24px', 
            borderRadius: 16,
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 20px 0', color: 'white' }}>
              📰 来源分布
            </h3>
            <div style={{ display: 'grid', gap: 12 }}>
              {topicData.sources.map((source, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8', fontSize: 14 }}>{source.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ 
                      width: 100, 
                      height: 6, 
                      background: 'rgba(255, 255, 255, 0.1)', 
                      borderRadius: 3,
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${source.percentage}%`, 
                        height: '100%', 
                        background: `hsl(${index * 60}, 70%, 60%)`,
                        borderRadius: 3
                      }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'white', minWidth: 40 }}>
                      {source.count}条
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Regional Distribution */}
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.05)', 
            padding: '24px', 
            borderRadius: 16,
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 20px 0', color: 'white' }}>
              🌍 地域分布
            </h3>
            <div style={{ display: 'grid', gap: 12 }}>
              {topicData.regions.map((region, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8', fontSize: 14 }}>{region.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ 
                      width: 100, 
                      height: 6, 
                      background: 'rgba(255, 255, 255, 0.1)', 
                      borderRadius: 3,
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${region.percentage}%`, 
                        height: '100%', 
                        background: `hsl(${index * 72}, 70%, 60%)`,
                        borderRadius: 3
                      }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'white', minWidth: 40 }}>
                      {region.count}条
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hot Topics */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.05)', 
          padding: '24px', 
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: 32
        }}>
          <h3 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 20px 0', color: 'white' }}>
            🔥 热门话题
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {topicData.hotTopics.map((topic, index) => (
              <div key={index} style={{ 
                background: 'rgba(255, 255, 255, 0.05)', 
                padding: '20px', 
                borderRadius: 12,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'white', lineHeight: 1.4 }}>
                  {topic.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{topic.source}</span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{topic.time}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ 
                    fontSize: 14, 
                    color: topic.sentiment > 0 ? '#10b981' : topic.sentiment < 0 ? '#ef4444' : '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    {topic.sentiment > 0 ? '😊 正面' : topic.sentiment < 0 ? '😞 负面' : '😐 中性'}
                  </div>
                  <div style={{ fontSize: 14, color: '#fbbf24', fontWeight: 600 }}>
                    🔥 {topic.heat.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Keywords Cloud */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.05)', 
          padding: '24px', 
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: 32
        }}>
          <h3 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 20px 0', color: 'white' }}>
            🔑 关键词云
          </h3>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 16, 
            justifyContent: 'center',
            minHeight: 120,
            alignItems: 'center'
          }}>
            {topicData.keywords.map((keyword, index) => (
              <div
                key={index}
                style={{
                  background: `rgba(${Math.random() * 100 + 100}, ${Math.random() * 100 + 100}, ${Math.random() * 100 + 100}, 0.2)`,
                  color: 'white',
                  padding: `${Math.max(8, keyword.weight * 20)}px ${Math.max(12, keyword.weight * 16)}px`,
                  borderRadius: 20,
                  fontSize: Math.max(12, keyword.weight * 16),
                  fontWeight: 600,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.1)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {keyword.word}
                <div style={{ 
                  fontSize: 10, 
                  color: 'rgba(255, 255, 255, 0.7)', 
                  marginTop: 4,
                  textAlign: 'center'
                }}>
                  {keyword.frequency}次
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
