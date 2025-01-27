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

        // 获取学生参与的所有考试
        const exams = await prisma.exam.findMany({
            where: {
                class: {
                    students: {
                        some: {
                            studentId: session.user.id
                        }
                    }
                }
            },
            select: {
                id: true,
                name: true,
                status: true,
                fullScore: true,
                createdAt: true,
                class: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                examinees: {
                    where: {
                        studentId: session.user.id
                    },
                    select: {
                        totalScore: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 5  // 只获取最近5条记录
        });

        const formattedExams = exams.map(exam => ({
            id: exam.id,
            name: exam.name,
            status: exam.status,
            className: exam.class.name,
            classId: exam.class.id,
            score: exam.examinees[0]?.totalScore || undefined,
            fullScore: exam.fullScore,
            examTime: exam.createdAt
        }));

        return NextResponse.json({
            success: true,
            exams: formattedExams
        });

    } catch (error: any) {
        console.error('获取最近考试失败:', error);
        return NextResponse.json(
            { error: "获取最近考试失败" },
            { status: 500 }
        );
    }
} 