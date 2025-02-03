import json
from pathlib import Path
import requests
import os
import re
import sys
import io
from dotenv import load_dotenv
from vector_store.store_manager import VectorStoreManager

# 设置标准输出编码
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
load_dotenv()

# 初始化向量存储
vector_store = VectorStoreManager()

# 加载文档
def load_docs():
    docs = []
    docs_path = Path(__file__).resolve().parent.parent / "docs" / "api"
    
    # 加载 classes.md
    classes_file = docs_path / "classes.md"
    if classes_file.exists():
        docs.append(read_file_with_fallback(classes_file))
    
    # 加载其他 API 文档
    for file in docs_path.glob("*.md"):
        if file.name != "classes.md":
            print(f"找到API文档文件: {file}")
            docs.append(read_file_with_fallback(file))
    
    combined_docs = "\n\n".join(docs)
    return combined_docs

# 读取文件
def read_file_with_fallback(file_path, encodings=('utf-8-sig', 'gbk')):
    for encoding in encodings:
        try:
            with open(file_path, "r", encoding=encoding) as f:
                content = f.read().strip()
                if "# 基本信息" in content and "---" in content:
                    parts = content.split("---")
                    return parts[0].strip() + (f"\n\n{parts[1].strip()}" if len(parts) > 1 else "")
                return content
        except UnicodeDecodeError:
            continue
    raise ValueError(f"无法使用任何编码读取文件: {file_path}")

# 处理message
def handle_message(prompt: str, mode: str = "qa") -> list:
    if mode == "qa":
        system_prompt = "你是一个问题回答助手，请根据文档内容回答问题"
        docs = load_docs()
        docs = ' '.join(docs.split())
        user_content = f"这是文档内容：\n{docs}\n\n请回答问题：{prompt}"
    else:
        # 从向量存储中查找最匹配的提示词
        result = vector_store.query_prompt(prompt)
        if result is None:
            raise ValueError("未找到匹配的提示词")
            
        system_prompt = result['content']
        user_content = prompt
        print(f"使用提示词: {result['metadata']['description']}, 相似度分数: {result['score']}")
        
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content}
    ]

# 提取JSON
def extract_json(content: str) -> str:
    json_blocks = re.findall(r'```(?:json)?\s*({[\s\S]*?})\s*```', content)
    if json_blocks:
        json_str = json_blocks[-1]
    else:
        pattern = r'{(?:[^{}]|{[^{}]*})*}'
        json_matches = re.findall(pattern, content) or re.findall(r'{.*?}', content, re.DOTALL)
        if not json_matches:
            raise ValueError("未找到有效的JSON格式")
        json_str = json_matches[-1]
    
    json_str = re.sub(r'\s+', ' ', json_str).strip()
    json_str = json_str.replace('"createclass"', '"create_class"')\
                      .replace('"apiclasses"', '"/api/classes"')\
                      .replace('：', ':')\
                      .replace('，', ',')
    
    try:
        json.loads(json_str)  # 验证JSON格式
        return json_str
    except json.JSONDecodeError as e:
        raise ValueError(f"无效的JSON格式: {e}")

# 处理AI响应
def process_ai_response(content: str, mode: str) -> str:
    if mode != "execute":
        return json.dumps({"response": content}, ensure_ascii=False)
        
    try:
        json_str = extract_json(content)
        result = json.loads(json_str)
        
        # 根据不同的 action 使用不同的验证规则
        if result.get("action") == "create_class":
            # 创建班级的验证规则
            required_fields = ["action", "endpoint", "method", "data"]
            required_data_fields = ["name", "subject"]
            
            if not all(key in result for key in required_fields):
                raise ValueError("缺少必要的字段")
                
            if not all(key in result["data"] for key in required_data_fields):
                raise ValueError("data中缺少必要的字段")
            
            # 确保班级名称以"班"结尾
            if not result["data"]["name"].endswith("班"):
                result["data"]["name"] += "班"
                
        elif result.get("action") == "delete_class":
            # 删除班级的验证规则
            required_fields = ["action", "endpoint", "method", "data"]
            if not all(key in result for key in required_fields):
                raise ValueError("缺少必要的字段")
            
            # 删除班级不需要验证 data 字段
            
        return json.dumps(result, ensure_ascii=False)
        
    except Exception as e:
        return json.dumps({
            "error": f"处理失败: {str(e)}",
            "raw_response": content
        }, ensure_ascii=False)

# 查询模型
def query_model(url: str, payload: dict, headers: dict) -> tuple:
    response = requests.request("POST", url, json=payload, headers=headers)
    if response.status_code != 200:
        raise ValueError(f"请求失败 ({response.status_code}): {response.text}")
    return response.json()

# 查询DeepSeek模型
def query_deepseek(prompt: str, mode: str = "qa") -> str:
    try:
        messages = handle_message(prompt, mode)
        response_data = query_model(
            "http://localhost:11434/api/chat",
            {
                "model": "deepseek-r1:1.5b",
                "messages": messages,
                "stream": False,
                "temperature": 0.01,
                "top_p": 0.1,
                "num_predict": 256,
                "stop": ["\n\n", "```"]
            },
            {}
        )
        content = response_data["message"]["content"].strip()
        return process_ai_response(content, mode)
    except Exception as e:
        return json.dumps({"error": f"系统错误: {str(e)}"}, ensure_ascii=False)

# 查询Qwen模型
def query_qwen(prompt: str, mode: str = "qa") -> str:
    try:
        api_key = os.getenv('SILICON_API_KEY')
        if not api_key:
            return json.dumps({"error": "未设置 SILICON_API_KEY 环境变量"}, ensure_ascii=False)
            
        messages = handle_message(prompt, mode)
        response_data = query_model(
            "https://api.siliconflow.cn/v1/chat/completions",
            {
                "model": "Qwen/Qwen2.5-7B-Instruct",
                "messages": messages,
                "stream": False,
                "max_tokens": 256,
                "temperature": 0.01,
                "top_p": 0.1,
                "frequency_penalty": 0,
                "presence_penalty": 0
            },
            {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            }
        )
        content = response_data["choices"][0]["message"]["content"].strip()
        return process_ai_response(content, mode)
    except Exception as e:
        return json.dumps({"error": f"系统错误: {str(e)}"}, ensure_ascii=False)

# 主函数
if __name__ == "__main__":
    if len(sys.argv) > 2:
        mode = sys.argv[1]
        prompt = sys.argv[2]
        result = query_qwen(prompt, mode)
        print(result)
    else:
        print(json.dumps({"error": "缺少必要的参数"}, ensure_ascii=False))