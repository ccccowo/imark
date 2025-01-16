'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Space, message, Card, Input, Spin, Tag } from 'antd';
import { EditOutlined, CheckOutlined, RobotOutlined } from '@ant-design/icons';
import Image from 'next/image';
import axiosInstance from '@/lib/axios';

interface AnswerQuestion {
    id: string;
    examineeId: string;
    questionId: string;
    answerQuestionImage: string;
    aiScore?: number;
    teacherScore?: number;
    aiComment?: string;
    teacherComment?: string;
    aiConfidence?: number;
    isGraded: boolean;
    examinee: {
        name: string;
        studentId: string;
    };
    question: {
        orderNum: number;
        type: string;
        score: number;
    };
}

export default function GradePage({ params }: { params: { examId: string } }) {
    const [answers, setAnswers] = useState<AnswerQuestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentAnswer, setCurrentAnswer] = useState<AnswerQuestion | null>(null);

    // 获取所有答题记录
    const fetchAnswers = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/api/exams/${params.examId}/answer-questions`);
            setAnswers(response.data);
        } catch (error) {
            console.error('获取答题记录失败:', error);
            message.error('获取答题记录失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnswers();
    }, [params.examId]);

    // AI 批改
    const handleAIGrade = async (answerId: string) => {
        try {
            setLoading(true);
            const response = await axiosInstance.post(`/api/exams/${params.examId}/grade`, {
                answerId
            });
            
            if (response.data.success) {
                message.success('AI批改完成');
                fetchAnswers(); // 刷新列表
            }
        } catch (error) {
            console.error('AI批改失败:', error);
            message.error('AI批改失败');
        } finally {
            setLoading(false);
        }
    };

    // 教师批改
    const handleTeacherGrade = async (answerId: string, score: number, comment: string) => {
        try {
            setLoading(true);
            await axiosInstance.post(`/api/exams/${params.examId}/grade/teacher`, {
                answerId,
                score,
                comment
            });
            message.success('保存成功');
            fetchAnswers();
        } catch (error) {
            console.error('保存失败:', error);
            message.error('保存失败');
        } finally {
            setLoading(false);
        }
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
            title: '题号',
            dataIndex: ['question', 'orderNum'],
            key: 'orderNum',
        },
        {
            title: '题型',
            dataIndex: ['question', 'type'],
            key: 'type',
            render: (type: string) => {
                const typeMap = {
                    'MULTIPLE_CHOICE': '选择题',
                    'TRUE_FALSE': '判断题',
                    'SHORT_ANSWER': '简答题'
                };
                return typeMap[type as keyof typeof typeMap] || type;
            }
        },
        {
            title: '状态',
            key: 'status',
            render: (_: any, record: AnswerQuestion) => (
                <Tag color={record.isGraded ? 'green' : 'orange'}>
                    {record.isGraded ? '已批改' : '待批改'}
                </Tag>
            )
        },
        {
            title: '操作',
            key: 'action',
            render: (_: unknown, record: AnswerQuestion) => (
                <Space>
                    <Button
                        type="link"
                        icon={<RobotOutlined />}
                        onClick={() => handleAIGrade(record.id)}
                        loading={loading}
                    >
                        AI批改
                    </Button>
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => setCurrentAnswer(record)}
                    >
                        人工批改
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <div className="p-6">
            <div className="flex space-x-4">
                {/* 左侧答题列表 */}
                <div className="w-2/3">
                    <Card title="答题列表">
                        <Table
                            columns={columns}
                            dataSource={answers}
                            rowKey="id"
                            loading={loading}
                        />
                    </Card>
                </div>

                {/* 右侧批改区域 */}
                <div className="w-1/3">
                    {currentAnswer && (
                        <Card title="批改区域" className="sticky top-6">
                            {/* 答题图片 */}
                            <div className="mb-4">
                                <Image
                                    src={currentAnswer.answerQuestionImage}
                                    alt="答题图片"
                                    width={400}
                                    height={300}
                                    className="rounded-lg"
                                />
                            </div>

                            {/* AI 建议 */}
                            {currentAnswer.aiScore !== null && (
                                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                                    <h4 className="font-medium mb-2">AI 建议</h4>
                                    <p>建议分数：{currentAnswer.aiScore}</p>
                                    <p>评语：{currentAnswer.aiComment}</p>
                                    <p>置信度：{currentAnswer.aiConfidence}</p>
                                </div>
                            )}

                            {/* 教师评分区域 */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block mb-2">分数</label>
                                    <Input
                                        type="number"
                                        defaultValue={currentAnswer.teacherScore}
                                        onChange={(e) => {
                                            const newAnswer = { ...currentAnswer };
                                            newAnswer.teacherScore = Number(e.target.value);
                                            setCurrentAnswer(newAnswer);
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2">评语</label>
                                    <Input.TextArea
                                        defaultValue={currentAnswer.teacherComment}
                                        onChange={(e) => {
                                            const newAnswer = { ...currentAnswer };
                                            newAnswer.teacherComment = e.target.value;
                                            setCurrentAnswer(newAnswer);
                                        }}
                                    />
                                </div>
                                <Button
                                    type="primary"
                                    icon={<CheckOutlined />}
                                    onClick={() => {
                                        if (currentAnswer.teacherScore !== undefined) {
                                            handleTeacherGrade(
                                                currentAnswer.id,
                                                currentAnswer.teacherScore,
                                                currentAnswer.teacherComment || ''
                                            );
                                        }
                                    }}
                                >
                                    保存评分
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
} 