import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'STUDENT') {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
        }

        // 获取学生所有已批改的考试成绩
        const examResults = await prisma.answerQuestion.findMany({
            where: {
                examinee: {
                    student: {
                        id: session.user.id
                    }
                },
                isGraded: true,
                exam: {
                    status: 'COMPLETED'  // 只获取已完成批改的考试
                }
            },
            include: {
                exam: {
                    select: {
                        id: true,
                        name: true,
                        fullScore: true,
                        class: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });

        // 按考试分组计算总分
        const groupedResults = examResults.reduce((acc: { [key: string]: any }, curr) => {
            if (!acc[curr.examId]) {
                acc[curr.examId] = {
                    examId: curr.examId,
                    examName: curr.exam.name,
                    fullScore: curr.exam.fullScore,
                    className: curr.exam.class.name,
                    classId: curr.exam.class.id,
                    score: 0
                };
            }
            acc[curr.examId].score += curr.teacherScore || 0;
            return acc;
        }, {});

        return NextResponse.json({
            success: true,
            grades: Object.values(groupedResults)
        });

    } catch (error: any) {
        console.error('获取成绩失败:', error);
        return NextResponse.json(
            { error: "获取成绩失败" },
            { status: 500 }
        );
    }
} 