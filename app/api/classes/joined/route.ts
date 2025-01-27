import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// 获取该学生已加入的班级
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 获取学生加入的班级信息
    const studentClasses = await prisma.studentClass.findMany({
      where: {
        studentId: session.user.id
      },
      include: {
        class: {
          include: {
            _count: {
              select: {
                students: true
              }
            }
          }
        }
      },
      orderBy: {
        joinTime: 'desc'
      }
    });

    // 格式化返回数据
    const formattedClasses = studentClasses.map(sc => ({
      id: sc.class.id,
      name: sc.class.name,
      subject: sc.class.subject,
      _count: sc.class._count,
      examStatus: "未准备" as const,
      joinTime: sc.joinTime.toISOString()
    }));

    return NextResponse.json(formattedClasses);

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: "获取班级失败" }, { status: 500 });
  }
} 