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
        const docsPath = path.join(process.cwd(), 'docs', 'api');
        console.log('Python脚本路径:', scriptPath);
        console.log('文档路径:', docsPath);

        // 检查文档目录是否存在
        try {
            const fs = require('fs');
            const files = fs.readdirSync(docsPath);
            console.log('找到的文档文件:', files);
        } catch (error) {
            console.error('读取文档目录失败:', error);
        }

        const options = {
            mode: 'text' as const,
            pythonPath: 'python',
            pythonOptions: ['-u'],  // 使用无缓冲输出
            scriptPath,
            args: [mode, prompt],
            encoding: 'utf8' as const,
            env: { 
                ...process.env,
                PYTHONIOENCODING: 'utf8',
                PYTHONLEGACYWINDOWSSTDIO: '1'  // 在 Windows 上可能需要
            }
        };

        console.log('开始执行Python脚本，选项:', options);
        const result = await PythonShell.run('ai_assistant.py', options);
        console.log('Python脚本完整输出:', result);
        
        if (!result || result.length === 0) {
            throw new Error('Python脚本没有返回结果');
        }
        
        // 找到最后一个有效的 JSON 输出
        let lastJsonOutput = null;
        for (let i = result.length - 1; i >= 0; i--) {
            try {
                lastJsonOutput = JSON.parse(result[i]);
                break;
            } catch (e) {
                continue;
            }
        }
        
        if (!lastJsonOutput) {
            throw new Error('无法解析Python脚本的输出');
        }

        console.log('解析后的响应:', lastJsonOutput);

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
                throw error;
            }
        }

        return NextResponse.json(lastJsonOutput);
    } catch (error: any) {
        console.error('AI助手请求失败:', error);
        return NextResponse.json(
            { error: '请求失败: ' + error.message },
            { status: 500 }
        );
    }
} 