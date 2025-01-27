import json
import requests
import os
import re

def load_docs():
    """加载所有API文档"""
    docs = []
    docs_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'docs', 'api')
    
    if not os.path.exists(docs_path):
        return "文档不存在"
        
    for file in os.listdir(docs_path):
        if file.endswith('.md'):
            with open(os.path.join(docs_path, file), 'r', encoding='utf-8') as f:
                docs.append(f.read())
    return "\n\n".join(docs)

def extract_api_info(text, action):
    """从文档中提取相关API信息"""
    # 将文档按章节分割
    sections = re.split(r'##\s+', text)
    
    # 查找最相关的章节
    relevant_section = None
    max_relevance = 0
    
    for section in sections:
        relevance = sum(1 for word in action.lower().split() if word in section.lower())
        if relevance > max_relevance:
            max_relevance = relevance
            relevant_section = section
    
    return relevant_section if relevant_section else "未找到相关API信息"

def query_llama(prompt: str, mode: str = "qa") -> str:
    """
    与Ollama API交互
    mode: "qa" 或 "execute"
    """
    try:
        # 加载API文档
        docs = load_docs()
        
        # 根据模式构建不同的提示
        if mode == "qa":
            system_prompt = f"""你是一个智能助手，负责回答关于API使用的问题。
            以下是API文档内容：
            
            {docs}
            
            请根据以上文档回答用户的问题。如果问题超出文档范围，请告知用户。
            """
        else:  # execute mode
            # 提取相关API信息
            api_info = extract_api_info(docs, prompt)
            system_prompt = f"""你是一个智能助手，负责执行用户的命令。
            相关的API信息如下：
            
            {api_info}
            
            请解析用户的命令并提供执行建议。回答格式应该是JSON，包含：
            1. action: 要执行的动作
            2. endpoint: API端点
            3. method: HTTP方法
            4. data: 请求数据
            """
        
        # 构建消息列表
        messages = [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
        
        # 调用Ollama API
        response = requests.post(
            "http://localhost:11434/api/chat",
            json={
                "model": "llama3.2",
                "messages": messages,
                "stream": False
            }
        )
        
        if response.status_code == 200:
            return response.json()["message"]["content"]
        else:
            return f"Error: {response.status_code}"
            
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 2:
        mode = sys.argv[1]
        prompt = sys.argv[2]
        result = query_llama(prompt, mode)
        print(json.dumps({"response": result})) 