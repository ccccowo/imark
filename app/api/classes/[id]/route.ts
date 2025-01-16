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

    // 获取搜索参数
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    // 查询班级和学生信息
    const classDetails = await prisma.class.findUnique({
      where: { 
        id: params.id 
      },
      include: {
        students: {
          where: search ? {
            student: {
              OR: [
                { name: { contains: search } },
                { studentId: { contains: search } }
              ]
            }
          } : undefined,
          include: {
            student: {
              select: {
                id: true,
                name: true,
                studentId: true,
              }
            }
          },
          // orderBy: {
          //   createdAt: 'desc'
          // }
        }
      }
    });

    if (!classDetails) {
      return NextResponse.json({ error: "班级不存在" }, { status: 404 });
    }

    // 格式化返回数据
    const formattedClass = {
      ...classDetails,
      students: classDetails.students.map((sc: any) => ({
        id: sc.student.id,
        name: sc.student.name || '',
        studentId: sc.student.studentId || sc.student.id,
        joinTime: sc.createdAt.toISOString(),
      }))
    };

    return NextResponse.json(formattedClass);
  } catch (error) {
    console.error('获取班级详情失败:', error);
    return NextResponse.json(
      { error: "获取班级详情失败", details: error instanceof Error ? error.message : '未知错误' },
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



