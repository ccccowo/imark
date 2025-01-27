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
    if (!session?.user || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { name, subject } = await request.json();

    // 验证必填字段
    if (!name || !subject) {
      return NextResponse.json({ 
        error: "班级名称和科目为必填项" 
      }, { status: 400 });
    }

    // 创建班级
    const newClass = await prisma.class.create({
      data: {
        name,
        subject,
        teacherId: session.user.id,
      },
      include: {
        teacher: {
          select: {
            name: true,
            username: true
          }
        },
        _count: {
          select: {
            students: true
          }
        }
      }
    });

    return NextResponse.json(newClass);

  } catch (error: any) {
    console.error('创建班级失败:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: "该班级名称已存在" 
      }, { status: 400 });
    }
    return NextResponse.json({ 
      error: "创建班级失败",
      details: error.message
    }, { status: 500 });
  }
} 

