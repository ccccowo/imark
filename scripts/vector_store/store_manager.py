import chromadb
from chromadb.config import Settings
import os
from typing import List, Dict, Optional

class VectorStoreManager:
    def __init__(self):
        # 设置持久化目录
        persist_dir = os.path.join(os.path.dirname(__file__), "chroma_db")
        
        # 初始化 ChromaDB
        self.client = chromadb.Client(Settings(
            persist_directory=persist_dir,
            is_persistent=True
        ))
        
        # 获取或创建 prompts collection
        self.collection = self.client.get_or_create_collection(
            name="prompts",
            metadata={"description": "AI助手提示词集合"}
        )

    def add_prompt(self, 
                  prompt_id: str, 
                  content: str, 
                  metadata: Dict[str, str]) -> None:
        """
        添加提示词到向量存储
        :param prompt_id: 提示词唯一标识
        :param content: 提示词内容
        :param metadata: 元数据，包含 action 等信息
        """
        self.collection.add(
            ids=[prompt_id],
            documents=[content],
            metadatas=[metadata]
        )

    def query_prompt(self, query: str, n_results: int = 1) -> Optional[Dict]:
        """
        查询最相关的提示词
        :param query: 用户输入
        :param n_results: 返回结果数量
        :return: 匹配到的提示词信息
        """
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        if not results['documents'][0]:
            return None
            
        return {
            'content': results['documents'][0][0],
            'metadata': results['metadatas'][0][0]
        }

    def initialize_prompts(self) -> None:
        """
        初始化默认提示词
        """
        # 创建班级的提示词
        create_class_prompt = """你是一个严格的API调用解析助手。你的任务是从用户指令中提取班级名称和科目信息。

如果信息不完整，使用以下默认值：
- 默认班级名称：临时班级+4位随机数（如：临时班级1234）
- 默认科目名称：未知科目

输出格式必须是：
{
  "action": "create_class",
  "data": {
    "name": "班级名称",
    "subject": "科目名称"
  }
}

严格规则：
1. 如果用户没有提供班级名称，使用"临时班级"加4位随机数（1000-9999之间）
2. 如果用户没有提供科目，使用"未知科目"
3. 如果提供了信息，直接使用用户的输入，不要修改
4. 只返回JSON，不要其他内容"""

        # 删除班级的提示词
        delete_class_prompt = """你是一个严格的API调用解析助手。你的任务是从用户指令中提取要删除的班级ID。

输出格式必须是：
{
  "action": "delete_class",
  "data": {
    "classId": "班级ID"
  }
}

严格规则：
1. classId 必须提供
2. 只返回JSON，不要其他内容"""

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