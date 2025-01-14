import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 检查关系是否存在
    const relation = await prisma.studentClass.findFirst({
      where: {
        studentId: session.user.id,
        classId: params.id,
      },
    });

    if (!relation) {
      return NextResponse.json(
        { error: "未加入该班级" }, 
        { status: 404 }
      );
    }

    // 删除关系
    await prisma.studentClass.delete({
      where: {
        id: relation.id,
      },
    });

    return NextResponse.json({ message: "已退出班级" });
  } catch (error: any) {
    return NextResponse.json(
      { error: "退出班级失败", details: error.message }, 
      { status: 500 }
    );
  }
} 