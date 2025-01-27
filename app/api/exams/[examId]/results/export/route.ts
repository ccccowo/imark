import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function GET(
    request: Request,
    { params }: { params: { examId: string } }
) {
    try {
        // 获取考试信息和成绩
        const [exam, results] = await Promise.all([
            prisma.exam.findUnique({
                where: { id: params.examId }
            }),
            prisma.examResult.findMany({
                where: { examId: params.examId },
                include: {
                    student: {
                        select: {
                            name: true,
                            studentId: true
                        }
                    }
                }
            })
        ]);

        if (!exam) {
            return NextResponse.json({ error: "考试不存在" }, { status: 404 });
        }

        // 准备Excel数据
        const data = results.map((result, index) => ({
            '序号': index + 1,
            '学号': result.student.studentId,
            '姓名': result.student.name,
            '成绩': result.score
        }));

        // 创建工作簿和工作表
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);

        // 设置列宽
        ws['!cols'] = [
            { wch: 6 },  // 序号
            { wch: 15 }, // 学号
            { wch: 12 }, // 姓名
            { wch: 8 }   // 成绩
        ];

        XLSX.utils.book_append_sheet(wb, ws, '成绩表');

        // 生成Excel文件的buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // 设置响应头
        const headers = new Headers();
        headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        headers.set('Content-Disposition', `attachment; filename="${exam.name}_成绩表.xlsx"`);

        return new Response(buffer, {
            headers
        });

    } catch (error: any) {
        console.error('Export results failed:', error);
        return NextResponse.json({ 
            error: "导出成绩失败",
            details: error.message
        }, { status: 500 });
    }
} 