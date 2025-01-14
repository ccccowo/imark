import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * 更新考试信息的API端点
 * 
 * @route PUT /api/exams/{examId}
 * @access 仅限教师角色
 * 
 * @param {Object} req.body
 * @param {string} req.body.name - 考试名称
 * @param {ExamStatus} req.body.status - 考试状态
 * @param {string} params.examId - 考试ID（URL参数）
 * 
 * @returns {Object} 返回更新后的考试对象
 * @throws {401} 如果用户未登录或不是教师角色
 * @throws {500} 如果更新考试过程中发生错误
 */
export async function PUT(
  req: Request,
  { params }: { params: { examId: string } }
) {
  try {
    // 验证用户会话和权限
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 从请求体中解析更新信息
    const { name } = await req.json();
    const { examId } = params;

    // 在数据库中更新考试信息
    const exam = await prisma.exam.update({
      where: { id: examId },
      data: {
        name,
      },
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

/**
 * 删除考试的API端点
 * 
 * @route DELETE /api/exams/{examId}
 * @access 仅限教师角色
 * 
 * @param {string} params.examId - 考试ID（URL参数）
 * 
 * @returns {Object} 返回成功消息
 * @throws {401} 如果用户未登录或不是教师角色
 * @throws {500} 如果删除考试过程中发生错误
 */
export async function DELETE(
  req: Request,
  { params }: { params: { examId: string } }
) {
  try {
    // 验证用户会话和权限
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { examId } = params;

    // 从数据库中删除考试
    await prisma.exam.delete({
      where: { id: examId },
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