import { NextResponse } from 'next/server';
import { PythonShell, Options } from 'python-shell';
import path from 'path';

// 尝试不同的 Python 路径，包括 Git Bash 风格的路径
const POSSIBLE_PYTHON_PATHS = [
  'python',
  'python3',
  '/c/Python39/python.exe',  // Git Bash 风格的路径
  '/c/Users/' + process.env.USERNAME + '/AppData/Local/Programs/Python/Python39/python.exe'
];

export async function POST(request: Request) {
  try {
    const { num1, num2 } = await request.json();

    // 尝试所有可能的 Python 路径
    let error = null;
    for (const pythonPath of POSSIBLE_PYTHON_PATHS) {
      try {
        const options: Options = {
          mode: 'text' as const,
          pythonPath,
          pythonOptions: ['-u'],
          scriptPath: path.join(process.cwd(), 'scripts').replace(/\\/g, '/'),  // 转换为 Unix 风格的路径
          args: [num1.toString(), num2.toString()]
        };

        console.log('尝试使用 Python 路径:', pythonPath);  // 添加调试日志
        const result = await PythonShell.run('calculator.py', options);
        return NextResponse.json({ result: result[0] });
      } catch (e) {
        console.error('当前路径失败:', pythonPath, e);  // 添加错误日志
        error = e;
        continue;
      }
    }

    // 如果所有路径都失败了
    throw error || new Error('无法找到 Python 解释器');
  } catch (error: any) {
    console.error('Python执行错误:', error);
    return NextResponse.json(
      { error: '计算失败: ' + error.message },
      { status: 500 }
    );
  }
}
