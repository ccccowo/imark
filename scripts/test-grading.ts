const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const { AxiosError } = require('axios');

const prisma = new PrismaClient();

async function testGrading() {
  try {
    // 1. 获取一个选择题答题记录
    const choiceAnswer = await prisma.answerQuestion.findFirst({
      where: {
        question: {
          type: {
            in: ['MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'TRUE_FALSE']
          },
          correctAnswer: {
            not: null
          }
        }
      },
      include: {
        question: true,
        examinee: true
      }
    });

    if (choiceAnswer) {
      console.log('测试选择题批改：');
      console.log('答题ID:', choiceAnswer.id);
      
      // 发送批改请求
      const response = await axios.post(
        `http://localhost:3000/api/exams/${choiceAnswer.examId}/grade`,
        { answerId: choiceAnswer.id },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      console.log('选择题批改结果:', response.data);
    } else {
      console.log('未找到合适的选择题答题记录');
    }

    // 2. 获取一个主观题答题记录
    const subjectiveAnswer = await prisma.answerQuestion.findFirst({
      where: {
        question: {
          type: {
            notIn: ['MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'TRUE_FALSE']
          }
        }
      },
      include: {
        question: true,
        examinee: true
      }
    });

    if (subjectiveAnswer) {
      console.log('\n测试主观题批改：');
      console.log('答题ID:', subjectiveAnswer.id);
      
      // 发送批改请求
      const response = await axios.post(
        `http://localhost:3000/api/exams/${subjectiveAnswer.examId}/grade`,
        { answerId: subjectiveAnswer.id },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      console.log('主观题批改结果:', response.data);
    } else {
      console.log('未找到合适的主观题答题记录');
    }

  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      console.error('测试失败:', error.response.data);
    } else if (error instanceof Error) {
      console.error('测试失败:', error.message);
    } else {
      console.error('未知错误');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testGrading(); 