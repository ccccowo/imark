'use client';

import { useState, useEffect } from 'react';
import { Table, Card, Tag, Button, Space, message, Statistic, Row, Col, Alert } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axios';

interface ExamResult {
    id: string;
    studentId: string;
    score: number;
    student: {
        name: string;
        studentId: string;
    };
}

interface ExamInfo {
    id: string;
    name: string;
    fullScore: number;
    status: 'NOT_READY' | 'GRADING' | 'COMPLETED';
}

export default function ResultsPage({ params }: { params: { examId: string } }) {
    const router = useRouter();
    const [results, setResults] = useState<ExamResult[]>([]);
    const [examInfo, setExamInfo] = useState<ExamInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        avgScore: 0,
        maxScore: 0,
        minScore: 0,
        passCount: 0,
        totalCount: 0
    });

    // 获取考试信息
    const fetchExamInfo = async () => {
        try {
            const response = await axiosInstance.get(`/api/exams/${params.examId}`);
            setExamInfo(response.data);
        } catch (error) {
            console.error('获取考试信息失败:', error);
            message.error('获取考试信息失败');
        }
    };

    // 获取成绩数据
    const fetchResults = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/api/exams/${params.examId}/results`);
            console.log('成绩数据:', response.data); // 添加调试日志
            
            const results = response.data.results;
            if (!Array.isArray(results)) {
                console.error('返回的成绩数据格式不正确:', results);
                message.error('成绩数据格式不正确');
                return;
            }

            setResults(results);
            
            // 改进统计数据计算
            if (results.length > 0) {
                const validScores = results
                    .map((r: ExamResult) => r.score)
                    .filter((score: number) => score !== null && !isNaN(score));

                if (validScores.length > 0) {
                    const total = validScores.reduce((a: number, b: number) => a + b, 0);
                    const passCount = validScores.filter((s: number) => s >= 60).length;
                    
                    setStats({
                        avgScore: Number((total / validScores.length).toFixed(1)),
                        maxScore: Math.max(...validScores),
                        minScore: Math.min(...validScores),
                        passCount: passCount,
                        totalCount: results.length
                    });
                } else {
                    // 如果没有有效成绩
                    setStats({
                        avgScore: 0,
                        maxScore: 0,
                        minScore: 0,
                        passCount: 0,
                        totalCount: results.length
                    });
                }
            } else {
                // 如果没有任何结果
                setStats({
                    avgScore: 0,
                    maxScore: 0,
                    minScore: 0,
                    passCount: 0,
                    totalCount: 0
                });
            }
        } catch (error) {
            console.error('获取成绩数据失败:', error);
            message.error('获取成绩数据失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExamInfo();
        fetchResults();
    }, [params.examId]);

    // 导出成绩
    const handleExport = async () => {
        try {
            const response = await axiosInstance.get(`/api/exams/${params.examId}/results/export`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${examInfo?.name || '考试'}_成绩表.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('导出失败:', error);
            message.error('导出失败');
        }
    };

    const columns = [
        {
            title: '学号',
            dataIndex: ['student', 'studentId'],
            key: 'studentId',
            width: 120,
            render: (text: string) => text || '暂无'
        },
        {
            title: '姓名',
            dataIndex: ['student', 'name'],
            key: 'name',
            width: 100,
            render: (text: string) => text || '暂无'
        },
        {
            title: '成绩',
            dataIndex: 'score',
            key: 'score',
            width: 100,
            sorter: (a: ExamResult, b: ExamResult) => (a.score || 0) - (b.score || 0),
            render: (score: number) => (
                <Tag color={score >= 60 ? 'success' : 'error'} className="px-2">
                    {score?.toFixed(1) || 0} 分
                </Tag>
            )
        },
        {
            title: '操作',
            key: 'action',
            width: 120,
            render: (_: unknown, record: ExamResult) => (
                <Button
                    type="link"
                    onClick={() => router.push(`/dashboard/exams/${params.examId}/results/${record.id}`)}
                    icon={<EyeOutlined />}
                >
                    查看详情
                </Button>
            )
        }
    ];

    return (
        <div className="p-6 space-y-4">
            {/* 顶部导航和考试信息 */}
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <Button 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => router.back()}
                    >
                        返回
                    </Button>
                    <span className="text-xl font-bold">{examInfo?.name || '加载中...'}</span>
                    <Tag color="purple" className="text-base px-2">
                        总分：{examInfo?.fullScore || '--'} 分
                    </Tag>
                </div>
                <Button 
                    type="primary" 
                    icon={<DownloadOutlined />}
                    onClick={handleExport}
                >
                    导出成绩
                </Button>
            </div>

            {/* 统计信息 */}
            <Card className="shadow-md">
                <Row gutter={16}>
                    <Col span={4}>
                        <Statistic
                            title="平均分"
                            value={stats.avgScore || 0}
                            suffix="分"
                            precision={1}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Col>
                    <Col span={4}>
                        <Statistic
                            title="最高分"
                            value={stats.maxScore || 0}
                            suffix="分"
                            precision={1}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Col>
                    <Col span={4}>
                        <Statistic
                            title="最低分"
                            value={stats.minScore || 0}
                            suffix="分"
                            precision={1}
                            valueStyle={{ color: stats.minScore < 60 ? '#cf1322' : '#3f8600' }}
                        />
                    </Col>
                    <Col span={4}>
                        <Statistic
                            title="及格率"
                            value={stats.totalCount ? (stats.passCount / stats.totalCount * 100) : 0}
                            suffix="%"
                            precision={1}
                            valueStyle={{ 
                                color: stats.totalCount && (stats.passCount / stats.totalCount >= 0.6) 
                                    ? '#3f8600' 
                                    : '#cf1322' 
                            }}
                        />
                    </Col>
                    <Col span={4}>
                        <Statistic
                            title="总人数"
                            value={stats.totalCount}
                            suffix="人"
                        />
                    </Col>
                </Row>
            </Card>

            {/* 成绩列表 */}
            <Card 
                title="成绩列表" 
                className="shadow-md"
            >
                <Table 
                    columns={columns}
                    dataSource={results}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showTotal: (total) => `共 ${total} 条记录`,
                        showSizeChanger: true,
                        showQuickJumper: true
                    }}
                    locale={{
                        emptyText: '暂无成绩数据'
                    }}
                />
            </Card>
        </div>
    );
} 