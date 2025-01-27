'use client';

import { useState, useEffect } from 'react';
import { Card, Typography, Space, Spin, Empty, List, Tag, Image, Button, message, Row, Col, Descriptions } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axios';
import { useSession } from 'next-auth/react';

const { Title, Text, Paragraph } = Typography;

interface ExamResult {
    id: string;
    name: string;
    status: string;
    fullScore: number;
    score?: number;
    class: {
        name: string;
        subject: string;
    };
}

interface QuestionResult {
    id: string;
    orderNum: number;
    score: number;
    type: string;
    correctAnswer?: string;
    answerQuestion: {
        answerQuestionImage: string;
        teacherScore?: number;
        aiScore?: number;
        teacherComment?: string;
        aiComment?: string;
        isGraded: boolean;
    };
}

export default function ExamResultPage({ params }: { params: { examId: string } }) {
    const router = useRouter();
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [examResult, setExamResult] = useState<ExamResult | null>(null);
    const [questions, setQuestions] = useState<QuestionResult[]>([]);

    useEffect(() => {
        fetchExamResult();
    }, [params.examId]);

    const fetchExamResult = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/api/exams/${params.examId}/student-result`);
            setExamResult(response.data.exam);
            setQuestions(response.data.questions);
        } catch (error) {
            console.error('获取考试结果失败:', error);
            message.error('获取考试结果失败');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Spin size="large" />
            </div>
        );
    }

    if (!examResult) {
        return (
            <div className="flex justify-center items-center h-full">
                <Empty description="未找到考试结果" />
            </div>
        );
    }

    const scoreRate = examResult.score !== undefined && examResult.fullScore 
        ? (examResult.score / examResult.fullScore * 100).toFixed(1) 
        : null;

    return (
        <div className="p-6">
            {/* 顶部导航 */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <Button 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => router.back()}
                    >
                        返回
                    </Button>
                    <span className="text-xl font-bold">
                        考试详情
                    </span>
                </div>
            </div>

            {/* 考试信息卡片 */}
            <Card className="mb-6">
                <Descriptions title="考试信息" column={{ xs: 1, sm: 2, md: 3 }}>
                    <Descriptions.Item label="考试名称">{examResult.name}</Descriptions.Item>
                    <Descriptions.Item label="班级">{examResult.class.name}</Descriptions.Item>
                    <Descriptions.Item label="科目">{examResult.class.subject}</Descriptions.Item>
                    <Descriptions.Item label="总分">
                        {examResult.score !== undefined ? (
                            <Text>
                                {examResult.score} / {examResult.fullScore}
                                <Tag 
                                    color={scoreRate && parseFloat(scoreRate) >= 60 ? 'success' : 'error'}
                                    style={{ marginLeft: 8 }}
                                >
                                    {scoreRate}%
                                </Tag>
                            </Text>
                        ) : (
                            <Tag color="warning">未批改完成</Tag>
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label="状态">
                        <Tag color={examResult.status === 'COMPLETED' ? 'success' : 'processing'}>
                            {examResult.status === 'COMPLETED' ? '已完成' : '批改中'}
                        </Tag>
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            {/* 题目列表 */}
            <Card title="答题详情">
                <List
                    dataSource={questions}
                    renderItem={(question) => (
                        <List.Item>
                            <div className="w-full space-y-4">
                                <div className="flex justify-between items-center">
                                    <Title level={5}>第 {question.orderNum} 题</Title>
                                    <Space>
                                        <Text>得分：</Text>
                                        {question.answerQuestion.isGraded ? (
                                            <Tag color={
                                                (question.answerQuestion.teacherScore || question.answerQuestion.aiScore || 0) >= question.score 
                                                    ? 'success' 
                                                    : 'error'
                                            }>
                                                {question.answerQuestion.teacherScore || question.answerQuestion.aiScore || 0} / {question.score}
                                            </Tag>
                                        ) : (
                                            <Tag color="warning">待批改</Tag>
                                        )}
                                    </Space>
                                </div>

                                {/* 答题图片 */}
                                <Image
                                    src={question.answerQuestion.answerQuestionImage}
                                    alt={`第 ${question.orderNum} 题答案`}
                                    width={300}
                                />

                                {/* 批改评语 */}
                                {question.answerQuestion.isGraded && (
                                    <div className="bg-gray-50 p-4 rounded">
                                        {question.answerQuestion.teacherComment && (
                                            <div className="mb-2">
                                                <Text strong>教师评语：</Text>
                                                <Paragraph>{question.answerQuestion.teacherComment}</Paragraph>
                                            </div>
                                        )}
                                        {question.answerQuestion.aiComment && (
                                            <div>
                                                <Text strong>AI 评语：</Text>
                                                <Paragraph>{question.answerQuestion.aiComment}</Paragraph>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </List.Item>
                    )}
                />
            </Card>
        </div>
    );
} 