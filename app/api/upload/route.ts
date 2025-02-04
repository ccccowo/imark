import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { uploadToCOS, generateUniqueFileName } from '@/lib/cosUtils';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        
        if (!file) {
            return NextResponse.json({ error: "未找到文件" }, { status: 400 });
        }

        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: "只能上传图片文件" }, { status: 400 });
        }

        // 生成唯一文件名
        const fileName = generateUniqueFileName(file.name);

        // 将文件转换为 Buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // 上传到腾讯云 COS
        const imageUrl = await uploadToCOS(buffer, fileName);

        return NextResponse.json({ 
            success: true,
            url: imageUrl
        });
    } catch (error) {
        console.error('上传失败:', error);
        return NextResponse.json({ 
            error: "上传失败",
            details: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
} 