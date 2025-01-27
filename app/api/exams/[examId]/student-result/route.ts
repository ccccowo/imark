import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { AnswerQuestion, Question } from '@prisma/client';

interface ExamAnswerQuestion extends AnswerQuestion {
    question: Question;
}

export async function GET(
    request: Request,
    { params }: { params: { examId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: '未授权访问' }, { status: 401 });
        }

        // 使用单个查询获取所有需要的数据
        const exam = await prisma.exam.findUnique({
            where: { id: params.examId },
            include: {
                examinees: {
                    where: {
                        studentId: session.user.id
                    },
                    include: {
                        student: {
                            select: {
                                name: true,
                                studentId: true
                            }
                        },
                        answerQuestions: {
                            include: {
                                question: true
                            },
                            orderBy: {
                                question: {
                                    orderNum: 'asc'
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!exam) {
            return NextResponse.json({ error: '未找到考试' }, { status: 404 });
        }

        const examinee = exam.examinees[0];
        if (!examinee) {
            return NextResponse.json({ error: '未找到考试记录' }, { status: 404 });
        }

        // 格式化返回数据
        const result = {
            examinee: {
                name: examinee.student.name,
                studentId: examinee.student.studentId
            },
            totalScore: examinee.answerQuestions.reduce((sum: number, aq: ExamAnswerQuestion) => 
                sum + (aq.teacherScore || 0), 0),
            answers: examinee.answerQuestions.map((answer: ExamAnswerQuestion) => ({
                id: answer.id,
                questionType: answer.question.type,
                orderNum: answer.question.orderNum,
                score: answer.question.score,
                teacherScore: answer.teacherScore || 0,
                teacherComment: answer.teacherComment,
                answerQuestionImage: answer.answerQuestionImage
            }))
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error('获取考试结果失败:', error);
        return NextResponse.json(
            { error: '获取考试结果失败' },
            { status: 500 }
        );
    }
} 