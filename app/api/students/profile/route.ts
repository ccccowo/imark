import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { hash } from 'bcryptjs';

// 获取学生个人信息
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'STUDENT') {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
        }

        const student = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                username: true,
                studentId: true,
                email: true,
            }
        });

        if (!student) {
            return NextResponse.json({ error: "用户不存在" }, { status: 404 });
        }

        return NextResponse.json(student);
    } catch (error) {
        console.error('获取个人信息失败:', error);
        return NextResponse.json(
            { error: "获取个人信息失败" },
            { status: 500 }
        );
    }
}

// 更新学生个人信息
export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'STUDENT') {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
        }

        const { name, studentId, currentPassword, newPassword } = await request.json();

        // 如果要更新密码，先验证当前密码
        if (currentPassword && newPassword) {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { password: true }
            });

            if (!user) {
                return NextResponse.json({ error: "用户不存在" }, { status: 404 });
            }

            // 验证当前密码
            const isValid = await bcrypt.compare(currentPassword, user.password);
            if (!isValid) {
                return NextResponse.json({ error: "当前密码错误" }, { status: 400 });
            }

            // 更新密码
            const hashedPassword = await hash(newPassword, 12);
            await prisma.user.update({
                where: { id: session.user.id },
                data: { password: hashedPassword }
            });
        }

        // 更新基本信息
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                ...(name && { name }),
                ...(studentId && { studentId })
            },
            select: {
                id: true,
                name: true,
                username: true,
                studentId: true,
                email: true,
            }
        });

        return NextResponse.json({
            message: "更新成功",
            user: updatedUser
        });

    } catch (error) {
        console.error('更新个人信息失败:', error);
        return NextResponse.json(
            { error: "更新个人信息失败", details: error instanceof Error ? error.message : '未知错误' },
            { status: 500 }
        );
    }
} 