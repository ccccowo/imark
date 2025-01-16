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
        const data = await request.json();
        console.log('Received questions data:', data); // 添加日志

        // 首先删除该考试的所有现有题目
        await prisma.question.deleteMany({
            where: {
                examId: params.examId
            }
        });

        // 然后创建新的题目
        const questions = data.questions.map((q: any) => ({
            examId: params.examId,
            orderNum: q.orderNum,
            coordinates: JSON.stringify(q.coordinates),
            type: q.type || 'SHORT_ANSWER',
            score: q.score || 0
        }));

        console.log('Processed questions:', questions); // 添加日志

        // 使用事务确保数据一致性
        await prisma.$transaction(async (tx) => {
            await tx.question.createMany({
                data: questions
            });
        });

        // 获取保存后的题目进行验证
        const savedQuestions = await prisma.question.findMany({
            where: { examId: params.examId },
            orderBy: { orderNum: 'asc' }
        });
        console.log('Saved questions:', savedQuestions); // 添加日志

        return NextResponse.json({ 
            success: true,
            count: questions.length,
            savedCount: savedQuestions.length
        });
    } catch (error) {
        console.error('保存题目失败:', error);
        return NextResponse.json({ 
            error: "保存失败",
            details: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
} 