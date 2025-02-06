import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
    request: Request,
    { params }: { params: { examId: string; studentId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
        }

        // 获取考生答题记录
        const examinee = await prisma.examinee.findFirst({
            where: {
                examId: params.examId,
                studentId: params.studentId
            },
            include: {
                answerQuestions: {
                    orderBy: {
                        question: {
                            orderNum: 'asc'
                        }
                    },
                    include: {
                        question: true
                    }
                }
            }
        });

        if (!examinee) {
            return NextResponse.json({ error: "未找到考生记录" }, { status: 404 });
        }

        // 格式化返回数据
        const result = {
            examinee: {
                name: examinee.name,
                studentId: examinee.studentId
            },
            totalScore: examinee.totalScore,
            answers: examinee.answerQuestions.map(answer => ({
                id: answer.id,
                questionType: answer.question.type,
                orderNum: answer.question.orderNum,
                score: answer.question.score,
                teacherScore: answer.teacherScore || 0,
                teacherComment: answer.teacherComment,
                aiScore: answer.aiScore,
                aiComment: answer.aiComment,
                answerQuestionImage: answer.answerQuestionImage
            }))
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error('获取考生答题详情失败:', error);
        return NextResponse.json(
            { error: "获取考生答题详情失败" },
            { status: 500 }
        );
    }
} 