import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
    request: Request,
    { params }: { params: { examId: string } }
) {
    try {
        const { answerId, score, comment } = await request.json();

        // 验证输入
        if (typeof score !== 'number' || score < 0) {
            return NextResponse.json({ error: "分数格式不正确" }, { status: 400 });
        }

        // 获取答题记录和题目信息
        const answer = await prisma.answerQuestion.findUnique({
            where: { id: answerId },
            include: { question: true }
        });

        if (!answer) {
            return NextResponse.json({ error: "答题记录不存在" }, { status: 404 });
        }

        // 验证分数不超过题目满分
        if (score > answer.question.score) {
            return NextResponse.json({ 
                error: `分数不能超过题目满分 ${answer.question.score}分` 
            }, { status: 400 });
        }

        // 更新答题记录
        const updatedAnswer = await prisma.answerQuestion.update({
            where: { id: answerId },
            data: {
                teacherScore: score,
                teacherComment: comment,
                isGraded: true // 教师批改后标记为已批改
            }
        });

        // 更新考生总分
        await updateExamineeScore(answer.examineeId);

        return NextResponse.json({
            success: true,
            data: updatedAnswer
        });

    } catch (error: any) {
        console.error('Teacher grading failed:', error);
        return NextResponse.json({ 
            error: "保存失败",
            details: error.message
        }, { status: 500 });
    }
}

// 更新考生总分的辅助函数
async function updateExamineeScore(examineeId: string) {
    // 获取该考生的所有已批改答题记录
    const answers = await prisma.answerQuestion.findMany({
        where: {
            examineeId: examineeId,
            isGraded: true,
            teacherScore: { not: null }
        }
    });

    // 计算总分
    const totalScore = answers.reduce((sum, answer) => sum + (answer.teacherScore || 0), 0);

    // 更新考生总分
    await prisma.examinee.update({
        where: { id: examineeId },
        data: { totalScore: totalScore }
    });
} 