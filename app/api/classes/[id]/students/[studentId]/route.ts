import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * 从班级中删除学生
 */
export async function DELETE(
    request: Request,
    { params }: { params: { id: string; studentId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user || session.user.role !== 'TEACHER') {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
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

        // 删除学生-班级关系
        await prisma.studentClass.delete({
            where: {
                studentId_classId: {
                    studentId: params.studentId,
                    classId: params.id,
                },
            },
        });

        return NextResponse.json({ message: "已从班级中移除学生" });
    } catch (error) {
        console.error('删除学生失败:', error);
        return NextResponse.json(
            { error: "删除失败", details: error instanceof Error ? error.message : '未知错误' },
            { status: 500 }
        );
    }
} 