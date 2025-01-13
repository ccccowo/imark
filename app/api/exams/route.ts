import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * 创建新考试的API端点
 * 
 * @route POST /api/exams
 * @access 仅限教师角色
 * 
 * @param {Object} req.body
 * @param {string} req.body.name - 考试名称
 * @param {string} req.body.classId - 班级ID
 * 
 * @returns {Object} 返回创建的考试对象
 * @throws {401} 如果用户未登录或不是教师角色
 * @throws {500} 如果创建考试过程中发生错误
 */
export async function POST(req: Request) {
  try {
    // 验证用户会话和权限
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 从请求体中解析考试信息
    const { name, classId } = await req.json();

    // 在数据库中创建新考试
    const exam = await prisma.exam.create({
      data: {
        name,
        status: 'NOT_READY' as const, // 使用字符串字面量
        classId: classId,
      },
    });

    return NextResponse.json(exam);
  } catch (error) {
    return NextResponse.json({ error: "创建考试失败" }, { status: 500 });
  }
} 