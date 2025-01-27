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

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || session.user.role !== 'TEACHER') {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
        }

        const exams = await prisma.exam.findMany({
            where: {
                class: {
                    teacherId: session.user.id
                }
            },
            include: {
                class: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(exams);
    } catch (error: any) {
        console.error('Fetch exams failed:', error);
        return NextResponse.json({ 
            error: "获取考试列表失败",
            details: error.message
        }, { status: 500 });
    }
} 