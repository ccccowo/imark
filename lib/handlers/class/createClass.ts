import { AIActionHandler } from '../types';
import axiosInstance from '@/lib/axios';

export const createClassHandler: AIActionHandler = {
    action: 'create_class',
    
    async handle(data) {
        try {
            const response = await axiosInstance.post('/api/classes', {
                name: data.name?.trim(),
                subject: data.subject?.trim()
            });
            
            return {
                success: true,
                response: `已成功创建班级：${response.data.name}，科目：${response.data.subject}`
            };
        } catch (error: any) {
            console.error('创建班级失败:', error);
            return {
                success: false,
                error: error.response?.data?.error || '创建班级失败'
            };
        }
    }
}; 