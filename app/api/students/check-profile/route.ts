import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'STUDENT') {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
        }

        const student = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                name: true,
                studentId: true,
            }
        });

        if (!student) {
            return NextResponse.json({ error: "用户不存在" }, { status: 404 });
        }

        const isProfileComplete = !!(student.name && student.studentId);

        return NextResponse.json({
            isComplete: isProfileComplete,
            profile: {
                name: student.name,
                studentId: student.studentId
            }
        });

    } catch (error) {
        console.error('检查个人信息失败:', error);
        return NextResponse.json(
            { error: "检查个人信息失败" },
            { status: 500 }
        );
    }
} 