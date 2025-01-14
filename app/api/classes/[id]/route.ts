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
          orderBy: {
            createdAt: 'desc'
          }
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



