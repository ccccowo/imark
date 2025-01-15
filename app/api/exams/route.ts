import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { name, classId } = await req.json();

    const exam = await prisma.exam.create({
      data: {
        name,
        status: 'READY',
        classId: classId,
      },
    });

    return NextResponse.json(exam);
  } catch (error) {
    return NextResponse.json({ error: "创建考试失败" }, { status: 500 });
  }
} 