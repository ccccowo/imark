import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { callCozeApi } from '@/lib/cozeApi';

export async function POST(
    request: Request,
    { params }: { params: { examId: string } }
) {
    try {
        // 验证用户登录状态
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
        }

        const { answerId, imageUrl, score, correctAnswer } = await request.json();

        if (!answerId || !imageUrl || !score || correctAnswer === undefined) {
            return NextResponse.json({ error: "参数不完整" }, { status: 400 });
        }

        // 调用 Coze API
        const aiResponse = await callCozeApi(imageUrl, score, correctAnswer);

        // 更新数据库
        const updatedAnswer = await prisma.answerQuestion.update({
            where: {
                id: answerId
            },
            data: {
                aiScore: aiResponse.score,
                aiComment: aiResponse.comment,
                aiConfidence: 0.8, // 可以根据实际情况调整
                isGraded: true
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                aiScore: aiResponse.score,
                aiComment: aiResponse.comment,
                aiConfidence: 0.8
            }
        });

    } catch (error) {
        console.error('AI 批改失败:', error);
        return NextResponse.json({ 
            error: "AI 批改失败",
            details: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
} 