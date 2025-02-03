import json
import logging
from vector_store.store_manager import VectorStoreManager
from ai_assistant import query_qwen
import traceback

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_vector_store():
    """测试向量存储和AI助手的联动"""
    try:
        # 初始化向量存储
        logger.info("初始化向量存储...")
        store = VectorStoreManager()
        
        # 测试用例
        test_cases = [
            "帮我创建一个班级，叫兰俊磊，科目是英语",
            "帮我创建一个班级",
            "帮我创建一个软工3班",
            "帮我创建一个教数学的班级",
            "我想开设一个新的班级",  # 测试语义相似性
            "删除班级",  # 测试其他动作
        ]
        
        for query in test_cases:
            logger.info(f"\n测试查询: {query}")
            
            # 1. 测试向量搜索
            result = store.query_prompt(query)
            if result:
                logger.info(f"找到匹配的提示词:")
                logger.info(f"- 动作: {result['metadata']['action']}")
                logger.info(f"- 描述: {result['metadata']['description']}")
                logger.info(f"- 相似度分数: {result['score']}")
            else:
                logger.warning("未找到匹配的提示词")
                continue
                
            # 2. 测试AI响应
            try:
                response = query_qwen(query, mode="execute")
                logger.info(f"AI响应: {response}")
                
                # 验证JSON格式
                response_data = json.loads(response)
                if "error" in response_data:
                    logger.error(f"AI响应错误: {response_data['error']}")
                else:
                    logger.info("响应格式正确")
                    
            except Exception as e:
                logger.error(f"AI响应处理失败: {str(e)}")
                logger.error(f"错误详情: {traceback.format_exc()}")
                
            logger.info("-" * 50)
            
    except Exception as e:
        logger.error(f"测试失败: {str(e)}")
        logger.error(f"错误详情: {traceback.format_exc()}")
        raise

if __name__ == "__main__":
    test_vector_store() 