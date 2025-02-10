'use client';

import { useSession } from 'next-auth/react';
import AIAssistant from './AIAssistant';

export default function AuthAIAssistant() {
  const { data: session, status } = useSession();

  // 只有在用户已登录时才显示 AI 助手
  if (status === 'authenticated' && session?.user) {
    return <AIAssistant />;
  }

  // 未登录时不显示任何内容
  return null;
} 