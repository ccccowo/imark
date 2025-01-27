import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// 获取班级详情
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const classInfo = await prisma.class.findUnique({
      where: {
        id: params.id
      },
      include: {
        teacher: {
          select: {
            name: true,
            username: true
          }
        },
        students: true,
        _count: {
          select: {
            students: true
          }
        }
      }
    });

    if (!classInfo) {
      return NextResponse.json({ error: "未找到班级" }, { status: 404 });
    }

    return NextResponse.json(classInfo);
  } catch (error) {
    console.error('获取班级信息失败:', error);
    return NextResponse.json(
      { error: "获取班级信息失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        // 权限验证
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'TEACHER') {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
        }

        // 使用事务确保数据一致性
        await prisma.$transaction(async (tx) => {
            // 1. 删除相关的考试记录
            await tx.exam.deleteMany({
                where: { classId: params.id }
            });

            // 2. 删除学生-班级关联
            await tx.studentClass.deleteMany({
                where: { classId: params.id }
            });

            // 3. 删除班级
            await tx.class.delete({
                where: { id: params.id }
            });
        });

        return NextResponse.json({ 
            success: true,
            message: "班级删除成功"
        });

    } catch (error) {
        console.error('删除班级失败:', error);
        return NextResponse.json({ 
            error: "删除班级失败",
            details: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
}



