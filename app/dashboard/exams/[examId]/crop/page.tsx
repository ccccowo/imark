'use client';

import { useState, useEffect, useRef } from 'react';
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
    const cropRef = useRef<any>(null);
    const imageRef = useRef<HTMLImageElement>(null);

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
                    // 转换数据格式，直接使用返回的数据
                    const historyCrops = questionsResponse.data.map((q: any) => ({
                        ...q.coordinates, // coordinates 已经是对象了，不需要再解析
                        unit: 'px',
                        orderNum: q.orderNum
                    }));
                    
                    console.log('Loading history crops:', historyCrops); // 添加日志
                    setCrops(historyCrops);
                    setCurrentQuestion(historyCrops.length); // 设置为最后一题
                    message.success(`已加载 ${historyCrops.length} 道历史题目`);
                }
            } catch (error) {
                console.error('加载失败:', error);
                message.error('获取试卷信息失败');
            }
        };

        fetchExam();
    }, [params.examId]);

    // 保存坐标到服务器
    const saveCoordinates = async (coordinates: any) => {
        await axiosInstance.post(`/api/exams/${params.examId}/questions`, {
            questions: [{
                orderNum: currentQuestion,
                coordinates,
                type: 'SHORT_ANSWER',  // 默认为简答题
                score: 0  // 默认分值
            }]
        });
    };

    // 保存裁剪区域
    const handleSave = async () => {
        try {
            // 确保所有题目都已经切割完成
            if (crops.length === 0) {
                message.error('请先添加题目');
                return;
            }

            // 按题号排序
            const sortedCrops = [...crops].sort((a, b) => a.orderNum - b.orderNum);

            // 打印日志以检查数据
            console.log('Saving crops:', sortedCrops);

            // 保存所有题目的数据
            await axiosInstance.post(`/api/exams/${params.examId}/questions`, {
                questions: sortedCrops.map((crop, index) => ({
                    orderNum: index + 1,
                    coordinates: {
                        x: crop.x,
                        y: crop.y,
                        width: crop.width,
                        height: crop.height
                    },
                    type: 'SHORT_ANSWER',
                    score: 0
                }))
            });

            message.success('所有题目保存成功');
        } catch (error) {
            console.error('保存失败:', error);
            message.error('保存失败');
        }
    };

    const handleAddQuestion = () => {
        setIsDrawingMode(true);
        setTempCrop(undefined);
    };

    const handleCropComplete = (crop: Crop) => {
        if (!isDrawingMode) return;
        
        // 添加最小尺寸验证
        if (crop.width < 20 || crop.height < 20) {
            return;
        }
        
        // 添加新题目
        const nextQuestionNum = crops.length + 1;
        const newCrops = [
            ...crops,
            { 
                ...crop,
                orderNum: nextQuestionNum
            }
        ];
        
        // 打印日志以检查数据
        console.log('Adding new crop:', crop);
        console.log('Updated crops:', newCrops);
        
        setCrops(newCrops);
        setCurrentQuestion(nextQuestionNum);
        setIsDrawingMode(false);
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
                        ref={cropRef}
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
                        <img ref={imageRef} src={paperUrl} alt="试卷" />
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