import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AIGradingService } from '@/app/services/ai-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Question, AnswerQuestion } from '@prisma/client';

const aiService = new AIGradingService();

interface GradeResult {
  studentAnswer?: string | null;
  isCorrect?: boolean | null;
  confidence?: number;
  suggestedScore?: number;
  comment?: string;
  recognizedAnswer?: string;
}

type QuestionWithAnswer = Question & {
  correctAnswer: string | null;
};

type AnswerQuestionWithRelations = AnswerQuestion & {
  question: QuestionWithAnswer;
  examinee: any;
};

export async function POST(
  request: Request,
  { params }: { params: { examId: string } }
) {
  try {
    // 验证教师权限
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { answerId } = await request.json();
    
    // 获取答题信息
    const answer = await prisma.answerQuestion.findUnique({
      where: { id: answerId },
      include: { 
        question: true,
        examinee: true
      }
    }) as AnswerQuestionWithRelations | null;

    if (!answer) {
      return NextResponse.json({ error: "答案不存在" }, { status: 404 });
    }

    // 获取图片的 base64
    const imageBase64 = await aiService.imageToBase64(answer.answerQuestionImage);

    let gradeResult: GradeResult;
    
    // 根据题型选择批改方式
    if (answer.question.type === 'MULTIPLE_CHOICE' || 
        answer.question.type === 'TRUE_FALSE' ||
        answer.question.type === 'SINGLE_CHOICE') {
      if (!answer.question.correctAnswer) {
        return NextResponse.json({ error: "题目缺少标准答案" }, { status: 400 });
      }

      gradeResult = await aiService.gradeMultipleChoice(
        imageBase64,
        answer.question.correctAnswer
      );

      // 更新数据库
      await prisma.$executeRaw`
        UPDATE AnswerQuestion 
        SET 
          aiScore = ${gradeResult.isCorrect ? answer.question.score : 0},
          aiAnswer = ${gradeResult.studentAnswer || null},
          aiConfidence = ${gradeResult.confidence || null},
          aiStatus = ${gradeResult.confidence && gradeResult.confidence > 0.9 ? 'CONFIDENT' : 'NEEDS_REVIEW'},
          isGraded = ${gradeResult.confidence && gradeResult.confidence > 0.9 ? 1 : 0}
        WHERE id = ${answerId}
      `;
    } else {
      gradeResult = await aiService.gradeSubjectiveAnswer(
        imageBase64,
        answer.question.type,
        answer.question.score
      );

      // 更新数据库
      await prisma.$executeRaw`
        UPDATE AnswerQuestion 
        SET 
          aiScore = ${gradeResult.suggestedScore || null},
          aiComment = ${gradeResult.comment || null},
          aiConfidence = ${gradeResult.confidence || null},
          aiStatus = ${'NEEDS_REVIEW'},
          isGraded = 0
        WHERE id = ${answerId}
      `;
    }

    return NextResponse.json({ 
      success: true,
      result: gradeResult
    });
  } catch (error) {
    console.error('批改失败:', error);
    return NextResponse.json({ 
      error: "批改失败",
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
} 