import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { username, password, role } = await request.json();

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

    // 检查用户名是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { 
        username 
      },
      select: {
        id: true,
        username: true,
        role: true
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "用户名已存在" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role,
        name: username,  // 使用用户名作为默认名称
      },
      select: {  // 明确指定返回字段
        id: true,
        username: true,
        role: true,
        name: true,
      }
    });

    return NextResponse.json({
      message: "注册成功",
      user
    });

  } catch (error) {
    console.error("注册失败:", error);
    return NextResponse.json(
      { error: "注册失败" },
      { status: 500 }
    );
  }
} 