import os
import json
import requests


def main():
    base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
    url = f"{base_url}/api/v1/report"

    payload = {
        "topic": "人工智能在医疗影像中的应用",
        "outline": [
            "背景与技术概述",
            "典型应用场景",
            "关键模型与算法",
            "数据与隐私合规",
            "挑战与未来趋势"
        ],
        "refinements": [
            "突出国内外研究进展对比",
            "补充近一年的最新成果与论文引用"
        ]
    }

    print("POST", url)
    try:
        resp = requests.post(url, json=payload, timeout=120)
    except Exception as e:
        print("Request failed:", e)
        return

    print("Status:", resp.status_code)
    try:
        data = resp.json()
        print("Response JSON keys:", list(data.keys()))
        print("\n--- Report (first 600 chars) ---\n")
        report = data.get("report_markdown", "")
        print(report[:600])
        print("\n--- Sources ---\n")
        print("\n".join(data.get("sources", [])))
    except json.JSONDecodeError:
        print("Raw response:\n", resp.text)


if __name__ == "__main__":
    main()
