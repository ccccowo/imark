'use client';

import { Tabs } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import {
    UserOutlined,
    FileTextOutlined,
    BarChartOutlined,
    SettingOutlined
} from '@ant-design/icons';

interface Props {
    children: React.ReactNode;
    params: { id: string };
}

export default function ClassLayout({ children, params }: Props) {
    const pathname = usePathname();
    const router = useRouter();
    const currentTab = pathname.split('/').pop();

    const items = [
        {
            key: 'students',
            label: (
                <div className="flex items-center px-2">
                    <UserOutlined className="text-blue-500 mr-2" />
                    <span>学生管理</span>
                </div>
            ),
        },
        {
            key: 'exams',
            label: (
                <div className="flex items-center px-2">
                    <FileTextOutlined className="text-green-500 mr-2" />
                    <span>考试管理</span>
                </div>
            ),
        },
        {
            key: 'statistics',
            label: (
                <div className="flex items-center px-2">
                    <BarChartOutlined className="text-orange-500 mr-2" />
                    <span>统计分析</span>
                </div>
            ),
        },
        {
            key: 'settings',
            label: (
                <div className="flex items-center px-2">
                    <SettingOutlined className="text-purple-500 mr-2" />
                    <span>班级设置</span>
                </div>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <Tabs
                        activeKey={currentTab}
                        items={items}
                        onChange={(key) => {
                            router.push(`/dashboard/classes/${params.id}/${key}`);
                        }}
                        className="class-tabs px-6 pt-2"
                    />
                </div>
                <div className="transition-all duration-300">
                    {children}
                </div>
            </div>
        </div>
    );
} 