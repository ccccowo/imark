import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// 获取班级的所有考试
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        // 验证权限
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
        }

        // 获取考试列表
        const exams = await prisma.exam.findMany({
            where: {
                classId: params.id
            },
            include: {
                examinees: true  // 包含考生信息
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(exams);
    } catch (error) {
        console.error('获取考试列表失败:', error);
        return NextResponse.json(
            { error: '获取考试列表失败' }, 
            { status: 500 }
        );
    }
}

// 创建新考试
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user || session.user.role !== 'TEACHER') {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
        }

        const { name } = await request.json();

        const exam = await prisma.exam.create({
            data: {
                paperImage: '',
                name,
                status: 'READY',
                classId: params.id,
            }
        });

        return NextResponse.json(exam);
    } catch (error) {
        console.error('创建考试失败:', error);
        return NextResponse.json(
            { error: "创建考试失败" },
            { status: 500 }
        );
    }
} 