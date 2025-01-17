import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AIGradingService } from '@/app/services/ai-service';

export async function POST(
    request: Request,
    { params }: { params: { examId: string } }
) {
    try {
        const { answerId } = await request.json();
        console.log('Processing grade request for answerId:', answerId);

        // 获取答题记录
        const answer = await prisma.answerQuestion.findUnique({
            where: { id: answerId },
            include: {
                question: true
            }
        });

        if (!answer) {
            console.error('Answer record not found:', answerId);
            return NextResponse.json({ error: "答题记录不存在" }, { status: 404 });
        }

        console.log('Found answer record:', {
            id: answer.id,
            questionType: answer.question.type,
            imagePath: answer.answerQuestionImage
        });

        try {
            // 将图片转换为 base64
            const base64Image = await AIGradingService.imageToBase64(answer.answerQuestionImage);
            console.log('Successfully converted image to base64');

            // 调用 AI 批改
            const result = await AIGradingService.gradeAnswer(
                base64Image,
                answer.question.type,
                answer.question.correctAnswer || ''
            );
            console.log('AI grading result:', result);

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
        } catch (error: any) {
            console.error('AI grading failed:', error);
            return NextResponse.json({ 
                error: error.message || "AI批改失败",
                details: error.response?.data || error.message
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Request processing failed:', error);
        return NextResponse.json({ 
            error: "批改失败",
            details: error.message
        }, { status: 500 });
    }
} 