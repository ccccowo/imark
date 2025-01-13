import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// 删除班级
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 验证班级是否属于当前教师
    const classToDelete = await prisma.class.findFirst({
      where: {
        id: params.id,
        teacherId: session.user.id,
      },
    });

    if (!classToDelete) {
      return NextResponse.json({ error: "未找到班级" }, { status: 404 });
    }

    // 删除班级及相关数据
    await prisma.class.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
} 



