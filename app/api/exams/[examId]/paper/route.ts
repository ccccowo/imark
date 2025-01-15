import { NextResponse } from 'next/server';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function POST(
    request: Request,
    { params }: { params: { examId: string } }
) {
    try {
        // 验证权限
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'TEACHER') {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
        }

        // 获取文件
        const formData = await request.formData();
        const file = formData.get('paper');

        if (!file) {
            return NextResponse.json({ error: "未找到文件" }, { status: 400 });
        }

        // 保存文件
        const uploadDir = path.join(process.cwd(), 'public/uploads');
        await fs.mkdir(uploadDir, { recursive: true });

        const fileName = `${Date.now()}.jpg`;
        const filePath = path.join(uploadDir, fileName);
        const imageUrl = `/uploads/${fileName}`;
        
        const bytes = await (file as Blob).arrayBuffer();
        await fs.writeFile(filePath, Buffer.from(bytes));

        // 更新数据库
        try {
            const imageUrl = `/uploads/${fileName}`;
            await prisma.exam.update({
                where: {
                    id: params.examId
                },
                data: {
                    paperImage: imageUrl
                }
            });

            return NextResponse.json({ imageUrl });
        } catch (dbError) {
            console.error('Database error:', dbError);
            return NextResponse.json({ 
                error: '数据库更新失败',
                details: dbError instanceof Error ? dbError.message : String(dbError)
            }, { status: 500 });
        }
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({ 
            error: '服务器错误',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 