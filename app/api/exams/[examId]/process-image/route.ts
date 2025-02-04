import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { uploadToCOS } from '@/lib/cosUtils';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(
  request: Request,
  { params }: { params: { examId: string } }
) {
  try {
    // 验证用户登录状态
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const answerId = formData.get('answerId') as string;

    if (!file || !answerId) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }

    // 检查答题记录是否存在
    const answer = await prisma.answerQuestion.findUnique({
      where: { id: answerId }
    });

    if (!answer) {
      return NextResponse.json({ error: '答题记录不存在' }, { status: 404 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const cosUrl = await uploadToCOS(buffer, file.name);

    // 更新数据库
    const updatedAnswer = await prisma.answerQuestion.update({
      where: { id: answerId },
      data: { answerQuestionImageCOS: cosUrl }
    });

    return NextResponse.json({ 
      success: true, 
      url: cosUrl,
      answerId: updatedAnswer.id 
    });
  } catch (error) {
    console.error('处理图片失败:', error);
    return NextResponse.json({ 
      error: '处理图片失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
} 