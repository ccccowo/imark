import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import dynamic from 'next/dynamic';

// 动态导入 ProtectedAIAssistant 组件
const ProtectedAIAssistant = dynamic(
  () => import('@/app/components/ProtectedAIAssistant'),
  { 
    ssr: false,
    loading: () => null 
  }
);

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
          <ProtectedAIAssistant />
        </Providers>
      </body>
    </html>
  );
}