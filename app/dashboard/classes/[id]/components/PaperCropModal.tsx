// components/PaperCropModal.tsx
import React, { useState, ChangeEvent } from 'react';
import { Modal, Button, message } from 'antd';
import ReactCrop, { Crop } from 'react-image-crop';
import axiosInstance from '@/lib/axios';
import 'react-image-crop/dist/ReactCrop.css';

interface CropData extends Crop {
    unit: 'px' | '%';
}

interface Props {
    visible: boolean;
    examId: string | null;
    onClose: () => void;
}

export function PaperCropModal({ visible, examId, onClose }: Props) {
    const [crops, setCrops] = useState<CropData[]>([{
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        unit: '%'
    }]);
    const [currentQuestion, setCurrentQuestion] = useState(1);
    const [paperImage, setPaperImage] = useState<string>('');

    // 处理上传试卷
    const handleUploadPaper = () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';

        fileInput.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            if (!file) {
                console.error('No file selected');
                return;
            }

            handleFileUpload(file);
        };

        fileInput.click();
    };

    const handleFileUpload = async (file: File) => {
        console.log('examId', examId);
        if (!examId) {
            console.log('No examId');
            return;
        }

        const formData = new FormData();
        formData.append('paper', file);

        try {
            const response = await axiosInstance.post(
                `/api/exams/${examId}/paper`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                }
            );

            // 检查响应状态和数据
            if (response.data && response.data.imageUrl) {
                message.success('试卷上传成功');
                setPaperImage(response.data.imageUrl);
            } else {
                throw new Error('上传响应中没有图片URL');
            }
        } catch (error: any) {
            console.error('22222Upload error:', error);
            const errorMessage = error.response?.data?.error || '2222试卷上传失败';
            message.error(errorMessage);
        }
    };

    // 处理保存题目区域
    const handleSave = async () => {
        try {
            if (!examId) return;
            
            const response = await axiosInstance.post(`/api/exams/${examId}/questions`, {
                questions: crops.map((crop, index) => ({
                    orderNum: index + 1,
                    coordinates: {
                        x1: crop.x,
                        y1: crop.y,
                        x2: crop.x + crop.width,
                        y2: crop.y + crop.height
                    }
                }))
            });

            if (response.status === 200) {
                message.success('题目区域保存成功');
                onClose();
            }
        } catch (error) {
            message.error('保存题目区域失败');
        }
    };

    const handleCropComplete = (crop: CropData) => {
        const newCrops = [...crops];
        newCrops[currentQuestion - 1] = crop;
        setCrops(newCrops);
    };

    return (
        <Modal
            title="题目切割"
            open={visible}
            width={1200}
            onCancel={onClose}
            footer={[
                <Button key="upload" onClick={handleUploadPaper}>
                    上传试卷
                </Button>,
                <Button key="prev" onClick={() => setCurrentQuestion(q => q - 1)} disabled={currentQuestion === 1}>
                    上一题
                </Button>,
                <Button key="next" onClick={() => setCurrentQuestion(q => q + 1)}>
                    下一题
                </Button>,
                <Button key="save" type="primary" onClick={handleSave} disabled={!paperImage}>
                    保存
                </Button>
            ]}
        >
            <div>当前第 {currentQuestion} 题</div>
            {paperImage && (
                <ReactCrop
                    crop={crops[currentQuestion - 1]}
                    onChange={(c) => handleCropComplete(c)}
                >
                    <img src={paperImage} alt="试卷" />
                </ReactCrop>
            )}
        </Modal>
    );
}