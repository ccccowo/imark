import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import fs from 'fs/promises';
import path from 'path';

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
    // 验证权限
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 获取考试信息
    const exam = await prisma.exam.findUnique({
      where: { id: params.examId }
    });

    if (!exam) {
      return NextResponse.json({ error: "考试不存在" }, { status: 404 });
    }

    // 使用事务确保数据一致性
    await prisma.$transaction(async (tx) => {
      // 1. 删除考试相关的考生记录
      await tx.examinee.deleteMany({
        where: { examId: params.examId }
      });

      // 2. 删除考试相关的题目记录
      await tx.question.deleteMany({
        where: { examId: params.examId }
      });

      // 3. 删除考试相关的成绩记录
      await tx.examResult.deleteMany({
        where: { examId: params.examId }
      });

      // 4. 删除考试记录
      await tx.exam.delete({
        where: { id: params.examId }
      });
    });

    // 5. 删除相关的试卷图片
    if (exam.paperImage) {
      try {
        const filePath = path.join(process.cwd(), 'public', exam.paperImage);
        await fs.unlink(filePath);
      } catch (error) {
        console.error('删除试卷图片失败:', error);
      }
    }

    return NextResponse.json({ message: "考试删除成功" });
  } catch (error) {
    console.error('删除考试失败:', error);
    return NextResponse.json(
      { error: "删除考试失败" },
      { status: 500 }
    );
  }
}

// 获取单个考试详情
export async function GET(
    request: Request,
    { params }: { params: { examId: string } }
) {
    try {
        // 验证权限
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
        }

        // 获取考试信息
        const exam = await prisma.exam.findUnique({
            where: {
                id: params.examId
            },
            include: {
                questions: true,  // 包含题目信息
                examinees: true   // 包含考生信息
            }
        });

        if (!exam) {
            return NextResponse.json({ error: "考试不存在" }, { status: 404 });
        }

        return NextResponse.json(exam);
    } catch (error) {
        console.error('获取考试详情失败:', error);
        return NextResponse.json(
            { error: "获取考试详情失败" },
            { status: 500 }
        );
    }
} 