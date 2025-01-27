import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Exam, Examinee } from '@prisma/client';

interface ExamWithCount extends Exam {
    examinees: Examinee[];
    _count: {
        examinees: number;
    };
}

// 获取班级的所有考试
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: '未授权访问' }, { status: 401 });
        }

        // 检查班级是否存在
        const classExists = await prisma.class.findUnique({
            where: { id: params.id }
        });

        if (!classExists) {
            return NextResponse.json({ error: '班级不存在' }, { status: 404 });
        }

        // 获取班级的所有考试，包括考生数量
        const exams = await prisma.exam.findMany({
            where: {
                classId: params.id
            },
            include: {
                examinees: true,
                _count: {
                    select: {
                        examinees: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // 格式化考试数据
        const formattedExams = exams.map((exam: ExamWithCount) => ({
            id: exam.id,
            name: exam.name,
            status: exam.status,
            createdAt: exam.createdAt,
            paperImage: exam.paperImage,
            fullScore: exam.fullScore,
            examinees: exam.examinees,
            examineeCount: exam._count.examinees
        }));

        return NextResponse.json(formattedExams);
    } catch (error) {
        console.error('获取考试列表失败:', error);
        return NextResponse.json(
            { error: '获取考试列表失败' },
            { status: 500 }
        );
    }
}

// 创建新考试
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user || session.user.role !== 'TEACHER') {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
        }

        const { name } = await request.json();

        const exam = await prisma.exam.create({
            data: {
                paperImage: '',
                name,
                status: 'READY',
                classId: params.id,
            }
        });

        return NextResponse.json(exam);
    } catch (error) {
        console.error('创建考试失败:', error);
        return NextResponse.json(
            { error: "创建考试失败" },
            { status: 500 }
        );
    }
} 