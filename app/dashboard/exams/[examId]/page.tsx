'use client';

import { useState, useEffect } from 'react';
import { Card, Descriptions, Table, Button, Space, Tag, Divider, Image } from 'antd';
import { useRouter } from 'next/navigation';
import {
    TeamOutlined,
    FileImageOutlined,
    ScissorOutlined,
    ArrowLeftOutlined
} from '@ant-design/icons';
import axiosInstance from '@/lib/axios';
import { Question, Exam, Examinee } from '@/app/types';

export default function ExamDetail({ params }: { params: { examId: string } }) {
    const router = useRouter();
    const [exam, setExam] = useState<Exam | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [examinees, setExaminees] = useState<Examinee[]>([]);

    useEffect(() => {
        const fetchExamDetails = async () => {
            try {
                // 获取考试基本信息
                const examResponse = await axiosInstance.get(`/api/exams/${params.examId}`);
                setExam(examResponse.data);

                // 获取题目列表
                const questionsResponse = await axiosInstance.get(`/api/exams/${params.examId}/questions`);
                setQuestions(questionsResponse.data);

                // 获取考生列表
                const examineesResponse = await axiosInstance.get(`/api/exams/${params.examId}/students`);
                setExaminees(examineesResponse.data);
            } catch (error) {
                console.error('获取考试详情失败:', error);
            }
        };

        fetchExamDetails();
    }, [params.examId]);

    const questionTypeMap = {
        SINGLE_CHOICE: '单选题',
        MULTIPLE_CHOICE: '多选题',
        FILL_IN_THE_BLANK: '填空题',
        TRUE_OR_FALSE: '判断题',
        SHORT_ANSWER: '简答题'
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={() => router.back()}
                className="mb-6"
            >
                返回
            </Button>

            {exam && (
                <div className="space-y-6">
                    {/* 基本信息 */}
                    <Card title="考试基本信息" className="shadow-sm">
                        <Descriptions column={2}>
                            <Descriptions.Item label="考试名称">{exam.name}</Descriptions.Item>
                            <Descriptions.Item label="班级名称">{exam.class?.name}</Descriptions.Item>
                            <Descriptions.Item label="考试状态">
                                <Tag color={
                                    exam.status === 'NOT_READY' ? 'default' :
                                    exam.status === 'READY' ? 'processing' :
                                    exam.status === 'GRADING' ? 'warning' : 'success'
                                }>
                                    {exam.status === 'NOT_READY' ? '未准备' :
                                     exam.status === 'READY' ? '已准备' :
                                     exam.status === 'GRADING' ? '批改中' : '已完成'}
                                </Tag>
                            </Descriptions.Item>
                            {exam.totalScore && (
                                <Descriptions.Item label="考试总分">
                                    {exam.totalScore} 分
                                </Descriptions.Item>
                            )}
                        </Descriptions>
                    </Card>

                    {/* 考生信息 */}
                    <Card 
                        title={
                            <Space>
                                <TeamOutlined />
                                <span>考生名单</span>
                                <Tag color="blue">{examinees.length} 人</Tag>
                            </Space>
                        }
                        className="shadow-sm"
                    >
                        <Table
                            dataSource={examinees}
                            columns={[
                                {
                                    title: '姓名',
                                    dataIndex: 'name',
                                    key: 'name',
                                },
                                {
                                    title: '学号',
                                    dataIndex: 'studentId',
                                    key: 'studentId',
                                }
                            ]}
                            pagination={{ pageSize: 10 }}
                            rowKey="id"
                        />
                    </Card>

                    {/* 样卷和题目信息 */}
                    {exam.paperImage && (
                        <Card 
                            title={
                                <Space>
                                    <FileImageOutlined />
                                    <span>样卷与题目</span>
                                    {questions.length > 0 && (
                                        <Tag color="green">{questions.length} 道题目</Tag>
                                    )}
                                </Space>
                            }
                            className="shadow-sm"
                        >
                            <div className="grid grid-cols-2 gap-6">
                                {/* 左侧：样卷预览 */}
                                <div>
                                    <h3 className="text-lg font-medium mb-4">样卷预览</h3>
                                    <Image
                                        src={exam.paperImage}
                                        alt="样卷"
                                        className="rounded-lg"
                                    />
                                </div>

                                {/* 右侧：题目列表 */}
                                <div>
                                    <h3 className="text-lg font-medium mb-4">题目列表</h3>
                                    {questions.length > 0 ? (
                                        <Table
                                            dataSource={questions}
                                            columns={[
                                                {
                                                    title: '题号',
                                                    dataIndex: 'orderNum',
                                                    key: 'orderNum',
                                                    width: 80,
                                                    render: (num) => (
                                                        <Tag color="blue">{num}</Tag>
                                                    )
                                                },
                                                {
                                                    title: '题型',
                                                    dataIndex: 'type',
                                                    key: 'type',
                                                    render: (type) => questionTypeMap[type]
                                                },
                                                {
                                                    title: '分值',
                                                    dataIndex: 'score',
                                                    key: 'score',
                                                    render: (score) => `${score} 分`
                                                }
                                            ]}
                                            pagination={false}
                                            rowKey="id"
                                            summary={(pageData) => (
                                                <Table.Summary fixed>
                                                    <Table.Summary.Row>
                                                        <Table.Summary.Cell index={0} colSpan={2}>
                                                            总分
                                                        </Table.Summary.Cell>
                                                        <Table.Summary.Cell index={1}>
                                                            {pageData.reduce((sum, q) => sum + q.score, 0)} 分
                                                        </Table.Summary.Cell>
                                                    </Table.Summary.Row>
                                                </Table.Summary>
                                            )}
                                        />
                                    ) : (
                                        <div className="text-center text-gray-500 py-8">
                                            暂未切割题目
                                            <Button
                                                type="link"
                                                icon={<ScissorOutlined />}
                                                onClick={() => router.push(`/dashboard/exams/${exam.id}/crop`)}
                                            >
                                                去切割试卷
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
} 