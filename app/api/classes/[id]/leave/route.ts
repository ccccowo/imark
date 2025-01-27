import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: '未授权访问' }, { status: 401 });
        }

        // 检查班级是否存在
        const classExists = await prisma.class.findUnique({
            where: { id: params.id }
        });

        if (!classExists) {
            return NextResponse.json({ error: '班级不存在' }, { status: 404 });
        }

        // 检查是否已经在班级中
        const membership = await prisma.studentClass.findFirst({
            where: {
                studentId: session.user.id,
                classId: params.id
            }
        });

        if (!membership) {
            return NextResponse.json({ error: '你不在这个班级中' }, { status: 400 });
        }

        // 删除班级成员关系
        await prisma.studentClass.delete({
            where: {
                studentId_classId: {
                    studentId: session.user.id,
                    classId: params.id
                }
            }
        });

        return NextResponse.json({ message: '已退出班级' });
    } catch (error) {
        console.error('退出班级失败:', error);
        return NextResponse.json(
            { error: '退出班级失败' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: '未授权访问' }, { status: 401 });
        }

        // 检查班级是否存在
        const classExists = await prisma.class.findUnique({
            where: { id: params.id }
        });

        if (!classExists) {
            return NextResponse.json({ error: '班级不存在' }, { status: 404 });
        }

        // 检查是否已经在班级中
        const membership = await prisma.studentClass.findFirst({
            where: {
                studentId: session.user.id,
                classId: params.id
            }
        });

        if (!membership) {
            return NextResponse.json({ error: '你不在这个班级中' }, { status: 400 });
        }

        // 删除班级成员关系
        await prisma.studentClass.delete({
            where: {
                studentId_classId: {
                    studentId: session.user.id,
                    classId: params.id
                }
            }
        });

        return NextResponse.json({ message: '已退出班级' });
    } catch (error) {
        console.error('退出班级失败:', error);
        return NextResponse.json(
            { error: '退出班级失败' },
            { status: 500 }
        );
    }
} 