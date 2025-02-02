export interface ServiceResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface ActionResponse {
    success: boolean;
    response?: string;
    error?: string;
    data?: any;
} 