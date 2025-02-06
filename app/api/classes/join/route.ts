import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: Request) {
    try {
        // 验证用户登录状态
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
        }

        // 获取请求数据
        const { classId } = await request.json();
        if (!classId) {
            return NextResponse.json({ error: "班级ID不能为空" }, { status: 400 });
        }

        // 检查班级是否存在
        const existingClass = await prisma.class.findUnique({
            where: { id: classId }
        });

        if (!existingClass) {
            return NextResponse.json({ error: "班级不存在" }, { status: 404 });
        }

        // 检查学生是否已经加入该班级
        const existingStudentClass = await prisma.studentClass.findUnique({
            where: {
                studentId_classId: {
                    studentId: session.user.id,
                    classId: classId
                }
            }
        });

        if (existingStudentClass) {
            return NextResponse.json({ error: "您已经加入过这个班级了" }, { status: 400 });
        }

        // 创建学生-班级关联
        const studentClass = await prisma.studentClass.create({
            data: {
                studentId: session.user.id,
                classId: classId,
                joinTime: new Date()
            }
        });

        return NextResponse.json({ 
            success: true,
            message: "成功加入班级",
            data: studentClass
        });

    } catch (error) {
        console.error('加入班级失败:', error);
        return NextResponse.json({ 
            error: "加入班级失败",
            details: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
} 