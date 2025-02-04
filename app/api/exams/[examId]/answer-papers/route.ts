import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { deleteDirectory } from '@/lib/fileUtils';

// 辅助函数：验证坐标值
function validateCoordinates(coordinates: any): boolean {
    try {
        const { x, y, width, height } = coordinates;
        return (
            typeof x === 'number' && !isNaN(x) &&
            typeof y === 'number' && !isNaN(y) &&
            typeof width === 'number' && !isNaN(width) && width > 0 &&
            typeof height === 'number' && !isNaN(height) && height > 0
        );
    } catch (error) {
        console.error('坐标验证失败:', error);
        return false;
    }
}

export async function POST(
    request: Request,
    { params }: { params: { examId: string } }
) {
    console.log('Received request for examId:', params.examId);
    try {
        // 1. 权限验证
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'TEACHER') {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
        }

        // 2. 获取考试信息
        const exam = await prisma.exam.findUnique({
            where: { 
                id: params.examId,
            },
            include: {
                questions: {
                    orderBy: {
                        orderNum: 'asc'
                    }
                },
                examinees: true
            }
        });

        if (!exam) {
            return NextResponse.json({ error: "考试不存在" }, { status: 404 });
        }

        if (!exam.paperImage) {
            return NextResponse.json({ error: "请先上传样卷" }, { status: 400 });
        }

        if (exam.questions.length === 0) {
            return NextResponse.json({ error: "请先设置题目区域" }, { status: 400 });
        }

        // 3. 文件处理前的验证
        const formData = await request.formData();
        const files = formData.getAll('papers') as File[];

        // 添加文件类型验证
        const validFileTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        const invalidFiles = files.filter(file => !validFileTypes.includes(file.type));
        if (invalidFiles.length > 0) {
            return NextResponse.json({
                error: "存在不支持的文件类型，请上传JPG或PNG格式的图片"
            }, { status: 400 });
        }

        // 4. 文件数量验证
        if (files.length !== exam.examinees.length) {
            return NextResponse.json({
                error: `文件数量(${files.length})与考生人数(${exam.examinees.length})不匹配`
            }, { status: 400 });
        }

        // 5. 创建上传目录
        const uploadDir = path.join(process.cwd(), 'public/uploads/answers', params.examId);
        await fs.mkdir(uploadDir, { recursive: true });

        // 6. 使用事务处理
        await prisma.$transaction(async (tx) => {
            // 检查是否已存在答题记录
            const existingAnswers = await tx.answerQuestion.findFirst({
                where: { examId: params.examId }
            });
            
            if (existingAnswers) {
                throw new Error('该考试已存在答题记录，不能重复上传');
            }

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const examinee = exam.examinees[i];
                const buffer = Buffer.from(await file.arrayBuffer());

                for (const question of exam.questions) {
                    try {
                        const coordinates = JSON.parse(String(question.coordinates));
                        console.log('Processing coordinates:', coordinates);

                        if (!validateCoordinates(coordinates)) {
                            console.error('Invalid coordinates format:', coordinates);
                            throw new Error('题目坐标格式无效');
                        }

                        // 记录实际使用的坐标
                        const extractOptions = {
                            left: Math.round(coordinates.x),
                            top: Math.round(coordinates.y),
                            width: Math.round(coordinates.width),
                            height: Math.round(coordinates.height)
                        };

                        const fileName = `${examinee.studentId}_q${question.orderNum}.jpg`;
                        const filePath = path.join(uploadDir, fileName);

                        // 在处理图片前获取原图信息
                        const imageInfo = await sharp(buffer).metadata();
                        console.log('Original image info:', imageInfo);

                        // 获取样卷的原始尺寸
                        const paperImageInfo = await sharp(path.join(process.cwd(), 'public', exam.paperImage)).metadata();
                        console.log('Paper image info:', paperImageInfo);

                        // 如果考生试卷和样卷尺寸不同，需要调整坐标
                        if (imageInfo.width && imageInfo.height && paperImageInfo.width && paperImageInfo.height) {
                            const scaleX = imageInfo.width / paperImageInfo.width;
                            const scaleY = imageInfo.height / paperImageInfo.height;

                            // 调整切割坐标以适应考生试卷的实际尺寸
                            const adjustedCoordinates = {
                                left: Math.round(coordinates.x * scaleX),
                                top: Math.round(coordinates.y * scaleY),
                                width: Math.round(coordinates.width * scaleX),
                                height: Math.round(coordinates.height * scaleY)
                            };

                            try {
                                await sharp(buffer)
                                    .extract(adjustedCoordinates)
                                    .toFile(filePath);
                                
                                console.log('Crop successful:', {
                                    input: adjustedCoordinates,
                                    output: filePath
                                });
                            } catch (error) {
                                console.error('Crop failed:', error);
                                throw new Error(`处理题目${question.orderNum}的图片时出错: ${error instanceof Error ? error.message : '未知错误'}`);
                            }
                        }

                        // 修正图片路径
                        const answerQuestionImage = `/uploads/answers/${params.examId}/${fileName}`;

                        // 创建答题记录 
                        await tx.answerQuestion.create({
                            data: {
                                userId: session.user.id,
                                examId: params.examId,
                                questionId: question.id,
                                examineeId: examinee.id,
                                answerQuestionImage: answerQuestionImage,
                                fullScore: question.score,
                                isGraded: false
                            }
                        });
                    } catch (error) {
                        console.error('处理题目失败:', error);
                        throw error;
                    }
                }
            }

            // 更新考试状态
            await tx.exam.update({
                where: { id: params.examId },
                data: { 
                    status: 'GRADING',
                    updatedAt: new Date()
                }
            });
        });

        return NextResponse.json({ 
            success: true,
            message: "试卷上传并处理成功" 
        });

    } catch (error) {
        console.error('处理考生试卷失败:', error);
        // 清理已上传的文件
        try {
            const uploadDir = path.join(process.cwd(), 'public/uploads/answers', params.examId);
            await fs.rm(uploadDir, { recursive: true, force: true });
        } catch (cleanupError) {
            console.error('清理文件失败:', cleanupError);
        }

        return NextResponse.json({ 
            error: "处理失败",
            details: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { examId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'TEACHER') {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
        }

        // 删除答题图片目录
        const answersPath = path.join('uploads/answers', params.examId);
        await deleteDirectory(answersPath);

        // 清除答题记录
        await prisma.answerQuestion.deleteMany({
            where: { examId: params.examId }
        });

        return NextResponse.json({ 
            success: true,
            message: "答卷已清除"
        });
    } catch (error) {
        console.error('清除答卷失败:', error);
        return NextResponse.json({ 
            error: "清除答卷失败",
            details: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
} 