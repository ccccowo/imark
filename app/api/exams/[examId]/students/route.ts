import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// 获取考生列表
export async function GET(
    request: Request,
    { params }: { params: { examId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'TEACHER') {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
        }

        const examinees = await prisma.examinee.findMany({
            where: {
                examId: params.examId
            },
            orderBy: {
                studentId: 'asc'
            }
        });

        // 直接返回考生数组，不需要包装
        return NextResponse.json(examinees);
    } catch (error) {
        console.error('获取考生列表失败:', error);
        return NextResponse.json(
            { error: "获取考生列表失败" },
            { status: 500 }
        );
    }
}

// 添加考生（首次上传）
export async function POST(
    request: Request,
    { params }: { params: { examId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'TEACHER') {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
        }

        const { students } = await request.json();

        const examinees = await prisma.examinee.createMany({
            data: students.map((student: any) => ({
                name: student.name,
                studentId: student.studentId,
                examId: params.examId,
            })),
            skipDuplicates: true,
        });

        return NextResponse.json({ 
            message: `成功导入 ${examinees.count} 名考生`,
            count: examinees.count 
        });
    } catch (error) {
        console.error('导入考生失败:', error);
        return NextResponse.json(
            { error: "导入考生失败" },
            { status: 500 }
        );
    }
}

// 更新考生列表（重新上传）
export async function PUT(
    request: Request,
    { params }: { params: { examId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'TEACHER') {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
        }

        const { students } = await request.json();

        // 先删除原有考生
        await prisma.examinee.deleteMany({
            where: {
                examId: params.examId
            }
        });

        // 添加新考生
        const examinees = await prisma.examinee.createMany({
            data: students.map((student: any) => ({
                name: student.name,
                studentId: student.studentId,
                examId: params.examId,
            }))
            // 移除 skipDuplicates，因为已经清空了原有数据
        });

        return NextResponse.json({ 
            message: `成功更新 ${examinees.count} 名考生`,
            count: examinees.count 
        });
    } catch (error) {
        console.error('更新考生列表失败:', error);
        return NextResponse.json(
            { error: "更新考生列表失败" },
            { status: 500 }
        );
    }
} 