import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// 获取题目列表
export async function GET(
    request: Request,
    { params }: { params: { examId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
        }

        // 获取题目列表
        const questions = await prisma.question.findMany({
            where: {
                examId: params.examId
            },
            orderBy: {
                orderNum: 'asc'
            }
        });

        return NextResponse.json(questions);
    } catch (error) {
        console.error('获取题目列表失败:', error);
        return NextResponse.json(
            { error: "获取题目列表失败" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: Request,
    { params }: { params: { examId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'TEACHER') {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
        }

        const { questions } = await request.json();

        // 使用事务确保数据一致性
        await prisma.$transaction(async (tx) => {
            // 1. 删除原有题目
            await tx.question.deleteMany({
                where: { examId: params.examId }
            });

            // 2. 批量创建新题目
            await tx.question.createMany({
                data: questions.map((q: any) => ({
                    examId: params.examId,
                    orderNum: q.orderNum,
                    coordinates: q.coordinates,
                    type: 'SINGLE_CHOICE', // 默认题型，可以后续修改
                    score: 0 // 默认分值，可以后续修改
                }))
            });

            // 3. 更新考试状态
            await tx.exam.update({
                where: { id: params.examId },
                data: { status: 'READY' }
            });
        });

        return NextResponse.json({ message: "题目保存成功" });
    } catch (error) {
        console.error('保存题目失败:', error);
        return NextResponse.json(
            { error: "保存题目失败" },
            { status: 500 }
        );
    }
} 