import json
import os
from typing import List, Dict, Optional
from pathlib import Path

class VectorStoreManager:
    def __init__(self):
        # 设置持久化目录
        self.store_dir = os.path.join(os.path.dirname(__file__), "store")
        os.makedirs(self.store_dir, exist_ok=True)
        
        # 存储提示词和元数据
        self.prompts: List[Dict] = []
        
        # 加载已存在的数据
        self._load_store()
    
    def _save_store(self):
        """保存数据到文件"""
        store_path = os.path.join(self.store_dir, "store.json")
        with open(store_path, 'w', encoding='utf-8') as f:
            json.dump(self.prompts, f, ensure_ascii=False, indent=2)
    
    def _load_store(self):
        """从文件加载数据"""
        store_path = os.path.join(self.store_dir, "store.json")
        if os.path.exists(store_path):
            with open(store_path, 'r', encoding='utf-8') as f:
                self.prompts = json.load(f)
    
    def add_prompt(self, 
                  prompt_id: str, 
                  content: str, 
                  metadata: Dict[str, str]) -> None:
        """添加提示词"""
        self.prompts.append({
            'id': prompt_id,
            'content': content,
            'metadata': metadata,
            'keywords': metadata.get('keywords', '').split(',')
        })
        self._save_store()

    def query_prompt(self, query: str) -> Optional[Dict]:
        """查询最相关的提示词"""
        if not self.prompts:
            return None
            
        # 简单的关键词匹配
        query = query.lower()
        best_match = None
        max_matches = 0
        
        for prompt in self.prompts:
            matches = 0
            # 检查每个关键词
            for keyword in prompt['keywords']:
                if keyword.strip() and keyword.lower() in query:
                    matches += 1
            
            # 更新最佳匹配
            if matches > max_matches:
                max_matches = matches
                best_match = {
                    'content': prompt['content'],
                    'metadata': prompt['metadata']
                }
        
        return best_match if max_matches > 0 else None

    def initialize_prompts(self) -> None:
        """初始化默认提示词"""
        # 创建班级的提示词
        create_class_prompt = """你是一个严格的API调用解析助手。你的任务是从用户指令中提取班级名称和科目信息。

如果信息不完整，使用以下默认值：
- 默认班级名称：临时班级+4位随机数（如：临时班级1234）
- 默认科目名称：未知科目

输出格式必须是：
{
  "action": "create_class",
  "endpoint": "/api/classes",
  "method": "POST",
  "data": {
    "name": "班级名称",
    "subject": "科目名称"
  }
}

严格规则：
1. action 必须是 "create_class"
2. endpoint 必须是 "/api/classes"
3. method 必须是 "POST"
4. 如果用户没有提供班级名称，使用"临时班级"加4位随机数（1000-9999之间）
5. 如果用户没有提供科目，使用"未知科目"
6. 如果提供了信息，直接使用用户的输入，不要修改

示例1：
输入：帮我创建一个班级，叫兰俊磊，科目是英语
输出：{"action":"create_class","endpoint":"/api/classes","method":"POST","data":{"name":"兰俊磊","subject":"英语"}}

示例2：
输入：帮我创建一个班级
输出：{"action":"create_class","endpoint":"/api/classes","method":"POST","data":{"name":"临时班级3721","subject":"未知科目"}}

示例3：
输入：帮我创建一个软工3班
输出：{"action":"create_class","endpoint":"/api/classes","method":"POST","data":{"name":"软工3班","subject":"未知科目"}}

示例4：
输入：帮我创建一个教数学的班级
输出：{"action":"create_class","endpoint":"/api/classes","method":"POST","data":{"name":"临时班级8456","subject":"数学"}}

记住：
1. 信息缺失时使用默认值
2. 默认班级名称必须加上4位随机数
3. 有信息时使用用户提供的内容
4. 不要修改用户提供的内容
5. 只返回JSON，不要其他内容""" 

        # 添加提示词到存储
        prompts = [
            {
                'id': 'create_class',
                'content': create_class_prompt,
                'metadata': {
                    'action': 'create_class',
                    'description': '创建班级',
                    'keywords': '创建,新建,开设,班级'
                }
            },
            {
                'id': 'delete_class',
                'content': delete_class_prompt,
                'metadata': {
                    'action': 'delete_class',
                    'description': '删除班级',
                    'keywords': '删除,移除,班级'
                }
            }
        ]

        for prompt in prompts:
            self.add_prompt(
                prompt_id=prompt['id'],
                content=prompt['content'],
                metadata=prompt['metadata']
            ) 