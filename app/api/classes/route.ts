import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { generateClassId } from '@/lib/utils';

// 获取班级列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const where = {
      teacherId: session.user.id,
      ...(name ? { name: { contains: name } } : {}),
    };

    const classes = await prisma.class.findMany({
      where,
      include: {
        _count: {
          select: { students: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(classes);
  } catch (error) {
    return NextResponse.json({ error: "获取班级失败" }, { status: 500 });
  }
}

// 创建班级
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "未授权", details: "请先登录" }, 
        { status: 401 }
      );
    }

    const { name } = await request.json();

    // 生成唯一的班级ID
    let classId = generateClassId();
    let isUnique = false;
    
    while (!isUnique) {
      const existingClass = await prisma.class.findUnique({
        where: { id: classId },
      });
      if (!existingClass) {
        isUnique = true;
      } else {
        classId = generateClassId();
      }
    }

    // 创建班级
    const newClass = await prisma.class.create({
      data: {
        id: classId, // 使用生成的ID
        name,
        teacherId: session.user.id,
      },
      include: {
        _count: {
          select: { students: true }
        }
      }
    });

    return NextResponse.json(newClass);
  } catch (error: any) {
    console.error('创建班级失败:', error);
    return NextResponse.json(
      { error: "创建班级失败", details: error.message }, 
      { status: 500 }
    );
  }
} 

