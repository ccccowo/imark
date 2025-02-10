'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import AIAssistant from './AIAssistant';

export default function ProtectedAIAssistant() {
    const { status } = useSession();
    const pathname = usePathname();
    
    // 如果是登录页面，不显示助手
    if (pathname === '/') {
        return null;
    }

    // 如果未登录或正在加载，不显示助手
    if (status !== 'authenticated') {
        return null;
    }

    return <AIAssistant />;
} 