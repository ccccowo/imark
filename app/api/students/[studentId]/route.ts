import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * 将学生添加到班级的API端点
 * 
 * @route PUT /api/classes/{classId}/students/{studentId}
 * @access 仅限教师角色
 * 
 * @param {string} params.classId - 班级ID
 * @param {string} params.studentId - 学生ID
 * 
 * @returns {Object} 返回创建的学生-班级关系对象
 * @throws {401} 如果用户未登录或不是教师角色
 * @throws {404} 如果班级或学生不存在
 * @throws {500} 如果操作过程中发生错误
 */
export async function PUT(
  req: Request,
  { params }: { params: { classId: string; studentId: string } }
) {
  try {
    // 验证教师权限
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { classId, studentId } = params;

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

    // 创建学生-班级关系
    const studentClass = await prisma.studentClass.create({
      data: {
        studentId,
        classId,
      },
      include: {
        student: true,
        class: true,
      },
    });

    return NextResponse.json(studentClass);
  } catch (error) {
    return NextResponse.json({ error: "添加学生失败" }, { status: 500 });
  }
}

/**
 * 从班级中删除学生的API端点
 * 
 * @route DELETE /api/classes/{classId}/students/{studentId}
 * @access 仅限教师角色
 * 
 * @param {string} params.classId - 班级ID
 * @param {string} params.studentId - 学生ID
 * 
 * @returns {Object} 返回成功消息
 * @throws {401} 如果用户未登录或不是教师角色
 * @throws {404} 如果班级或学生不存在
 * @throws {500} 如果删除过程中发生错误
 */
export async function DELETE(
  req: Request,
  { params }: { params: { classId: string; studentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { classId, studentId } = params;

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

    // 删除学生-班级关系
    await prisma.studentClass.delete({
      where: {
        studentId_classId: {
          studentId,
          classId,
        },
      },
    });

    return NextResponse.json({ message: "已从班级中移除学生" });
  } catch (error) {
    return NextResponse.json({ error: "删除学生失败" }, { status: 500 });
  }
} 