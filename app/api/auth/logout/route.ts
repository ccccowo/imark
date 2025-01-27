import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        // 清除 cookie
        cookies().delete('token');
        
        return NextResponse.json({
            success: true,
            message: '退出成功'
        });
    } catch (error: any) {
        console.error('Logout failed:', error);
        return NextResponse.json({ 
            error: "退出失败",
            details: error.message
        }, { status: 500 });
    }
} 