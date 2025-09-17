#!/usr/bin/env python3
"""
测试后端API连通性的脚本
"""

import requests
import json
import time
from typing import Dict, Any

# 后端服务器配置
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/v1"

def test_health_endpoint():
    """测试健康检查端点"""
    print("🔍 测试健康检查端点...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 健康检查成功: {data}")
            return True
        else:
            print(f"❌ 健康检查失败: HTTP {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ 健康检查请求异常: {e}")
        return False

def test_report_history():
    """测试报告历史端点"""
    print("\n🔍 测试报告历史端点...")
    try:
        response = requests.get(f"{API_BASE}/report/history", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 报告历史获取成功: {len(data)} 条记录")
            return True
        else:
            print(f"❌ 报告历史获取失败: HTTP {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ 报告历史请求异常: {e}")
        return False

def test_generate_report():
    """测试生成报告端点"""
    print("\n🔍 测试生成报告端点...")
    
    payload = {
        "topic": "人工智能发展趋势",
        "outline": ["技术发展", "应用场景", "未来展望"],
        "model": "deepseek-chat",
        "provider": "deepseek"
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/report", 
            json=payload, 
            timeout=30
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 报告生成成功")
            print(f"   报告长度: {len(data.get('report_markdown', ''))} 字符")
            print(f"   来源数量: {len(data.get('sources', []))}")
            return True
        else:
            print(f"❌ 报告生成失败: HTTP {response.status_code}")
            print(f"   错误信息: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ 报告生成请求异常: {e}")
        return False

def test_stream_report():
    """测试流式报告生成端点"""
    print("\n🔍 测试流式报告生成端点...")
    
    payload = {
        "topic": "机器学习基础",
        "outline": ["基本概念", "算法类型", "应用案例"],
        "model": "deepseek-chat",
        "provider": "deepseek"
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/report/stream", 
            json=payload, 
            stream=True,
            timeout=30
        )
        if response.status_code == 200:
            print("✅ 流式报告生成开始")
            chunk_count = 0
            for line in response.iter_lines():
                if line:
                    chunk_count += 1
                    if chunk_count <= 3:  # 只显示前3个chunk
                        print(f"   收到数据块 {chunk_count}: {line.decode()[:100]}...")
                    elif chunk_count == 4:
                        print(f"   ... 还有更多数据块")
                    if chunk_count > 10:  # 限制显示数量
                        break
            print(f"   总共收到 {chunk_count} 个数据块")
            return True
        else:
            print(f"❌ 流式报告生成失败: HTTP {response.status_code}")
            print(f"   错误信息: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ 流式报告生成请求异常: {e}")
        return False

def test_conversation_endpoints():
    """测试对话相关端点"""
    print("\n🔍 测试对话相关端点...")
    
    try:
        # 测试获取对话列表
        response = requests.get(f"{API_BASE}/conversations", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 对话列表获取成功: {len(data)} 条记录")
        else:
            print(f"❌ 对话列表获取失败: HTTP {response.status_code}")
            return False
        
        # 测试创建新对话
        chat_payload = {
            "message": "你好，请介绍一下人工智能的发展趋势",
            "history": [],
            "enableSearch": False
        }
        
        response = requests.post(f"{API_BASE}/chat", json=chat_payload, timeout=30)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 对话创建成功，对话ID: {data.get('conversationId', 'N/A')}")
            return True
        else:
            print(f"❌ 对话创建失败: HTTP {response.status_code}")
            print(f"   错误信息: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ 对话端点测试异常: {e}")
        return False

def test_news_endpoints():
    """测试新闻相关端点"""
    print("\n🔍 测试新闻相关端点...")
    
    try:
        # 测试获取热门话题
        response = requests.get(f"{API_BASE}/news/trending", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 热门话题获取成功: {len(data.get('topics', []))} 个话题")
        else:
            print(f"❌ 热门话题获取失败: HTTP {response.status_code}")
            return False
        
        # 测试话题分析
        response = requests.get(f"{API_BASE}/news/topic/人工智能", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 话题分析成功: {data.get('topic', 'N/A')}")
            print(f"   新闻数量: {data.get('newsCount', 0)}")
            return True
        else:
            print(f"❌ 话题分析失败: HTTP {response.status_code}")
            print(f"   错误信息: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ 新闻端点测试异常: {e}")
        return False

def main():
    """主测试函数"""
    print("🚀 开始测试后端API连通性")
    print(f"📍 目标服务器: {BASE_URL}")
    print("=" * 50)
    
    results = []
    
    # 测试各个端点
    results.append(("健康检查", test_health_endpoint()))
    results.append(("报告历史", test_report_history()))
    results.append(("生成报告", test_generate_report()))
    results.append(("流式报告", test_stream_report()))
    results.append(("对话端点", test_conversation_endpoints()))
    results.append(("新闻端点", test_news_endpoints()))
    
    # 显示测试结果摘要
    print("\n" + "=" * 50)
    print("📊 测试结果摘要:")
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"   {test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n🎯 总体结果: {passed}/{total} 个测试通过")
    
    if passed == total:
        print("🎉 所有API端点测试通过！后端服务运行正常。")
    else:
        print("⚠️  部分API端点测试失败，请检查后端服务状态。")
    
    return passed == total

if __name__ == "__main__":
    try:
        success = main()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⏹️  测试被用户中断")
        exit(1)
    except Exception as e:
        print(f"\n\n💥 测试过程中发生未预期的错误: {e}")
        exit(1)
