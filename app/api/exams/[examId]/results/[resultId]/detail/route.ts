import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: { examId: string; resultId: string } }
) {
    try {
        // 获取考生信息
        const examinee = await prisma.examinee.findUnique({
            where: { id: params.resultId },
            select: {
                name: true,
                studentId: true,
                totalScore: true
            }
        });

        if (!examinee) {
            return NextResponse.json({ error: "考生信息不存在" }, { status: 404 });
        }

        // 获取答题详情
        const answers = await prisma.answerQuestion.findMany({
            where: {
                examId: params.examId,
                examineeId: params.resultId
            },
            include: {
                question: true
            },
            orderBy: {
                question: {
                    orderNum: 'asc'
                }
            }
        });

        // 整理返回数据
        const detail = {
            examinee: {
                name: examinee.name,
                studentId: examinee.studentId
            },
            totalScore: examinee.totalScore || 0,
            answers: answers.map(answer=> ({
                id: answer.id,
                questionType: answer.question.type,
                orderNum: answer.question.orderNum,
                score: answer.question.score,
                teacherScore: answer.teacherScore || 0,
                teacherComment: answer.teacherComment,
                answerQuestionImage: answer.answerQuestionImage
            }))
        };

        return NextResponse.json(detail);

    } catch (error: any) {
        console.error('Fetch detail failed:', error);
        return NextResponse.json({ 
            error: "获取详情失败",
            details: error.message
        }, { status: 500 });
    }
} 