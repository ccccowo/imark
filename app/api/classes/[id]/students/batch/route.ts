import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface StudentData {
  name: string;
  studentId: string;
  gender: string;
  systemId: string;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 验证教师身份
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 验证班级是否属于当前教师
    const classExists = await prisma.class.findFirst({
      where: {
        id: params.id,
        teacherId: session.user.id,
      },
    });

    if (!classExists) {
      return NextResponse.json(
        { error: "班级不存在或无权限" }, 
        { status: 404 }
      );
    }

    // 获取上传的学生数据
    const students: StudentData[] = await request.json();

    // 批量处理学生数据
    const results = await prisma.$transaction(async (tx) => {
      const processedStudents = [];

      for (const student of students) {
        // 查找现有学生
        let existingStudent = await tx.user.findFirst({
          where: {
            id: student.systemId,
            role: "STUDENT",
          },
        });

        if (!existingStudent) {
          return NextResponse.json(
            { 
              error: "导入失败", 
              details: `系统中找不到ID为 ${student.systemId} 的学生` 
            }, 
            { status: 400 }
          );
        }

        // 检查学生是否已在班级中
        const existingRelation = await tx.studentClass.findFirst({
          where: {
            studentId: existingStudent.id,
            classId: params.id,
          },
        });

        if (!existingRelation) {
          // 创建班级学生关系
          const studentClass = await tx.studentClass.create({
            data: {
              studentId: existingStudent.id,
              classId: params.id,
            },
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  studentId: true,
                }
              }
            }
          });
          processedStudents.push(studentClass);
        }
      }

      return processedStudents;
    });

    return NextResponse.json({
      message: "导入成功",
      addedStudents: results.length,
      students: results,
    });

  } catch (error: any) {
    console.error('批量导入学生失败:', error);
    return NextResponse.json(
      { 
        error: "导入失败", 
        details: error.message 
      }, 
      { status: 500 }
    );
  }
} 