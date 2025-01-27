import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
    request: Request,
    { params }: { params: { examId: string } }
) {
    try {
        const { status } = await request.json();

        // 验证所有题目是否都已批改
        const answers = await prisma.answerQuestion.findMany({
            where: {
                examId: params.examId
            }
        });

        const allGraded = answers.length > 0 && answers.every(answer => answer.isGraded);
        
        if (!allGraded) {
            return NextResponse.json({ 
                error: "还有未批改的题目" 
            }, { status: 400 });
        }

        // 更新考试状态
        const updatedExam = await prisma.exam.update({
            where: { id: params.examId },
            data: { status }
        });

        return NextResponse.json({
            success: true,
            data: updatedExam
        });

    } catch (error: any) {
        console.error('Update exam status failed:', error);
        return NextResponse.json({ 
            error: "更新状态失败",
            details: error.message
        }, { status: 500 });
    }
} 