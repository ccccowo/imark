import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';

// 添加坐标验证函数
function validateCoordinates(coordinates: { x: number; y: number; width: number; height: number }) {
    return coordinates.x >= 0 && 
           coordinates.y >= 0 && 
           coordinates.width > 0 && 
           coordinates.height > 0;
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

        // 2. 获取考试信息 - 添加状态检查
        const exam = await prisma.exam.findUnique({
            where: { 
                id: params.examId,
                // 添加状态检查，确保考试处于正确状态
                status: 'READY'
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
            return NextResponse.json({ error: "考试不存在或状态不正确" }, { status: 404 });
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
                    const coordinates = question.coordinates as {
                        x: number;
                        y: number;
                        width: number;
                        height: number;
                    };

                    // 在处理图片前添加日志
                    console.log('Original coordinates:', coordinates);

                    // 添加坐标验证
                    if (!validateCoordinates(coordinates)) {
                        console.error('Invalid coordinates:', coordinates);
                        throw new Error(`题目坐标无效: ${JSON.stringify(coordinates)}`);
                    }

                    // 记录实际使用的坐标
                    const extractOptions = {
                        left: Math.round(coordinates.x),
                        top: Math.round(coordinates.y),
                        width: Math.round(coordinates.width),
                        height: Math.round(coordinates.height)
                    };
                    console.log('Extraction coordinates:', extractOptions);

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

                        console.log('Scale factors:', { scaleX, scaleY });
                        console.log('Original coordinates:', coordinates);
                        console.log('Adjusted coordinates:', adjustedCoordinates);

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
                            throw new Error(`处理题目${question.orderNum}的图片时出错: ${error.message}`);
                        }
                    }

                    const answerQuestionImage = `/uploads/answers/${params.examId}-${fileName}`;

                    // 创建答题记录 
                    await tx.answerQuestion.create({
                        data: {
                            answerQuestionImage: answerQuestionImage,
                            fullScore: 0,
                            isGraded: false,
                            exam: {
                                connect: {
                                    id: params.examId
                                }
                            },
                            examinee: {
                                connect: {
                                    id: examinee.id
                                }
                            },
                            question: {
                                connect: {
                                    id: question.id
                                }
                            }
                        }
                    });
                }
            }

            // 更新考试状态
            await tx.exam.update({
                where: { id: params.examId },
                data: { 
                    status: 'GRADING',
                    updatedAt: new Date() // 显式更新时间戳
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