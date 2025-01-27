import { NextResponse } from 'next/server';
import { PythonShell } from 'python-shell';
import path from 'path';

// 配置路由选项
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
    try {
        const { prompt, mode } = await request.json();
        console.log('收到请求:', { prompt, mode });

        const scriptPath = path.join(process.cwd(), 'scripts');
        console.log('Python脚本路径:', scriptPath);

        const options = {
            mode: 'text' as const,
            pythonPath: 'python',
            pythonOptions: ['-u'],
            scriptPath,
            args: [mode, prompt]
        };

        console.log('开始执行Python脚本...');
        const result = await PythonShell.run('ai_assistant.py', options);
        console.log('Python脚本执行结果:', result);
        
        if (!result || result.length === 0) {
            throw new Error('Python脚本没有返回结果');
        }
        
        const response = JSON.parse(result[0]);

        // 如果是执行模式，解析响应并执行相应操作
        if (mode === 'execute') {
            try {
                // 这里可以添加更多的命令解析
                if (prompt.toLowerCase().includes('创建班级')) {
                    const className = prompt.match(/班级(.+?)班/)?.[1] + '班';
                    const subject = prompt.match(/学科为(.+?)$/)?.[1];
                    
                    if (className && subject) {
                        const createClassResponse = await fetch('http://localhost:3000/api/classes', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                name: className,
                                subject: subject
                            })
                        });
                        
                        if (createClassResponse.ok) {
                            return NextResponse.json({
                                response: `已成功创建班级：${className}，学科：${subject}`
                            });
                        }
                    }
                }
            } catch (error) {
                console.error('执行命令失败:', error);
                throw error; // 向上传播错误
            }
        }

        return NextResponse.json(response);
    } catch (error: any) {
        console.error('AI助手请求失败:', error);
        return NextResponse.json(
            { error: '请求失败: ' + error.message },
            { status: 500 }
        );
    }
} 