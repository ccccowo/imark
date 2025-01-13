import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  try {
    const { username, password, role } = await request.json();

    const user = await prisma.user.findFirst({
      where: { 
        username,
        role
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "用户名或密码错误" },
        { status: 400 }
      );
    }

    const isValid = await compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "用户名或密码错误" },
        { status: 400 }
      );
    }

    if (user.role !== role) {
      return NextResponse.json(
        { error: "用户身份不匹配" },
        { status: 400 }
      );
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        role: user.role,
        username: user.username 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: userWithoutPassword,
      token,
      message: "登录成功"
    });

  } catch (error) {
    console.error("登录错误:", error);
    return NextResponse.json(
      { error: "登录失败" },
      { status: 500 }
    );
  }
}