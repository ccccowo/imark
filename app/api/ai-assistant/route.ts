import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { getHandler } from '@/lib/handlers';
import axiosInstance from '@/lib/axios';

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
        
        // 执行 Python 脚本
        const result = await new Promise<string[]>((resolve, reject) => {
            exec(`python scripts/ai_assistant.py ${mode} "${prompt}"`, 
                { encoding: 'utf8', maxBuffer: 1024 * 1024 },
                (error, stdout, stderr) => {
                    if (error) {
                        console.error('Python脚本执行错误:', error);
                        reject(error);
                        return;
                    }
                    resolve(stdout.trim().split('\n'));
                }
            );
        });

        // 解析最后一行 JSON
        const lastLine = result[result.length - 1];
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
        
    } catch (error: any) {
        console.error('处理错误:', error);
        return NextResponse.json({
            error: error.message || '处理失败'
        }, { status: 500 });
    }
}