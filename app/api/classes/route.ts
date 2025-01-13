import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

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

    if (session.user.role !== 'TEACHER') {
      return NextResponse.json(
        { error: "未授权", details: "只有教师可以创建班级" }, 
        { status: 401 }
      );
    }

    const { name } = await request.json();

    // 检查是否已存在同名班级
    const existingClass = await prisma.class.findFirst({
      where: {
        name,
        teacherId: session.user.id,
      },
    });

    if (existingClass) {
      return NextResponse.json(
        { error: "创建失败", details: `已存在名为"${name}"的班级` }, 
        { status: 400 }
      );
    }

    const newClass = await prisma.class.create({
      data: {
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
    // 处理 Prisma 的唯一约束错误
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "创建失败", details: `已存在名为"${name}"的班级` }, 
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "创建班级失败", details: error.message }, 
      { status: 500 }
    );
  }
} 

