import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
    request: Request,
    { params }: { params: { examId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
        }

        // 获取所有考生的成绩
        const results = await prisma.examinee.findMany({
            where: {
                examId: params.examId
            },
            select: {
                id: true,
                totalScore: true,
                name: true,
                studentId: true
            }
        });

        // 格式化数据以匹配前端接口
        const formattedResults = results.map(result => ({
            id: result.id,
            totalScore: result.totalScore || 0,
            examinee: {
                name: result.name,
                studentId: result.studentId
            }
        }));

        return NextResponse.json(formattedResults);
    } catch (error) {
        console.error('获取考试成绩失败:', error);
        return NextResponse.json(
            { error: "获取考试成绩失败" },
            { status: 500 }
        );
    }
} 