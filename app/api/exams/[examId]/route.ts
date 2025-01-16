import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import fs from 'fs/promises';
import path from 'path';
import { deleteImage, deleteDirectory } from '@/lib/fileUtils';

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
    // 权限验证
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 使用事务确保数据一致性
    await prisma.$transaction(async (tx) => {
      // 1. 删除答题记录
      await tx.answerQuestion.deleteMany({
        where: { examId: params.examId }
      });

      // 2. 删除考试结果
      await tx.examResult.deleteMany({
        where: { examId: params.examId }
      });

      // 3. 删除考生名单
      await tx.examinee.deleteMany({
        where: { examId: params.examId }
      });

      // 4. 删除题目
      await tx.question.deleteMany({
        where: { examId: params.examId }
      });

      // 5. 最后删除考试
      const exam = await tx.exam.delete({
        where: { id: params.examId }
      });

      // 6. 删除相关文件
      try {
        // 删除样卷图片
        if (exam.paperImage) {
          await deleteImage(exam.paperImage);
        }

        // 删除答题图片目录
        const answersPath = path.join('uploads/answers', params.examId);
        await deleteDirectory(answersPath);
      } catch (error) {
        console.error('删除文件失败:', error);
        // 继续执行，不影响数据库操作
      }
    });

    return NextResponse.json({ 
      success: true,
      message: "考试及相关数据已删除"
    });

  } catch (error) {
    console.error('删除考试失败:', error);
    return NextResponse.json({ 
      error: "删除考试失败",
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 获取单个考试详情
export async function GET(
    request: Request,
    { params }: { params: { examId: string } }
) {
    try {
        // 权限验证
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
        }

        // 获取考试信息
        const exam = await prisma.exam.findUnique({
            where: { id: params.examId },
            include: {
                questions: {
                    orderBy: { orderNum: 'asc' }
                },
                class: true
            }
        });

        if (!exam) {
            console.error('考试不存在:', params.examId);
            return NextResponse.json({ error: "考试不存在" }, { status: 404 });
        }

        // 添加日志
        console.log('Retrieved exam:', {
            id: exam.id,
            name: exam.name,
            paperImage: exam.paperImage,
            questionsCount: exam.questions.length
        });

        return NextResponse.json(exam);
    } catch (error) {
        console.error('获取试卷信息失败:', error);
        return NextResponse.json({ 
            error: "获取试卷信息失败",
            details: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
} 