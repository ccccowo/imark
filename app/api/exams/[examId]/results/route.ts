import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: { examId: string } }
) {
    try {
        // 获取所有答题记录并按学生分组计算总分
        const answerQuestions = await prisma.answerQuestion.findMany({
            where: {
                examId: params.examId,
                isGraded: true
            },
            include: {
                examinee: true
            }
        });

        // 按考生分组并计算总分
        const examResults = Object.values(
            answerQuestions.reduce((acc: { [key: string]: any }, curr) => {
                if (!acc[curr.examineeId]) {
                    acc[curr.examineeId] = {
                        id: curr.examineeId,
                        studentId: curr.examinee.studentId,
                        score: 0,
                        student: {
                            name: curr.examinee.name,
                            studentId: curr.examinee.studentId
                        }
                    };
                }
                acc[curr.examineeId].score += curr.teacherScore || 0;
                return acc;
            }, {})
        );

        return NextResponse.json({
            success: true,
            results: examResults
        });

    } catch (error: any) {
        console.error('Fetch results failed:', error);
        return NextResponse.json({ 
            error: "获取成绩失败",
            details: error.message
        }, { status: 500 });
    }
} 