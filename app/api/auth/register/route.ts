import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { username, password, role} = await request.json();

    // 详细的字段验证
    if (!username?.trim()) {
      return NextResponse.json({ 
        error: "用户名不能为空",
        code: "USERNAME_REQUIRED"
      }, { status: 400 });
    }

    // 检查用户名是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: "该用户名已被注册",
        code: "USERNAME_EXISTS"
      }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ 
        error: "密码至少需要6个字符",
        code: "INVALID_PASSWORD"
      }, { status: 400 });
    }

    if (!role || !['TEACHER', 'STUDENT'].includes(role)) {
      return NextResponse.json({ 
        error: "请选择有效的角色",
        code: "INVALID_ROLE"
      }, { status: 400 });
    }

    // 创建用户
    const hashedPassword = await hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: username,
        username,
        password: hashedPassword,
        role,
      }
    });

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      message: "注册成功"
    });

  } catch (error) {
    console.error('注册错误:', error);
    return NextResponse.json({ 
      error: "注册失败，请稍后重试",
      code: "INTERNAL_ERROR"
    }, { status: 500 });
  }
}