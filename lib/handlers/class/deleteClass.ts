import { AIActionHandler } from '../types';
import axiosInstance from '@/lib/axios';

export const deleteClassHandler: AIActionHandler = {
    action: 'delete_class',
    
    async handle(data) {
        try {
            if (!data.classId) {
                return {
                    success: false,
                    error: '未提供班级ID'
                };
            }

            await axiosInstance.delete(`/api/classes/${data.classId}`);
            
            return {
                success: true,
                response: `已成功删除班级`
            };
        } catch (error: any) {
            console.error('删除班级失败:', error);
            return {
                success: false,
                error: error.response?.data?.error || '删除班级失败'
            };
        }
    }
}; 