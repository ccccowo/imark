import json
import os
from typing import List, Dict, Optional
from pathlib import Path
import faiss
import numpy as np
import requests
from dotenv import load_dotenv
from .prompts import PROMPTS

load_dotenv()

class VectorStoreManager:
    def __init__(self):
        # 初始化目录
        self.store_dir = os.path.join(os.path.dirname(__file__), "store")
        os.makedirs(self.store_dir, exist_ok=True)
        
        # 初始化 FAISS 索引
        self.vector_dim = 768  # BCE 模型的向量维度
        self.index = faiss.IndexFlatL2(self.vector_dim)
        
        # 存储提示词和元数据
        self.prompts: List[Dict] = []
        
        # API 配置
        self.api_key = os.getenv('SILICON_API_KEY')
        if not self.api_key:
            raise ValueError("未设置 SILICON_API_KEY 环境变量")
        
        # 加载已存在的数据
        self._load_store()
    
    def _get_embedding(self, text: str) -> np.ndarray:
        """通过 API 获取文本的向量表示"""
        response = requests.post(
            "https://api.siliconflow.cn/v1/embeddings",
            json={
                "model": "netease-youdao/bce-embedding-base_v1",
                "input": text,
                "encoding_format": "float"
            },
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
        )
        
        if response.status_code != 200:
            raise ValueError(f"API请求失败 ({response.status_code}): {response.text}")
            
        data = response.json()
        embedding = np.array(data['data'][0]['embedding'], dtype=np.float32)
        return embedding.reshape(1, -1)  # 转换为二维数组
    
    def add_prompt(self, 
                  prompt_id: str, 
                  content: str, 
                  metadata: Dict[str, str]) -> None:
        """添加提示词到向量存储"""
        # 获取文本向量
        embedding = self._get_embedding(content)
        
        # 添加到 FAISS 索引
        self.index.add(embedding)
        
        # 保存提示词和元数据
        self.prompts.append({
            'id': prompt_id,
            'content': content,
            'metadata': metadata
        })
        
        # 保存到文件
        self._save_store()
    
    def query_prompt(self, query: str, top_k: int = 1) -> Optional[Dict]:
        """查询最相关的提示词"""
        if not self.prompts:
            return None
            
        # 获取查询向量
        query_vector = self._get_embedding(query)
        
        # 搜索最相似的向量
        distances, indices = self.index.search(query_vector, top_k)
        
        # 如果找到匹配
        if len(indices) > 0 and indices[0][0] != -1:
            best_match = self.prompts[indices[0][0]]
            return {
                'content': best_match['content'],
                'metadata': best_match['metadata'],
                'score': float(distances[0][0])  # 相似度分数
            }
        
        return None
    
    def _save_store(self):
        """保存数据到文件"""
        # 保存提示词和元数据
        store_path = os.path.join(self.store_dir, "store.json")
        with open(store_path, 'w', encoding='utf-8') as f:
            json.dump(self.prompts, f, ensure_ascii=False, indent=2)
            
        # 保存 FAISS 索引
        index_path = os.path.join(self.store_dir, "index.faiss")
        faiss.write_index(self.index, index_path)
    
    def _load_store(self):
        """从文件加载数据"""
        store_path = os.path.join(self.store_dir, "store.json")
        index_path = os.path.join(self.store_dir, "index.faiss")
        
        if os.path.exists(store_path) and os.path.exists(index_path):
            # 加载提示词和元数据
            with open(store_path, 'r', encoding='utf-8') as f:
                self.prompts = json.load(f)
            
            # 加载 FAISS 索引
            self.index = faiss.read_index(index_path)
        else:
            # 初始化默认提示词
            self.initialize_prompts()
    
    def initialize_prompts(self):
        """初始化默认提示词"""
        for prompt in PROMPTS:
            self.add_prompt(
                prompt_id=prompt['id'],
                content=prompt['content'],
                metadata=prompt['metadata']
            ) 