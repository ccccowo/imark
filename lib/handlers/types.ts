export interface AIActionResponse {
    success: boolean;
    response?: string;
    error?: string;
}

export interface AIActionHandler {
    action: string;
    handle: (data: any) => Promise<AIActionResponse>;
} 