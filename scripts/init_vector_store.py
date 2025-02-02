import sys
import logging
from pathlib import Path
from vector_store.store_manager import VectorStoreManager

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def init_vector_store() -> bool:
    """
    初始化向量存储
    :return: 是否初始化成功
    """
    try:
        logger.info("开始初始化向量存储...")
        
        # 确保目录存在
        store_dir = Path(__file__).parent / "vector_store" / "faiss_store"
        store_dir.parent.mkdir(parents=True, exist_ok=True)
        
        # 初始化向量存储
        store = VectorStoreManager()
        
        # 初始化默认提示词
        logger.info("开始初始化默认提示词...")
        store.initialize_prompts()
        
        logger.info("向量存储初始化完成！")
        return True
        
    except Exception as e:
        logger.error(f"初始化失败: {str(e)}")
        logger.error(f"错误详情: {type(e).__name__}")
        return False

def main():
    try:
        success = init_vector_store()
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        logger.info("用户中断初始化过程")
        sys.exit(1)
    except Exception as e:
        logger.error(f"未预期的错误: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 