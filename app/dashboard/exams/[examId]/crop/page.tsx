'use client';

import { useState, useEffect } from 'react';
import { Button, message, Alert, Space } from 'antd';
import ReactCrop, { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import axiosInstance from '@/lib/axios';
import { useRouter } from 'next/navigation';

interface QuestionCrop extends Crop {
    orderNum: number;
}

export default function PaperCropPage({ params }: { params: { examId: string } }) {
    const router = useRouter();
    const [crops, setCrops] = useState<QuestionCrop[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState(1);
    const [paperUrl, setPaperUrl] = useState('');
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [tempCrop, setTempCrop] = useState<Crop | undefined>(undefined);

    // 获取试卷信息和历史切割数据
    useEffect(() => {
        const fetchExam = async () => {
            try {
                // 获取试卷信息
                const examResponse = await axiosInstance.get(`/api/exams/${params.examId}`);
                setPaperUrl(examResponse.data.paperImage);

                // 获取历史切割数据
                const questionsResponse = await axiosInstance.get(`/api/exams/${params.examId}/questions`);
                if (questionsResponse.data.length > 0) {
                    // 转换数据格式
                    const historyCrops = questionsResponse.data.map((q: any) => ({
                        x: q.coordinates.x,
                        y: q.coordinates.y,
                        width: q.coordinates.width,
                        height: q.coordinates.height,
                        unit: 'px',
                        orderNum: q.orderNum
                    }));
                    setCrops(historyCrops);
                    setCurrentQuestion(1); // 显示第一题
                    message.success('已加载历史切割数据');
                }
            } catch (error) {
                message.error('获取试卷信息失败');
                router.back();
            }
        };
        fetchExam();
    }, [params.examId]);

    // 保存裁剪区域
    const handleSave = async () => {
        if (crops.length === 0) {
            message.warning('请至少添加一道题目');
            return;
        }
        try {
            // 按照 y 坐标排序，如果 y 坐标相近（差值小于30），则按 x 坐标排序
            const sortedCrops = [...crops].sort((a, b) => {
                const yDiff = Math.abs(a.y - b.y);
                if (yDiff < 30) {
                    return a.x - b.x;
                }
                return a.y - b.y;
            });

            // 重新分配题号
            const questionsToSave = sortedCrops.map((crop, index) => ({
                orderNum: index + 1,
                coordinates: {
                    x: crop.x,
                    y: crop.y,
                    width: crop.width,
                    height: crop.height
                }
            }));

            await axiosInstance.post(`/api/exams/${params.examId}/questions`, {
                questions: questionsToSave
            });
            message.success('题目保存成功');
            router.back();
        } catch (error) {
            message.error('保存失败');
        }
    };

    const handleAddQuestion = () => {
        setIsDrawingMode(true);
        setTempCrop(undefined);
    };

    const handleCropComplete = (crop: Crop) => {
        if (!isDrawingMode) return;
        
        // 添加最小尺寸验证（比如 20x20 像素）
        if (crop.width < 20 || crop.height < 20) {
            return; // 如果选区太小，直接返回不处理
        }
        
        // 添加新题目
        const nextQuestionNum = crops.length + 1;
        setCrops([
            ...crops,
            { 
                ...crop,
                orderNum: nextQuestionNum
            }
        ]);
        setCurrentQuestion(nextQuestionNum);
        setIsDrawingMode(false); // 退出绘制模式
        message.success(`第 ${nextQuestionNum} 题区域已添加`);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* 操作指南 */}
            <div className="mb-6">
                <Alert
                    message={<div className="font-bold text-lg">✂️ 试卷切割指南</div>}
                    description={
                        <ul className="list-disc pl-8 mt-2">
                            <li className="mb-1">📝 点击"添加题目"按钮开始标记新题目</li>
                            <li className="mb-1">🖱️ 在试卷上拖动鼠标框选题目区域</li>
                            <li className="mb-1">✅ 松开鼠标完成当前题目的标记</li>
                            <li className="mb-1">🔄 重复以上步骤添加下一题</li>
                            <li className="mb-1">📎 点击题号可以编辑已添加的题目</li>
                            <li className="mb-1">💾 所有题目标记完成后点击"完成切割"</li>
                        </ul>
                    }
                    type="info"
                    showIcon
                    style={{ 
                        backgroundColor: '#e6f4ff', 
                        border: '1px solid #91caff',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                />
            </div>

            <div className="flex justify-between mb-4 items-center">
                <h1 className="text-2xl font-bold px-4 py-2 bg-blue-50 rounded-lg">
                    {isDrawingMode 
                        ? '✏️ 请在试卷上框选题目区域' 
                        : crops.length === 0 
                            ? '👆 点击"添加题目"开始切割'
                            : `🔍 当前编辑: 第 ${currentQuestion} 题`
                    }
                </h1>
                <Space size="middle">
                    <Button 
                        onClick={() => router.back()}
                        icon={<span>⬅️</span>}
                    >
                        返回
                    </Button>
                    <Button 
                        onClick={handleAddQuestion}
                        disabled={isDrawingMode}
                        type="primary"
                        icon={<span>➕</span>}
                        style={{ backgroundColor: '#1677ff' }}
                    >
                        添加题目
                    </Button>
                    <Button 
                        onClick={handleSave}
                        disabled={crops.length === 0}
                        type="primary"
                        icon={<span>💾</span>}
                        style={{ backgroundColor: '#52c41a' }}
                    >
                        完成切割
                    </Button>
                </Space>
            </div>

            {/* 题目导航 */}
            {crops.length > 0 && !isDrawingMode && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500 mb-2 flex items-center">
                        <span className="mr-2">📑</span>
                        已添加的题目: 点击下方题号可编辑对应题目
                    </div>
                    <Space wrap size="middle">
                        {crops.map((_, index) => (
                            <Button
                                key={index}
                                type={currentQuestion === index + 1 ? 'primary' : 'default'}
                                onClick={() => {
                                    setCurrentQuestion(index + 1);
                                    setIsDrawingMode(false);
                                }}
                                shape="circle"
                                size="large"
                                style={currentQuestion === index + 1 ? {
                                    backgroundColor: '#1677ff',
                                    boxShadow: '0 2px 4px rgba(22,119,255,0.2)'
                                } : {}}
                            >
                                {index + 1}
                            </Button>
                        ))}
                    </Space>
                </div>
            )}

            <div className="bg-white p-4 rounded-lg shadow-lg">
                {paperUrl ? (
                    <ReactCrop
                        crop={isDrawingMode ? tempCrop : crops[currentQuestion - 1]}
                        onChange={(newCrop) => {
                            if (isDrawingMode) {
                                setTempCrop(newCrop);
                            } else {
                                const newCrops = [...crops];
                                newCrops[currentQuestion - 1] = {
                                    ...newCrop,
                                    orderNum: currentQuestion
                                };
                                setCrops(newCrops);
                            }
                        }}
                        onComplete={handleCropComplete}
                        minWidth={20}
                        minHeight={20}
                    >
                        <img src={paperUrl} alt="试卷" />
                    </ReactCrop>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <div className="text-xl mb-2">📄</div>
                        加载试卷中...
                    </div>
                )}
            </div>
        </div>
    );
} 