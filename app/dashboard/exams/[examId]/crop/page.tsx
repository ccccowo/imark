'use client';

import { useState, useEffect } from 'react';
import { Button, message } from 'antd';
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

    // 获取试卷信息
    useEffect(() => {
        const fetchExam = async () => {
            try {
                const response = await axiosInstance.get(`/api/exams/${params.examId}`);
                setPaperUrl(response.data.paperImage);
            } catch (error) {
                message.error('获取试卷信息失败');
                router.back();
            }
        };
        fetchExam();
    }, [params.examId]);

    const handleSave = async () => {
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
        setCrops([
            ...crops,
            { 
                x: 0, 
                y: 0, 
                width: 100, 
                height: 100, 
                unit: '%',
                orderNum: crops.length + 1 
            }
        ]);
        setCurrentQuestion(crops.length + 2);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between mb-4">
                <h1 className="text-2xl">切割试卷 - 第 {currentQuestion} 题</h1>
                <div className="space-x-2">
                    <Button onClick={() => router.back()}>返回</Button>
                    <Button 
                        onClick={() => setCurrentQuestion(q => q - 1)}
                        disabled={currentQuestion === 1}
                    >
                        上一题
                    </Button>
                    <Button onClick={handleAddQuestion}>
                        添加题目
                    </Button>
                    <Button type="primary" onClick={handleSave}>
                        完成切割
                    </Button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
                {paperUrl && (
                    <ReactCrop
                        crop={crops[currentQuestion - 1]}
                        onChange={(newCrop) => {
                            const newCrops = [...crops];
                            newCrops[currentQuestion - 1] = {
                                ...newCrop,
                                orderNum: currentQuestion
                            };
                            setCrops(newCrops);
                        }}
                    >
                        <img src={paperUrl} alt="试卷" />
                    </ReactCrop>
                )}
            </div>
        </div>
    );
} 