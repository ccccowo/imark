import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import AIAssistant from '@/app/components/AIAssistant';
import { useSession } from 'next-auth/react';
const inter = Inter({ subsets: ['latin'] });


export const metadata: Metadata = {
  title: '智能阅卷平台',
  description: '大学期末考试智能阅卷系统',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body className={inter.className}>
        <Providers>
          {children}
          {/* 只有在用户登录后才显示AI助手 */}
          <AIAssistant />
        </Providers>
      </body>
    </html>
  );
}