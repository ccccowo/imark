import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { getHandler } from '@/lib/handlers';
import axiosInstance from '@/lib/axios';
import path from 'path';

export async function POST(request: Request) {
    try {
        const { prompt, mode } = await request.json();
        const session = await getServerSession(authOptions);
        
        if (!session?.user) {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
        }

        // 设置服务器端的 baseURL 和认证
        axiosInstance.defaults.baseURL = 'http://localhost:3000';
        axiosInstance.defaults.headers.common['Cookie'] = request.headers.get('cookie') || '';
        
        // 获取Python脚本的绝对路径
        const scriptPath = path.join(process.cwd(), 'scripts', 'ai_assistant.py');
        
        // 执行 Python 脚本
        const result = await new Promise<string[]>((resolve, reject) => {
            console.log('执行Python脚本:', `python "${scriptPath}" ${mode} "${prompt}"`);
            
            exec(`python "${scriptPath}" ${mode} "${prompt}"`, 
                { 
                    encoding: 'utf8', 
                    maxBuffer: 1024 * 1024,
                    timeout: 30000 // 30秒超时
                },
                (error, stdout, stderr) => {
                    if (error) {
                        console.error('Python脚本执行错误:', error);
                        console.error('错误输出:', stderr);
                        reject(new Error(`执行失败: ${error.message}`));
                        return;
                    }
                    if (stderr) {
                        console.warn('Python警告:', stderr);
                    }
                    const lines = stdout.trim().split('\n');
                    if (lines.length === 0) {
                        reject(new Error('Python脚本没有输出'));
                        return;
                    }
                    resolve(lines);
                }
            );
        });

        // 解析最后一行 JSON
        const lastLine = result[result.length - 1];
        try {
            const lastJsonOutput = JSON.parse(lastLine);

            // 执行模式处理
            if (mode === 'execute') {
                const handler = getHandler(lastJsonOutput.action);
                if (!handler) {
                    return NextResponse.json({ 
                        error: `不支持的操作: ${lastJsonOutput.action}` 
                    }, { status: 400 });
                }

                console.log(`\n=== 执行操作: ${lastJsonOutput.action} ===`);
                console.log('数据:', lastJsonOutput.data);

                const result = await handler.handle(lastJsonOutput.data);
                if (!result.success) {
                    return NextResponse.json({ error: result.error }, { status: 400 });
                }

                return NextResponse.json({ response: result.response });
            }

            // 非执行模式，直接返回响应
            return NextResponse.json(lastJsonOutput);
            
        } catch (parseError) {
            console.error('JSON解析错误:', parseError);
            console.error('原始输出:', lastLine);
            return NextResponse.json({
                error: '无法解析AI响应'
            }, { status: 500 });
        }
        
    } catch (error: any) {
        console.error('处理错误:', error);
        return NextResponse.json({
            error: error.message || '处理失败'
        }, { status: 500 });
    }
}