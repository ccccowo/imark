import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
    request: Request,
    { params }: { params: { examId: string } }
) {
    try {
        const examId = params.examId;

        // 获取该考试的所有答题记录
        const answerQuestions = await prisma.answerQuestion.findMany({
            where: {
                examId: examId,
            },
            include: {
                question: true,
                examinee: true,
            },
        });

        return NextResponse.json(answerQuestions);
    } catch (error) {
        console.error('获取答题记录失败:', error);
        return NextResponse.json(
            { error: '获取答题记录失败' },
            { status: 500 }
        );
    }
} 