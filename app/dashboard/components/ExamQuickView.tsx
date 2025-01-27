'use client';

import { useState, useEffect } from 'react';
import { Card, Tabs, Table, Tag, Button, Space, Empty } from 'antd';
import { useRouter } from 'next/navigation';
import { EyeOutlined, EditOutlined } from '@ant-design/icons';
import axiosInstance from '@/lib/axios';
import type { Exam } from '@/app/types';

interface ExamQuickViewProps {
    classId?: string; // 可选的班级ID，如果不提供则显示所有考试
}

export function ExamQuickView({ classId }: ExamQuickViewProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [exams, setExams] = useState<{
        notReady: Exam[];
        grading: Exam[];
        completed: Exam[];
    }>({
        notReady: [],
        grading: [],
        completed: [],
    });

    const fetchExams = async () => {
        try {
            setLoading(true);
            const endpoint = classId 
                ? `/api/classes/${classId}/exams` 
                : '/api/exams';
            const response = await axiosInstance.get(endpoint);
            
            // 按状态分类考试
            const categorizedExams = response.data.reduce(
                (acc: typeof exams, exam: Exam) => {
                    switch (exam.status) {
                        case 'READY':
                            acc.notReady.push(exam);
                            break;
                        case 'GRADING':
                            acc.grading.push(exam);
                            break;
                        case 'COMPLETED':
                            acc.completed.push(exam);
                            break;
                    }
                    return acc;
                },
                { notReady: [], grading: [], completed: [] }
            );
            
            setExams(categorizedExams);
        } catch (error) {
            console.error('获取考试列表失败:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExams();
    }, [classId]);

    const columns = [
        {
            title: '考试名称',
            dataIndex: 'name',
            key: 'name',
            width: '30%',
        },
        {
            title: '班级',
            dataIndex: ['class', 'name'],
            key: 'className',
            width: '20%',
        },
        {
            title: '创建时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: '25%',
            render: (date: string) => new Date(date).toLocaleString(),
        },
        {
            title: '操作',
            key: 'action',
            render: (_: unknown, record: Exam) => (
                <Space>
                    {record.status === 'GRADING' && (
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => router.push(`/dashboard/exams/${record.id}/grade`)}
                        >
                            批改
                        </Button>
                    )}
                    {record.status === 'COMPLETED' && (
                        <Button
                            type="link"
                            icon={<EyeOutlined />}
                            onClick={() => router.push(`/dashboard/exams/${record.id}/results`)}
                        >
                            查看成绩
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    const tabItems = [
        {
            key: 'grading',
            label: (
                <span>
                    待批改
                    {exams.grading.length > 0 && (
                        <Tag color="processing" className="ml-2">
                            {exams.grading.length}
                        </Tag>
                    )}
                </span>
            ),
            children: (
                <Table
                    dataSource={exams.grading}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                    locale={{
                        emptyText: <Empty description="暂无待批改的考试" />
                    }}
                />
            ),
        },
        {
            key: 'completed',
            label: '已完成',
            children: (
                <Table
                    dataSource={exams.completed}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                    locale={{
                        emptyText: <Empty description="暂无已完成的考试" />
                    }}
                />
            ),
        },
        {
            key: 'notReady',
            label: '未开始',
            children: (
                <Table
                    dataSource={exams.notReady}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                    locale={{
                        emptyText: <Empty description="暂无未开始的考试" />
                    }}
                />
            ),
        },
    ];

    return (
        <Card title="考试管理" className="shadow-sm">
            <Tabs items={tabItems} defaultActiveKey="grading" />
        </Card>
    );
} 