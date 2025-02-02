import prisma from '@/lib/prisma';
import { Class, User } from '@prisma/client';
import { ServiceResponse } from '../types/service';

export interface CreateClassData {
    name: string;
    subject: string;
}

export class ClassService {
    static readonly MESSAGES = {
        UNAUTHORIZED: "未授权",
        TEACHER_ONLY: "只有教师可以执行此操作",
        REQUIRED_FIELDS: "班级名称和科目为必填项",
        NAME_EXISTS: "该班级名称已存在",
        CREATE_SUCCESS: (name: string, subject: string) => 
            `已成功创建班级：${name}，科目：${subject}`,
        CREATE_ERROR: "创建班级失败",
    };

    static async handleCreateClass(
        data: CreateClassData,
        user?: User | null
    ): Promise<ServiceResponse<Class>> {
        try {
            // 验证权限
            if (!user || user.role !== 'TEACHER') {
                return {
                    success: false,
                    error: this.MESSAGES.UNAUTHORIZED
                };
            }

            // 验证数据
            if (!data.name?.trim() || !data.subject?.trim()) {
                return {
                    success: false,
                    error: this.MESSAGES.REQUIRED_FIELDS
                };
            }

            // 创建班级
            const newClass = await prisma.class.create({
                data: {
                    name: data.name.trim(),
                    subject: data.subject.trim(),
                    teacherId: user.id,
                },
                include: {
                    teacher: {
                        select: {
                            name: true,
                            username: true
                        }
                    },
                    _count: {
                        select: {
                            students: true
                        }
                    }
                }
            });

            return {
                success: true,
                data: newClass,
                message: this.MESSAGES.CREATE_SUCCESS(newClass.name, newClass.subject)
            };

        } catch (error: any) {
            console.error('创建班级失败:', error);
            
            if (error.code === 'P2002') {
                return {
                    success: false,
                    error: this.MESSAGES.NAME_EXISTS
                };
            }

            return {
                success: false,
                error: this.MESSAGES.CREATE_ERROR
            };
        }
    }
} 