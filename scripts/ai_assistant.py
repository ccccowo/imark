import json
from pathlib import Path
import requests
import os
import re
import sys
import io

# 设置标准输出编码
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 修改load_docs函数
def load_docs():
    docs = []
    docs_path = Path(__file__).resolve().parent.parent / "docs" / "api"
    
    # 首先加载 classes.md 文件（因为它包含基本信息）
    classes_file = docs_path / "classes.md"
    if classes_file.exists():
        try:
            with open(classes_file, "r", encoding="utf-8-sig") as f:
                content = f.read()
                # 提取基本信息部分
                if "# 基本信息" in content and "---" in content:
                    parts = content.split("---")
                    basic_info = parts[0].strip()
                    docs.append(basic_info)
                    # 如果有API文档部分，也添加进去
                    if len(parts) > 1:
                        api_docs = parts[1].strip()
                        docs.append(api_docs)
                else:
                    # 如果没有分隔符，就把整个内容作为一个部分
                    docs.append(content.strip())
        except UnicodeDecodeError:
            with open(classes_file, "r", encoding="gbk") as f:
                content = f.read()
                if "# 基本信息" in content and "---" in content:
                    parts = content.split("---")
                    basic_info = parts[0].strip()
                    docs.append(basic_info)
                    if len(parts) > 1:
                        api_docs = parts[1].strip()
                        docs.append(api_docs)
                else:
                    docs.append(content.strip())
    
    # 然后加载其他 API 文档
    for file in docs_path.glob("*.md"):
        if file.name != "classes.md":  # 跳过已处理的文件
            print(f"找到API文档文件: {file}")
            try:
                with open(file, "r", encoding="utf-8-sig") as f:
                    content = f.read()
                    docs.append(content)
            except UnicodeDecodeError:
                with open(file, "r", encoding="gbk") as f:
                    content = f.read()
                    docs.append(content)
    
    combined_docs = "\n\n".join(docs)
    print(f"总文档长度: {len(combined_docs)}")
    # 打印文档前200个字符，用于调试
    print(f"文档内容预览: {combined_docs[:200]}")
    return combined_docs

# 修改extract_api_info函数
def extract_api_info(text, action):
    # 直接返回完整文档内容，不进行分割和筛选
    return text

def query_llama(prompt: str, mode: str = "qa") -> str:
    try:
        # 加载文档并清理格式
        docs = load_docs()
        # 清理文档中的多余换行和空格
        docs = ' '.join(docs.split())
        
        # 构建消息数组
        messages = [
            {
                "role": "system",
                "content": """你是一个助手，你的任务是：
                1. 仔细阅读提供的文档内容
                2. 直接使用文档中的信息回答问题
                3. 不要推测或添加文档中没有的信息
                4. 如果文档中有明确的答案，直接引用文档回答"""
            },
            {
                "role": "user",
                "content": f"这是文档内容：\n{docs}\n\n请回答这个问题：{prompt}"
            }
        ]
        
        print("发送到Ollama的消息:", json.dumps(messages, ensure_ascii=False))
        
        response = requests.post(
            "http://localhost:11434/api/chat",
            json={
                "model": "deepseek-r1:1.5b",
                "messages": messages,
                "stream": False,
                "temperature": 0.1,  # 降低温度，使回答更确定
                "top_p": 0.1        # 降低随机性
            }
        )
        
        if response.status_code == 200:
            content = response.json()["message"]["content"]
            return content
        else:
            return f"Error: {response.status_code}"
            
    except Exception as e:
        return f"Error: {str(e)}"

# 修改main部分的打印逻辑
if __name__ == "__main__":
    try:
        if len(sys.argv) > 2:
            mode = sys.argv[1]
            prompt = sys.argv[2]
            result = query_llama(prompt, mode)
            
            # 只输出一个JSON响应
            print(json.dumps({"response": result}, ensure_ascii=False))
        else:
            print(json.dumps({"response": "缺少必要的参数"}, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"response": f"程序执行错误: {str(e)}"}, ensure_ascii=False))