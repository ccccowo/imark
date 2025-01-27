'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Tag, Button, Image, Progress, Divider, message, Space } from 'antd';
import { ArrowLeftOutlined, ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axiosInstance from '@/lib/axios';

interface AnswerDetail {
    id: string;
    questionType: string;
    orderNum: number;
    score: number;
    teacherScore: number;
    teacherComment?: string;
    answerQuestionImage: string;
}

interface ResultDetail {
    examinee: {
        name: string;
        studentId: string;
    };
    totalScore: number;
    answers: AnswerDetail[];
}

interface QuestionGroup {
    type: string;
    typeName: string;
    answers: AnswerDetail[];
}

export default function StudentResultPage({ 
    params 
}: { 
    params: { examId: string } 
}) {
    const router = useRouter();
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState<ResultDetail | null>(null);
    const [examInfo, setExamInfo] = useState<{ name: string; fullScore: number } | null>(null);
    const [imageScale, setImageScale] = useState(1);
    const [activeQuestion, setActiveQuestion] = useState<string>('');

    // 获取考试信息
    const fetchExamInfo = async () => {
        try {
            const response = await axiosInstance.get(`/api/exams/${params.examId}`);
            setExamInfo({
                name: response.data.name,
                fullScore: response.data.fullScore
            });
        } catch (error) {
            console.error('获取考试信息失败:', error);
            message.error('获取考试信息失败');
        }
    };

    // 获取学生的考试结果
    const fetchStudentResult = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/api/exams/${params.examId}/student-result`);
            if (response.data) {
                setDetail(response.data);
            }
        } catch (error: any) {
            console.error('获取考试结果失败:', error);
            message.error(error.response?.data?.error || '获取考试结果失败');
            if (error.response?.status === 404) {
                router.push('/dashboard');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session?.user?.id) {
            fetchExamInfo();
            fetchStudentResult();
        }
    }, [params.examId, session?.user?.id]);

    // 获取题型显示文本
    const getQuestionTypeText = (type: string) => {
        const typeMap: { [key: string]: string } = {
            'MULTIPLE_CHOICE': '选择题',
            'SINGLE_CHOICE': '单选题',
            'TRUE_FALSE': '判断题',
            'SHORT_ANSWER': '简答题',
            'FILL_BLANK': '填空题'
        };
        return typeMap[type] || type;
    };

    // 按题型对答题进行分组
    const groupedAnswers = detail?.answers.reduce((groups: QuestionGroup[], answer) => {
        const existingGroup = groups.find(g => g.type === answer.questionType);
        if (existingGroup) {
            existingGroup.answers.push(answer);
        } else {
            groups.push({
                type: answer.questionType,
                typeName: getQuestionTypeText(answer.questionType),
                answers: [answer]
            });
        }
        return groups;
    }, []).sort((a, b) => {
        const order = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK', 'SHORT_ANSWER'];
        return order.indexOf(a.type) - order.indexOf(b.type);
    }) || [];

    // 滚动到指定题目
    const scrollToQuestion = (questionId: string) => {
        setActiveQuestion(questionId);
        const element = document.getElementById(`question-${questionId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (!session?.user?.id) {
        return null;
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Card loading className="w-full max-w-4xl shadow-md" />
            </div>
        );
    }

    if (!detail || !examInfo) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Card className="w-full max-w-4xl shadow-md">
                    <div className="text-center text-gray-500">
                        未找到考试结果或考试信息
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-4">
            {/* 顶部导航 */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                    <Button 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => router.back()}
                    >
                        返回
                    </Button>
                    <span className="text-xl font-bold">
                        {examInfo.name}
                    </span>
                </div>
            </div>

            {/* 快速导航 */}
            <Card className="shadow-md sticky top-4 z-10 bg-white mb-4">
                <div className="space-y-4">
                    {groupedAnswers.map(group => (
                        <div key={group.type}>
                            <div className="font-medium text-gray-700 mb-2">
                                {group.typeName}
                                <Tag className="ml-2" color="blue">
                                    {group.answers.reduce((sum, a) => sum + a.teacherScore, 0)} / 
                                    {group.answers.reduce((sum, a) => sum + a.score, 0)} 分
                                </Tag>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {group.answers.map(answer => (
                                    <Button
                                        key={answer.id}
                                        type={activeQuestion === answer.id ? 'primary' : 'default'}
                                        size="small"
                                        onClick={() => scrollToQuestion(answer.id)}
                                        className={
                                            answer.teacherScore >= answer.score * 0.6 
                                                ? 'border-green-500 hover:border-green-600' 
                                                : 'border-red-500 hover:border-red-600'
                                        }
                                    >
                                        第{answer.orderNum}题
                                        <span className="ml-1 text-xs">
                                            ({answer.teacherScore}/{answer.score})
                                        </span>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* 学生信息和总分 */}
            <Card loading={loading} className="shadow-md">
                <Row gutter={24}>
                    <Col span={6}>
                        <div className="text-gray-500">学生姓名</div>
                        <div className="font-medium text-lg">
                            {detail?.examinee.name}
                        </div>
                    </Col>
                    <Col span={6}>
                        <div className="text-gray-500">学号</div>
                        <div className="font-medium text-lg">
                            {detail?.examinee.studentId}
                        </div>
                    </Col>
                    <Col span={6}>
                        <div className="text-gray-500">总分</div>
                        <div className="font-medium text-lg">
                            <Tag color={(detail?.totalScore ?? 0) >= 60 ? 'success' : 'error'}>
                                {detail?.totalScore ?? 0} / {examInfo?.fullScore ?? 0} 分
                            </Tag>
                        </div>
                    </Col>
                    <Col span={6}>
                        <Progress
                            type="circle"
                            percent={Number(((detail?.totalScore ?? 0) / (examInfo?.fullScore ?? 100) * 100).toFixed(1))}
                            format={percent => `${percent}%`}
                            status={(detail?.totalScore ?? 0) >= 60 ? 'success' : 'exception'}
                        />
                    </Col>
                </Row>
            </Card>

            {/* 题型得分统计 */}
            <Divider />
            <Row gutter={16}>
                {groupedAnswers.map(group => (
                    <Col key={group.type} span={8} className="mb-4">
                        <Card size="small">
                            <div className="text-base font-medium mb-2">{group.typeName}</div>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <div className="flex justify-between">
                                    <span>总分：{group.answers.reduce((sum, a) => sum + a.score, 0)}分</span>
                                    <span>得分：{group.answers.reduce((sum, a) => sum + a.teacherScore, 0)}分</span>
                                </div>
                                <Progress 
                                    percent={Number((group.answers.reduce((sum, a) => sum + a.teacherScore, 0) / 
                                            group.answers.reduce((sum, a) => sum + a.score, 0) * 100).toFixed(1))}
                                    size="small"
                                    status={(group.answers.reduce((sum, a) => sum + a.teacherScore, 0) / 
                                            group.answers.reduce((sum, a) => sum + a.score, 0)) >= 0.6 ? 'success' : 'exception'}
                                />
                            </Space>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* 答题详情 */}
            <div className="space-y-8">
                {groupedAnswers.map(group => (
                    <Card 
                        key={group.type}
                        title={
                            <div className="flex items-center space-x-2">
                                <span className="text-lg font-bold">{group.typeName}</span>
                                <Tag color="blue">共 {group.answers.length} 题</Tag>
                            </div>
                        }
                        className="shadow-md"
                    >
                        <div className="space-y-8">
                            {group.answers.map(answer => (
                                <div 
                                    key={answer.id} 
                                    id={`question-${answer.id}`}
                                    className={`p-4 rounded-lg transition-all duration-300 ${
                                        activeQuestion === answer.id ? 'bg-blue-50 shadow-md' : ''
                                    }`}
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="text-lg font-medium">
                                            第 {answer.orderNum} 题
                                        </div>
                                        <Space>
                                            <Tag color="blue">{answer.score}分</Tag>
                                            <Tag color={answer.teacherScore >= answer.score * 0.6 ? 'success' : 'error'}>
                                                得分：{answer.teacherScore}分
                                            </Tag>
                                        </Space>
                                    </div>

                                    {answer.teacherComment && (
                                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                            <div className="text-gray-500 mb-1">教师评语：</div>
                                            <div className="text-gray-700">{answer.teacherComment}</div>
                                        </div>
                                    )}

                                    <div className="relative">
                                        <div className="absolute right-2 top-2 z-10">
                                            <Space>
                                                <Button 
                                                    icon={<ZoomOutOutlined />}
                                                    onClick={() => setImageScale(s => Math.max(0.5, s - 0.1))}
                                                />
                                                <Button 
                                                    icon={<ZoomInOutlined />}
                                                    onClick={() => setImageScale(s => Math.min(2, s + 0.1))}
                                                />
                                            </Space>
                                        </div>
                                        <div className="overflow-auto border rounded-lg">
                                            <Image
                                                src={answer.answerQuestionImage}
                                                alt={`第${answer.orderNum}题答题图片`}
                                                style={{ 
                                                    transform: `scale(${imageScale})`,
                                                    transformOrigin: 'top left'
                                                }}
                                                preview={{
                                                    mask: <div className="flex items-center">
                                                        <ZoomInOutlined className="mr-2" /> 查看大图
                                                    </div>
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
} 