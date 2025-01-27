import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { AnswerQuestion, Examinee } from '@prisma/client';

interface ExamineeWithAnswers extends Examinee {
    answerQuestions: AnswerQuestion[];
}

export async function POST(
    request: Request,
    { params }: { params: { examId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || session.user.role !== 'TEACHER') {
            return NextResponse.json({ error: '未授权访问' }, { status: 401 });
        }

        const { examineeId, questionId, score, comment } = await request.json();

        // 更新分数和评语
        await prisma.answerQuestion.update({
            where: {
                id: questionId
            },
            data: {
                teacherScore: score,
                teacherComment: comment
            }
        });

        // 计算该考生的总分
        const answers = await prisma.answerQuestion.findMany({
            where: {
                examineeId: examineeId
            }
        });

        const totalScore = answers.reduce((sum: number, answer: AnswerQuestion) => 
            sum + (answer.teacherScore || 0), 0);

        // 更新考生总分
        await prisma.examinee.update({
            where: {
                id: examineeId
            },
            data: {
                totalScore: totalScore
            }
        });

        // 检查是否所有考生的所有题目都已批改
        const exam = await prisma.exam.findUnique({
            where: { id: params.examId },
            include: {
                examinees: {
                    include: {
                        answerQuestions: true
                    }
                }
            }
        });

        if (exam) {
            // 检查是否所有题目都已批改
            const allGraded = exam.examinees.every((examinee: ExamineeWithAnswers) =>
                examinee.answerQuestions.every((answer: AnswerQuestion) => 
                    answer.teacherScore !== null)
            );

            if (allGraded) {
                // 更新考试状态为已完成
                await prisma.exam.update({
                    where: { id: params.examId },
                    data: { status: 'COMPLETED' }
                });

                return NextResponse.json({
                    message: '批改完成，所有试卷已批改完毕',
                    status: 'COMPLETED',
                    totalScore
                });
            }
        }

        return NextResponse.json({
            message: '保存成功',
            totalScore
        });
    } catch (error) {
        console.error('批改试卷失败:', error);
        return NextResponse.json(
            { error: '批改试卷失败' },
            { status: 500 }
        );
    }
} 