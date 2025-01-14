import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 基本查询测试
    const classes = await prisma.class.findMany({
      where: {
        students: {
          some: {
            studentId: session.user.id
          }
        }
      }
    });

    // 返回最基本的数据
    return NextResponse.json(classes.map(cls => ({
      id: cls.id,
      name: cls.name,
      _count: { students: 0 },
      examStatus: "未准备" as const,
      joinTime: new Date().toISOString()
    })));

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: "获取班级失败" }, { status: 500 });
  }
} 