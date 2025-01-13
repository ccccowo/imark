import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, role } = body;

    // 验证必填字段
    if (!username || !password || !role) {
      return NextResponse.json(
        { error: "用户名、密码和角色是必填的" },
        { status: 400 }
      );
    }

    // 验证角色是否有效
    if (role !== "TEACHER" && role !== "STUDENT") {
      return NextResponse.json(
        { error: "无效的用户角色" },
        { status: 400 }
      );
    }

    // 检查用户是否存在（同一角色下用户名不能重复）
    const existingUser = await prisma.user.findFirst({
      where: {
        AND: [
          { username },
          { role }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: `该用户名已被其他${role === "TEACHER" ? "教师" : "学生"}使用` },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email: email || null, // 邮箱可选
        password: hashedPassword,
        role
      }
    });

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: userWithoutPassword,
      message: `${role === "TEACHER" ? "教师" : "学生"}注册成功`
    });

  } catch (error: any) {
    console.error("注册错误:", error);
    return NextResponse.json(
      { error: "注册失败: " + error.message },
      { status: 500 }
    );
  }
}