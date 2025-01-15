'use client'

import { message } from 'antd';
import axiosInstance from '@/lib/axios';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

// 添加自动分析功能
const handleAnalyze = async (examId: string, paperImage: string, setCrops: (crops: any[]) => void) => {
    try {
        const response = await axiosInstance.post(
            `/api/exams/${examId}/analyze`,
            { imageUrl: paperImage }
        );

        if (response.data) {
            // 更新裁剪区域
            setCrops(response.data.map((q: any) => ({
                x: q.coordinates.x1,
                y: q.coordinates.y1,
                width: q.coordinates.x2 - q.coordinates.x1,
                height: q.coordinates.y2 - q.coordinates.y1,
                unit: 'px'
            })));
            message.success('试卷分析完成');
        }
    } catch (error) {
        message.error('试卷分析失败');
    }
};

export async function detectQuestions(imageUrl: string) {
    // 加载预训练模型
    const model = await tf.loadGraphModel('path/to/model.json');
    
    // 加载图片
    const img = new Image();
    img.src = imageUrl;
    await img.decode();
    
    // 预处理图片
    const tensor = tf.browser.fromPixels(img)
        .expandDims(0)
        .toFloat()
        .div(255.0);
    
    // 运行检测
    const predictions = await model.predict(tensor);
    
    // 处理结果
    const boxes = await predictions.array();
    
    return boxes.map((box, index) => ({
        orderNum: index + 1,
        coordinates: {
            x: box[0],
            y: box[1],
            width: box[2] - box[0],
            height: box[3] - box[1]
        }
    }));
}

export default handleAnalyze;