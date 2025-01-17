import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AIGradingService } from '@/app/services/ai-service';

export async function POST(
    request: Request,
    { params }: { params: { examId: string } }
) {
    try {
        const { answerId } = await request.json();

        // 获取答题记录
        const answer = await prisma.answerQuestion.findUnique({
            where: { id: answerId },
            include: {
                question: true
            }
        });

        if (!answer) {
            return NextResponse.json({ error: "答题记录不存在" }, { status: 404 });
        }

        // 将图片转换为 base64
        const base64Image = await AIGradingService.imageToBase64(answer.answerQuestionImage);

        // 调用 AI 批改
        const result = await AIGradingService.gradeAnswer(
            base64Image,
            answer.question.type,
            answer.question.correctAnswer
        );

        // 更新答题记录
        const updatedAnswer = await prisma.answerQuestion.update({
            where: { id: answerId },
            data: {
                aiScore: result.score,
                aiComment: result.comment,
                aiConfidence: result.confidence,
                isGraded: false // AI 批改后仍需教师确认
            }
        });

        return NextResponse.json({
            success: true,
            data: updatedAnswer
        });

    } catch (error) {
        console.error('批改失败:', error);
        return NextResponse.json({ error: "批改失败" }, { status: 500 });
    }
} 