import json
from pathlib import Path
import requests
import os
import re
import sys
import io
from prompts import QA_SYSTEM_PROMPT, EXECUTE_SYSTEM_PROMPT
import traceback

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

def extract_json(content: str) -> str:
    """提取最后一个完整的 JSON 对象"""
    print("\n=== 开始提取JSON ===")
    print("原始内容:", repr(content))
    
    # 首先尝试提取 markdown 代码块中的 JSON
    json_blocks = re.findall(r'```(?:json)?\s*({[\s\S]*?})\s*```', content)
    if json_blocks:
        print("从markdown代码块中提取到JSON")
        json_str = json_blocks[-1]  # 取最后一个
    else:
        print("尝试直接提取JSON对象")
        # 使用更宽松的正则表达式
        pattern = r'{(?:[^{}]|{[^{}]*})*}'
        json_matches = re.findall(pattern, content)
        
        if not json_matches:
            # 如果还是找不到，尝试最简单的匹配
            json_matches = re.findall(r'{.*?}', content, re.DOTALL)
            
        if not json_matches:
            print("未找到JSON对象，原始内容：")
            print(content)
            raise ValueError("未找到有效的JSON格式")
            
        print(f"找到 {len(json_matches)} 个JSON对象")
        for i, match in enumerate(json_matches):
            print(f"JSON {i + 1}:", repr(match))
            
        json_str = json_matches[-1]  # 取最后一个
    
    # 清理 JSON 字符串
    print("\n原始JSON字符串:", repr(json_str))
    
    # 1. 移除换行和多余的空格
    json_str = re.sub(r'\s+', ' ', json_str).strip()
    print("清理空白后:", repr(json_str))
    
    # 2. 确保字段名称正确
    json_str = json_str.replace('"createclass"', '"create_class"')
    json_str = json_str.replace('"apiclasses"', '"/api/classes"')
    json_str = json_str.replace('：', ':')  # 处理中文冒号
    json_str = json_str.replace('，', ',')  # 处理中文逗号
    
    # 3. 验证 JSON 格式
    try:
        # 尝试解析确保是有效的 JSON
        parsed_json = json.loads(json_str)
        print("JSON 解析成功:", json.dumps(parsed_json, ensure_ascii=False, indent=2))
        return json_str
    except json.JSONDecodeError as e:
        print(f"JSON 验证失败: {e}")
        print("尝试处理的内容:", repr(json_str))
        raise ValueError(f"无效的JSON格式: {e}")

def query_llama(prompt: str, mode: str = "qa") -> str:
    try:
        docs = load_docs()
        docs = ' '.join(docs.split())
        
        if mode == "qa":
            messages = [
                {
                    "role": "system",
                    "content": QA_SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": f"这是文档内容：\n{docs}\n\n请回答问题：{prompt}"
                }
            ]
        else:  # execute mode
            messages = [
                {
                    "role": "system",
                    "content": EXECUTE_SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        
        print("\n=== 发送到AI的消息 ===")
        print(json.dumps(messages, ensure_ascii=False, indent=2))
        
        response = requests.post(
            "http://localhost:11434/api/chat",
            json={
                "model": "deepseek-r1:1.5b",
                "messages": messages,
                "stream": False,
                "temperature": 0.01,
                "top_p": 0.1,
                "num_predict": 256,
                "stop": ["\n\n", "```"]
            }
        )
        
        if response.status_code == 200:
            content = response.json()["message"]["content"].strip()
            print("\n=== AI原始响应 ===")
            print(repr(content))
            
            if mode == "execute":
                try:
                    # 提取和解析 JSON
                    json_str = extract_json(content)
                    result = json.loads(json_str)
                    
                    print("\n=== 解析后的JSON对象 ===")
                    print(json.dumps(result, ensure_ascii=False, indent=2))
                    
                    # 验证字段
                    required_fields = ["action", "endpoint", "method", "data"]
                    required_data_fields = ["name", "subject"]
                    
                    if not all(key in result for key in required_fields):
                        raise ValueError("缺少必要的字段")
                    if not all(key in result["data"] for key in required_data_fields):
                        raise ValueError("data中缺少必要的字段")
                    
                    # 确保字段值正确
                    result["action"] = "create_class"
                    result["endpoint"] = "/api/classes"
                    result["method"] = "POST"
                    
                    # 确保班级名称以"班"结尾
                    if not result["data"]["name"].endswith("班"):
                        result["data"]["name"] += "班"
                    
                    print("\n=== 最终处理后的JSON ===")
                    print(json.dumps(result, ensure_ascii=False, indent=2))
                    
                    return json.dumps(result, ensure_ascii=False)
                    
                except Exception as e:
                    print(f"\n=== 处理错误 ===")
                    print(f"错误类型: {type(e).__name__}")
                    print(f"错误信息: {str(e)}")
                    return json.dumps({
                        "error": f"处理失败: {str(e)}"
                    }, ensure_ascii=False)
            else:
                return json.dumps({
                    "response": content
                }, ensure_ascii=False)
        else:
            return json.dumps({
                "error": f"请求失败 ({response.status_code})"
            }, ensure_ascii=False)
            
    except Exception as e:
        print(f"\n=== 系统错误 ===")
        print(f"错误类型: {type(e).__name__}")
        print(f"错误信息: {str(e)}")
        return json.dumps({
            "error": f"系统错误: {str(e)}"
        }, ensure_ascii=False)

# 修改main部分的打印逻辑
if __name__ == "__main__":
    if len(sys.argv) > 2:
        mode = sys.argv[1]
        prompt = sys.argv[2]
        print(f"\n=== 接收到的参数 ===")
        print(f"模式: {mode}")
        print(f"提示: {prompt}")
        result = query_llama(prompt, mode)
        print("\n=== 最终输出 ===")
        print(result)
    else:
        print(json.dumps({
            "error": "缺少必要的参数"
        }, ensure_ascii=False))