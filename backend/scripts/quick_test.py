#!/usr/bin/env python3
"""
快速测试后端API连通性的脚本
"""

import requests
import sys

def quick_test():
    """快速测试基本连通性"""
    base_url = "http://localhost:8000"
    
    print("🚀 快速测试后端API连通性")
    print(f"📍 目标服务器: {base_url}")
    print("-" * 40)
    
    # 测试健康检查
    try:
        print("🔍 测试健康检查端点...")
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ 健康检查成功 - 后端服务运行正常")
            data = response.json()
            print(f"   应用名称: {data.get('app', 'N/A')}")
            print(f"   状态: {data.get('status', 'N/A')}")
        else:
            print(f"❌ 健康检查失败: HTTP {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ 连接失败 - 后端服务器未启动或端口不正确")
        print("💡 请确保后端服务器正在运行在端口8000上")
        return False
    except requests.exceptions.Timeout:
        print("❌ 请求超时 - 后端服务器响应缓慢")
        return False
    except Exception as e:
        print(f"❌ 测试异常: {e}")
        return False
    
    # 测试API路由
    try:
        print("\n🔍 测试API路由...")
        response = requests.get(f"{base_url}/api/v1/report/history", timeout=5)
        if response.status_code == 200:
            print("✅ API路由正常 - 可以访问报告历史")
        else:
            print(f"⚠️  API路由响应异常: HTTP {response.status_code}")
            print("   这可能是正常的，取决于具体的业务逻辑")
    except Exception as e:
        print(f"⚠️  API路由测试异常: {e}")
    
    print("\n🎉 基本连通性测试完成！")
    print("💡 如果健康检查通过，说明后端服务运行正常")
    print("📖 访问 http://localhost:8000/docs 查看完整API文档")
    
    return True

if __name__ == "__main__":
    try:
        success = quick_test()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⏹️  测试被用户中断")
        sys.exit(1)
