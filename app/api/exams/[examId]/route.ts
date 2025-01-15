import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// 更新考试
export async function PUT(
  request: Request,
  { params }: { params: { examId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { name } = await request.json();
    const { examId } = params;

    const exam = await prisma.exam.update({
      where: { id: examId },
      data: { name }
    });

    return NextResponse.json(exam);
  } catch (error) {
    console.error('更新考试失败:', error);
    return NextResponse.json(
      { error: "更新考试失败" },
      { status: 500 }
    );
  }
}

// 删除考试
export async function DELETE(
  request: Request,
  { params }: { params: { examId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { examId } = params;

    await prisma.exam.delete({
      where: { id: examId }
    });

    return NextResponse.json({ message: "考试已删除" });
  } catch (error) {
    console.error('删除考试失败:', error);
    return NextResponse.json(
      { error: "删除考试失败" },
      { status: 500 }
    );
  }
} 