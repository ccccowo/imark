import React, { useState } from 'react';
import { message } from 'antd';
import { useRouter } from 'next/router';
import axiosInstance from '@/lib/axios';

const ExamManagement: React.FC = () => {
    const router = useRouter();
    const [currentPaperUrl, setCurrentPaperUrl] = useState('');

    const handleFileUpload = async (file: File, examId: string) => {
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

            if (response.data && response.data.imageUrl) {
                message.success('试卷上传成功，即将进入切割页面');
                setCurrentPaperUrl(response.data.imageUrl);
                // 跳转到切割页面
                router.push(`/dashboard/exams/${examId}/crop`);
            }
        } catch (error) {
            message.error('试卷上传失败');
        }
    };

    return (
        <div>
            {/* Render your component content here */}
        </div>
    );
};

export default ExamManagement; 