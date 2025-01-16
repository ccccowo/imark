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
        const questions = await prisma.question.findMany({
            where: { examId: params.examId },
            orderBy: { orderNum: 'asc' }
        });

        console.log('Retrieved questions:', questions); // 添加日志

        // 确保 coordinates 被正确解析
        const processedQuestions = questions.map(q => ({
            ...q,
            coordinates: JSON.parse(String(q.coordinates))
        }));

        console.log('Processed questions for response:', processedQuestions); // 添加日志

        return NextResponse.json(processedQuestions);
    } catch (error) {
        console.error('获取题目失败:', error);
        return NextResponse.json({ 
            error: "获取失败",
            details: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
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

        const { questions, fullScore } = await request.json();

        // 首先删除该考试的所有现有题目
        await prisma.question.deleteMany({
            where: { examId: params.examId }
        });

        // 使用事务确保数据一致性
        await prisma.$transaction(async (tx) => {
            // 创建题目
            await tx.question.createMany({
                data: questions.map(question => ({
                    examId: params.examId,
                    orderNum: question.orderNum,
                    coordinates: JSON.stringify(question.coordinates),
                    score: question.score,
                    type: question.type || 'SHORT_ANSWER'
                }))
            });

            // 更新考试总分
            await tx.exam.update({
                where: { id: params.examId },
                data: { fullScore }
            });
        });

        return NextResponse.json({ 
            success: true,
            message: "题目和分数设置成功" 
        });
    } catch (error) {
        console.error('保存题目失败:', error);
        return NextResponse.json({ 
            error: "保存题目失败",
            details: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
} 