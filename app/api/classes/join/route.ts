import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: '未授权访问' }, { status: 401 });
        }

        const { classCode } = await request.json();
        if (!classCode) {
            return NextResponse.json({ error: '班级代码不能为空' }, { status: 400 });
        }

        // 查找班级
        const classInfo = await prisma.class.findUnique({
            where: { id: classCode },
            include: {
                exams: {
                    include: {
                        examinees: true
                    }
                }
            }
        });

        if (!classInfo) {
            return NextResponse.json({ error: '班级不存在' }, { status: 404 });
        }

        // 获取学生信息
        const student = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { studentId: true }
        });

        if (!student?.studentId) {
            return NextResponse.json({ error: '请先设置学号' }, { status: 400 });
        }

        // 开启事务处理
        const result = await prisma.$transaction(async (tx) => {
            // 1. 加入班级
            const joinClass = await tx.studentClass.create({
                data: {
                    studentId: session.user.id,
                    classId: classCode,
                    joinTime: new Date()
                }
            });

            // 2. 关联考试记录
            const examineesToConnect = classInfo.exams.map(exam => {
                const existingExaminee = exam.examinees.find(e => e.studentId === student.studentId);
                if (existingExaminee) {
                    return {
                        examId: exam.id,
                        examineeId: existingExaminee.id
                    };
                }
                return null;
            }).filter(Boolean);

            // 3. 创建考生关联记录
            if (examineesToConnect.length > 0) {
                await tx.user.update({
                    where: { id: session.user.id },
                    data: {
                        examinees: {
                            connect: examineesToConnect
                        }
                    }
                });
            }

            return joinClass;
        });

        return NextResponse.json({ 
            message: '加入班级成功',
            data: result
        });

    } catch (error: any) {
        console.error('加入班级失败:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: '你已经在这个班级中了' }, { status: 400 });
        }
        return NextResponse.json({ error: '加入班级失败' }, { status: 500 });
    }
} 