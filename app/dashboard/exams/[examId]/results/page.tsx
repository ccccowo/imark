'use client';

import { useState, useEffect } from 'react';
import { Card, Table, Tag, Typography, Space, Button, Row, Col, Statistic, Progress } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axios';

const { Title } = Typography;

interface ExamResult {
    id: string;
    totalScore: number;
    examinee: {
        name: string;
        studentId: string;
    };
}

interface ExamInfo {
    id: string;
    name: string;
    fullScore: number;
    status: string;
}

export default function ExamResultsPage({ params }: { params: { examId: string } }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState<ExamResult[]>([]);
    const [examInfo, setExamInfo] = useState<ExamInfo | null>(null);

    // 获取考试信息和成绩
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [examResponse, resultsResponse] = await Promise.all([
                    axiosInstance.get(`/api/exams/${params.examId}`),
                    axiosInstance.get(`/api/exams/${params.examId}/results`)
                ]);
                
                setExamInfo(examResponse.data);
                setResults(Array.isArray(resultsResponse.data) ? resultsResponse.data : []);
            } catch (error) {
                console.error('获取数据失败:', error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [params.examId]);

    // 计算统计数据
    const statistics = {
        avgScore: results.length ? 
            (results.reduce((sum, r) => sum + (r.totalScore || 0), 0) / results.length).toFixed(1) : '0',
        passRate: results.length ? 
            (results.filter(r => (r.totalScore || 0) >= 60).length / results.length * 100).toFixed(1) : '0',
        maxScore: results.length ? 
            Math.max(...results.map(r => r.totalScore || 0)) : 0,
        minScore: results.length ? 
            Math.min(...results.map(r => r.totalScore || 0)) : 0
    };

    const columns = [
        {
            title: '学号',
            dataIndex: ['examinee', 'studentId'],
            key: 'studentId',
        },
        {
            title: '姓名',
            dataIndex: ['examinee', 'name'],
            key: 'name',
        },
        {
            title: '得分',
            dataIndex: 'totalScore',
            key: 'totalScore',
            sorter: (a: ExamResult, b: ExamResult) => a.totalScore - b.totalScore,
            render: (score: number) => (
                <Tag color={score >= 60 ? 'success' : 'error'}>
                    {score}分
                </Tag>
            ),
        },
        {
            title: '操作',
            key: 'action',
            render: (_:any, record: ExamResult) => (
                <Button 
                    type="link" 
                    onClick={() => router.push(`/dashboard/exams/${params.examId}/student/${record.examinee.studentId}`)}
                >
                    查看详情
                </Button>
            ),
        },
    ];

    return (
        <div className="p-6">
            <Space direction="vertical" size="large" className="w-full">
                {/* 顶部导航 */}
                <Space className="mb-4">
                    <Button 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => router.back()}
                    >
                        返回
                    </Button>
                    <Title level={4} style={{ margin: 0 }}>
                        {examInfo?.name} - 成绩统计
                    </Title>
                </Space>

                {/* 统计卡片 */}
                <Row gutter={16}>
                    <Col span={6}>
                        <Card>
                            <Statistic 
                                title="平均分" 
                                value={statistics.avgScore} 
                                suffix="分"
                                precision={1}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic 
                                title="及格率" 
                                value={statistics.passRate} 
                                suffix="%" 
                                precision={1}
                            />
                            <Progress 
                                percent={Number(statistics.passRate)} 
                                size="small" 
                                status={Number(statistics.passRate) >= 60 ? 'success' : 'exception'}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic 
                                title="最高分" 
                                value={statistics.maxScore} 
                                suffix="分"
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic 
                                title="最低分" 
                                value={statistics.minScore} 
                                suffix="分"
                            />
                        </Card>
                    </Col>
                </Row>

                {/* 成绩列表 */}
                <Card>
                    <Table
                        columns={columns}
                        dataSource={results || []}
                        rowKey="id"
                        loading={loading}
                        pagination={{
                            pageSize: 10,
                            showTotal: (total) => `共 ${total} 条记录`,
                        }}
                    />
                </Card>
            </Space>
        </div>
    );
} 