import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * 批量添加学生到班级的API端点
 * 
 * @route POST /api/classes/{classId}/students/batch
 * @access 仅限教师角色
 * 
 * @param {Object} req.body
 * @param {string[]} req.body.studentIds - 学生ID数组
 * @param {string} params.classId - 班级ID
 * 
 * @returns {Object} 返回创建的学生-班级关系对象数组
 * @throws {401} 如果用户未登录或不是教师角色
 * @throws {404} 如果班级不存在
 * @throws {500} 如果操作过程中发生错误
 */
export async function POST(
  req: Request,
  { params }: { params: { classId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { studentIds } = await req.json();
    const { classId } = params;

    // 验证班级是否属于当前教师
    const classExists = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: session.user.id,
      },
    });

    if (!classExists) {
      return NextResponse.json({ error: "班级不存在或无权限" }, { status: 404 });
    }

    // 批量创建学生-班级关系
    const studentClasses = await prisma.$transaction(
      studentIds.map((studentId: string) =>
        prisma.studentClass.create({
          data: {
            studentId,
            classId,
          },
          include: {
            student: true,
          },
        })
      )
    );

    return NextResponse.json(studentClasses);
  } catch (error) {
    return NextResponse.json({ error: "批量添加学生失败" }, { status: 500 });
  }
}
