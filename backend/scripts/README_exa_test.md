# Exa API 新闻搜索测试

这个目录包含了使用 Exa API 进行新闻搜索的测试脚本。

## 文件说明

### 1. `test_exa_news_search.py`

主要的测试脚本，包含完整的新闻搜索功能：

- **ExaNewsSearcher 类**: 封装了 Exa API 的搜索功能
- **search_news()**: 根据关键词和时间范围搜索新闻
- **get_content_details()**: 获取网页详细内容
- **save_results()**: 保存搜索结果到 models 文件夹

### 2. `example_exa_usage.py`

简化的使用示例，展示如何快速使用 Exa API：

- 搜索 AI 相关新闻
- 搜索研究论文
- 基本的结果展示和保存

## 使用方法

### 环境准备

1. 确保已设置 `EXA_API_KEY` 环境变量
2. 安装依赖：
   ```bash
   cd backend
   uv pip install aiohttp
   ```

### 运行测试

#### 完整测试（推荐）

```bash
cd backend/scripts
python test_exa_news_search.py
```

#### 单个搜索测试

```bash
cd backend/scripts
python test_exa_news_search.py single
```

#### 运行示例

```bash
cd backend/scripts
python example_exa_usage.py
```

## 搜索参数说明

### 基本参数

- `query`: 搜索关键词
- `start_date`: 开始日期 (ISO 8601 格式)
- `end_date`: 结束日期 (ISO 8601 格式)
- `num_results`: 返回结果数量 (最多 100 个)
- `category`: 搜索类别

### 支持的搜索类别

- `news`: 新闻
- `research paper`: 研究论文
- `company`: 公司信息
- `pdf`: PDF 文档
- `github`: GitHub 仓库
- `tweet`: 推文
- `personal site`: 个人网站
- `linkedin profile`: LinkedIn 档案
- `financial report`: 财务报告

### 时间格式示例

```python
# 最近7天
start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%dT00:00:00.000Z")
end_date = datetime.now().strftime("%Y-%m-%dT23:59:59.999Z")

# 2024年全年
start_date = "2024-01-01T00:00:00.000Z"
end_date = "2024-12-31T23:59:59.999Z"
```

## 输出结果

搜索结果会保存到 `backend/app/models/` 目录下，文件名格式：

- `exa_news_{关键词}_{时间戳}.json`
- `test_single_search.json` (单个测试)
- `ai_news_{时间戳}.json` (示例)

## 结果数据结构

```json
{
  "requestId": "唯一请求ID",
  "resolvedSearchType": "neural|keyword",
  "results": [
    {
      "title": "新闻标题",
      "url": "新闻链接",
      "publishedDate": "发布时间",
      "author": "作者",
      "text": "完整文本内容",
      "summary": "摘要",
      "highlights": ["高亮文本"],
      "highlightScores": [0.95],
      "image": "图片URL",
      "favicon": "网站图标"
    }
  ],
  "costDollars": {
    "total": 0.005,
    "breakDown": [...]
  }
}
```

## 注意事项

1. **API 限制**: 每次请求最多返回 100 个结果
2. **成本控制**: 每次搜索都有成本，注意监控使用量
3. **请求频率**: 脚本中已添加延迟，避免请求过于频繁
4. **错误处理**: 包含完整的异常处理机制

## 故障排除

### 常见错误

1. **API 密钥错误**

   ```
   错误: 未设置EXA_API_KEY环境变量
   ```

   解决：检查环境变量设置

2. **网络连接问题**

   ```
   搜索失败: Connection timeout
   ```

   解决：检查网络连接和防火墙设置

3. **请求限制**
   ```
   搜索失败: Rate limit exceeded
   ```
   解决：减少请求频率，增加延迟时间

## 扩展功能

可以基于这些脚本扩展更多功能：

1. **批量搜索**: 从文件读取多个关键词进行批量搜索
2. **内容分析**: 对搜索结果进行情感分析、关键词提取
3. **数据可视化**: 将搜索结果可视化展示
4. **定时任务**: 设置定时搜索任务
5. **数据库存储**: 将结果存储到数据库中

## 相关链接

- [Exa API 文档](https://docs.exa.ai/reference/search)
- [Exa API 定价](https://exa.ai/pricing)
- [Exa API 状态](https://status.exa.ai/)
