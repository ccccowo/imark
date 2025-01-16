import fs from 'fs/promises';
import path from 'path';

interface DeleteImageOptions {
  skipErrors?: boolean;  // 是否忽略错误继续执行
  logErrors?: boolean;   // 是否记录错误日志
}

/**
 * 删除单个图片文件
 * @param imagePath 图片相对路径（相对于public目录）
 * @param options 删除选项
 */
export async function deleteImage(imagePath: string, options: DeleteImageOptions = {}) {
  const { skipErrors = true, logErrors = true } = options;
  
  try {
    if (!imagePath) return;

    // 构建完整的文件路径
    const fullPath = path.join(process.cwd(), 'public', imagePath);
    
    // 检查文件是否存在
    try {
      await fs.access(fullPath);
    } catch {
      if (logErrors) {
        console.log(`文件不存在: ${fullPath}`);
      }
      return;
    }

    // 删除文件
    await fs.unlink(fullPath);
    
    if (logErrors) {
      console.log(`成功删除文件: ${fullPath}`);
    }
  } catch (error) {
    if (logErrors) {
      console.error('删除图片失败:', error);
    }
    if (!skipErrors) {
      throw error;
    }
  }
}

/**
 * 删除目录及其内容
 * @param dirPath 目录相对路径（相对于public目录）
 * @param options 删除选项
 */
export async function deleteDirectory(dirPath: string, options: DeleteImageOptions = {}) {
  const { skipErrors = true, logErrors = true } = options;
  
  try {
    if (!dirPath) return;

    const fullPath = path.join(process.cwd(), 'public', dirPath);
    
    // 检查目录是否存在
    try {
      await fs.access(fullPath);
    } catch {
      if (logErrors) {
        console.log(`目录不存在: ${fullPath}`);
      }
      return;
    }

    // 递归删除目录及其内容
    await fs.rm(fullPath, { recursive: true, force: true });
    
    if (logErrors) {
      console.log(`成功删除目录: ${fullPath}`);
    }
  } catch (error) {
    if (logErrors) {
      console.error('删除目录失败:', error);
    }
    if (!skipErrors) {
      throw error;
    }
  }
} 