import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// 导入学生到班级
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'TEACHER') {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
        }

        const { students } = await request.json();
        if (!Array.isArray(students) || students.length === 0) {
            return NextResponse.json({ error: "学生数据格式不正确" }, { status: 400 });
        }

        // 验证班级是否属于当前教师
        const classExists = await prisma.class.findFirst({
            where: {
                id: params.id,
                teacherId: session.user.id,
            },
        });

        if (!classExists) {
            return NextResponse.json({ error: "班级不存在或无权限" }, { status: 404 });
        }

        // 批量创建或更新学生记录
        const results = await prisma.$transaction(async (tx) => {
            const createdStudents = [];

            for (const student of students) {
                // 检查学生是否已存在（通过学号查找）
                let existingStudent = await tx.user.findFirst({
                    where: {
                        studentId: student.studentId,
                        role: 'STUDENT'
                    }
                });

                // 如果学生不存在，创建新学生
                if (!existingStudent) {
                    existingStudent = await tx.user.create({
                        data: {
                            name: student.name,
                            studentId: student.studentId,
                            username: student.studentId, // 使用学号作为用户名
                            password: student.studentId, // 使用学号作为初始密码
                            role: 'STUDENT'
                        }
                    });
                }

                // 检查学生是否已经在班级中
                const existingStudentClass = await tx.studentClass.findUnique({
                    where: {
                        studentId_classId: {
                            studentId: existingStudent.id,
                            classId: params.id
                        }
                    }
                });

                // 如果学生不在班级中，添加到班级
                if (!existingStudentClass) {
                    await tx.studentClass.create({
                        data: {
                            studentId: existingStudent.id,
                            classId: params.id,
                            joinTime: new Date()
                        }
                    });
                }

                createdStudents.push(existingStudent);
            }

            return createdStudents;
        });

        return NextResponse.json({
            success: true,
            message: `成功导入 ${results.length} 名学生`,
            students: results
        });

    } catch (error) {
        console.error('导入学生失败:', error);
        return NextResponse.json({
            error: "导入学生失败",
            details: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
} 