import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTestData() {
  try {
    // 1. 创建测试教师
    const teacher = await prisma.user.create({
      data: {
        name: '测试教师',
        username: 'test_teacher',
        password: 'password123',
        role: 'TEACHER',
        teacherId: 'T001'
      }
    });

    // 2. 创建测试班级
    const testClass = await prisma.class.create({
      data: {
        name: '测试班级',
        teacherId: teacher.id
      }
    });

    // 3. 创建测试试卷
    const exam = await prisma.exam.create({
      data: {
        name: '测试试卷',
        classId: testClass.id,
        status: 'READY',
        paperImage: 'https://example.com/test-paper.jpg',
        fullScore: 100
      }
    });

    // 4. 创建测试题目
    const choiceQuestion = await prisma.question.create({
      data: {
        examId: exam.id,
        type: 'MULTIPLE_CHOICE',
        coordinates: '100,100,200,200',
        orderNum: 1,
        score: 5,
        correctAnswer: 'A'
      }
    });

    const subjectiveQuestion = await prisma.question.create({
      data: {
        examId: exam.id,
        type: 'SHORT_ANSWER',
        coordinates: '100,300,200,400',
        orderNum: 2,
        score: 10
      }
    });

    // 5. 创建测试考生
    const examinee = await prisma.examinee.create({
      data: {
        name: '测试学生',
        studentId: 'S001',
        examId: exam.id
      }
    });

    // 6. 创建测试答题记录
    const choiceAnswer = await prisma.answerQuestion.create({
      data: {
        examId: exam.id,
        questionId: choiceQuestion.id,
        examineeId: examinee.id,
        userId: teacher.id,
        answerQuestionImage: 'https://example.com/choice-answer.jpg'
      }
    });

    const subjectiveAnswer = await prisma.answerQuestion.create({
      data: {
        examId: exam.id,
        questionId: subjectiveQuestion.id,
        examineeId: examinee.id,
        userId: teacher.id,
        answerQuestionImage: 'https://example.com/subjective-answer.jpg'
      }
    });

    console.log('测试数据创建成功！');
    console.log('选择题答题ID:', choiceAnswer.id);
    console.log('主观题答题ID:', subjectiveAnswer.id);

  } catch (error) {
    console.error('创建测试数据失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestData(); 