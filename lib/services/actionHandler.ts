import { ClassService } from './classService';
import { ActionResponse } from '../types/service';
import { Session } from 'next-auth';

export interface ActionData {
    action: string;
    data: any;
}

export class ActionHandler {
    static readonly MESSAGES = {
        UNSUPPORTED_ACTION: "不支持的操作类型",
        UNAUTHORIZED: "未授权访问",
    };

    static async handle(action: ActionData, session: Session | null): Promise<ActionResponse> {
        if (!session?.user) {
            return {
                success: false,
                error: this.MESSAGES.UNAUTHORIZED
            };
        }

        try {
            switch (action.action) {
                case 'create_class':
                    return await this.handleCreateClass(action.data, session);
                // 可以添加其他操作类型
                default:
                    return {
                        success: false,
                        error: this.MESSAGES.UNSUPPORTED_ACTION
                    };
            }
        } catch (error: any) {
            console.error('Action handling error:', error);
            return {
                success: false,
                error: error.message || '操作执行失败'
            };
        }
    }

    private static async handleCreateClass(data: any, session: Session): Promise<ActionResponse> {
        const result = await ClassService.handleCreateClass(data);
        
        return {
            success: result.success,
            response: result.message,
            error: result.error,
            data: result.data
        };
    }
} 