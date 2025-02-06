// 该界面是查看考生的批改详情
'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Tag, Button, Image, Divider, message, Space, Typography, Affix, Skeleton } from 'antd';
import { ArrowLeftOutlined, ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axios';

const { Title, Text } = Typography;

interface AnswerDetail {
    id: string;
    questionType: string;  // 'CHOICE' | 'FILL' | 'ESSAY' 等
    orderNum: number;
    score: number;
    teacherScore: number;
    teacherComment?: string;
    aiScore?: number;
    aiComment?: string;
    answerQuestionImage: string;
    isGraded: boolean;
}

interface ExamInfo {
    name: string;
    fullScore: number;
    class: {
        name: string;
        subject: string;
    };
}

interface ResultDetail {
    examinee: {
        name: string;
        studentId: string;
    };
    totalScore: number;
    answers: AnswerDetail[];
}

// 题目类型映射
const questionTypeMap: Record<string, string> = {
    'SINGLE_CHOICE': '选择题',
    'MULTIPLE_CHOICE': '多选题',
    'FILL': '填空题',
    'ESSAY': '问答题',
    'PROGRAMMING': '编程题'
};

export default function StudentResultPage({ 
    params 
}: { 
    params: { examId: string; studentId: string } 
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState<ResultDetail | null>(null);
    const [examInfo, setExamInfo] = useState<ExamInfo | null>(null);
    const [imageScale, setImageScale] = useState(1);

    // 获取考试信息和考生答题详情
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [examResponse, resultResponse] = await Promise.all([
                    axiosInstance.get(`/api/exams/${params.examId}`),
                    axiosInstance.get(`/api/exams/${params.examId}/students/${params.studentId}/result`)
                ]);
                setExamInfo(examResponse.data);
                setDetail(resultResponse.data);
            } catch (error) {
                console.error('获取数据失败:', error);
                message.error('获取数据失败');
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [params.examId, params.studentId]);

    // 滚动到指定题目
    const scrollToQuestion = (questionId: string) => {
        const element = document.getElementById(`question-${questionId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // 按题型分组答题
    const groupedAnswers = detail?.answers.reduce((groups, answer) => {
        const type = questionTypeMap[answer.questionType] || answer.questionType;
        if (!groups[type]) {
            groups[type] = [];
        }
        groups[type].push(answer);
        return groups;
    }, {} as Record<string, AnswerDetail[]>);

    if (loading) {
        return (
            <div className="p-6">
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {/* 顶部导航骨架屏 */}
                    <div className="flex items-center justify-between">
                        <Space>
                            <Skeleton.Button active size="large" />
                            <Skeleton.Input active size="large" style={{ width: 300 }} />
                        </Space>
                    </div>

                    {/* 考试信息卡片骨架屏 */}
                    <Card>
                        <Row gutter={[16, 16]}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <Col span={8} key={i}>
                                    <Space>
                                        <Skeleton.Input active size="small" style={{ width: 80 }} />
                                        <Skeleton.Input active size="small" style={{ width: 120 }} />
                                    </Space>
                                </Col>
                            ))}
                            <Col span={24}>
                                <Space>
                                    <Skeleton.Input active size="small" style={{ width: 80 }} />
                                    <Skeleton.Button active size="small" style={{ width: 100 }} />
                                </Space>
                            </Col>
                        </Row>
                    </Card>

                    {/* 题目导航骨架屏 */}
                    <Card size="small">
                        <Space wrap>
                            {[1, 2, 3, 4, 5].map(i => (
                                <Skeleton.Button 
                                    active 
                                    key={i} 
                                    size="small" 
                                    style={{ width: 180, marginRight: 8, marginBottom: 8 }} 
                                />
                            ))}
                        </Space>
                    </Card>

                    {/* 答题详情骨架屏 */}
                    <Card>
                        <Title level={4}>答题详情</Title>
                        {[1, 2, 3].map(i => (
                            <div key={i} className="mb-8">
                                {/* 题目信息骨架屏 */}
                                <div className="mb-4">
                                    <Space>
                                        <Skeleton.Input active size="small" style={{ width: 80 }} />
                                        <Skeleton.Button active size="small" style={{ width: 60 }} />
                                        <Skeleton.Input active size="small" style={{ width: 100 }} />
                                        <Skeleton.Button active size="small" style={{ width: 80 }} />
                                    </Space>
                                </div>

                                {/* AI评分骨架屏 */}
                                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                    <Skeleton active paragraph={{ rows: 2 }} />
                                </div>

                                {/* 教师评语骨架屏 */}
                                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                    <Skeleton active paragraph={{ rows: 2 }} />
                                </div>

                                {/* 答题图片骨架屏 */}
                                <div className="border rounded-lg p-4">
                                    <div className="text-right mb-2">
                                        <Space>
                                            <Skeleton.Button active size="small" />
                                            <Skeleton.Button active size="small" />
                                        </Space>
                                    </div>
                                    <div className="flex justify-center">
                                        <Skeleton.Image active style={{ width: '100%', height: 300 }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Card>
                </Space>
            </div>
        );
    }

    return (
        <div className="p-6">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* 顶部导航和考试信息 */}
                <div className="flex items-center justify-between">
                    <Space>
                        <Button 
                            icon={<ArrowLeftOutlined />} 
                            onClick={() => router.back()}
                        >
                            返回
                        </Button>
                        <Title level={4} style={{ margin: 0 }}>
                            {examInfo?.name}
                        </Title>
                    </Space>
                </div>

                {/* 考试基本信息卡片 */}
                <Card>
                    <Row gutter={[16, 16]}>
                        <Col span={8}>
                            <Text strong>班级：</Text>
                            <Text>{examInfo?.class.name}</Text>
                        </Col>
                        <Col span={8}>
                            <Text strong>科目：</Text>
                            <Text>{examInfo?.class.subject}</Text>
                        </Col>
                        <Col span={8}>
                            <Text strong>满分：</Text>
                            <Text>{examInfo?.fullScore}分</Text>
                        </Col>
                        <Col span={8}>
                            <Text strong>考生姓名：</Text>
                            <Text>{detail?.examinee.name}</Text>
                        </Col>
                        <Col span={8}>
                            <Text strong>学号：</Text>
                            <Text>{detail?.examinee.studentId}</Text>
                        </Col>
                        <Col span={24}>
                            <Text strong>总分：</Text>
                            <Tag 
                                color={(detail?.totalScore || 0) >= (examInfo?.fullScore || 0) * 0.6 ? 'success' : 'error'}
                                style={{ marginLeft: 8 }}
                            >
                                {detail?.totalScore || 0} / {examInfo?.fullScore || 0}
                                <span className="ml-2">
                                    ({((detail?.totalScore || 0) / (examInfo?.fullScore || 1) * 100).toFixed(1)}%)
                                </span>
                            </Tag>
                        </Col>
                    </Row>
                </Card>

                {/* 添加固定位置的题目导航 */}
                <Affix offsetTop={20}>
                    <Card className="mb-4" size="small">
                        <Space wrap>
                            {detail?.answers.map((answer) => (
                                <Button
                                    key={answer.id}
                                    size="small"
                                    onClick={() => scrollToQuestion(answer.id)}
                                >
                                    <Space>
                                        <span>第{answer.orderNum}题</span>
                                        <Tag 
                                            color={(answer.teacherScore / answer.score) >= 0.6 ? 'success' : 'error'}
                                            className="ml-1"
                                        >
                                            {answer.teacherScore}/{answer.score}
                                        </Tag>
                                    </Space>
                                </Button>
                            ))}
                        </Space>
                    </Card>
                </Affix>

                <Card>
                    <Title level={4}>答题详情</Title>
                    {groupedAnswers && Object.entries(groupedAnswers).map(([type, answers]) => (
                        <div key={type} className="mb-8">
                            <Title level={5} className="mb-4">
                                {type}（共{answers.length}题）
                            </Title>
                            {answers.map((answer) => (
                                <div 
                                    key={answer.id} 
                                    id={`question-${answer.id}`} 
                                    className="mb-6"
                                >
                                    <div className="mb-2">
                                        <Space>
                                            <Text strong>第{answer.orderNum}题</Text>
                                            <Text>满分：{answer.score}分</Text>
                                            <Tag color={answer.teacherScore >= answer.score * 0.6 ? 'success' : 'error'}>
                                                得分：{answer.teacherScore}分
                                            </Tag>
                                        </Space>
                                    </div>

                                    {/* AI评分和评语 */}
                                    {answer.aiScore !== undefined && (
                                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                            <Row>
                                                <Col span={24}>
                                                    <Text type="secondary">AI评分：</Text>
                                                    <Tag color={answer.aiScore >= answer.score * 0.6 ? 'success' : 'error'}>
                                                        {answer.aiScore}分
                                                    </Tag>
                                                </Col>
                                                {answer.aiComment && (
                                                    <Col span={24} className="mt-2">
                                                        <Text type="secondary">AI评语：</Text>
                                                        <div className="mt-1 text-gray-700">{answer.aiComment}</div>
                                                    </Col>
                                                )}
                                            </Row>
                                        </div>
                                    )}

                                    {/* 教师评分和评语 */}
                                    {answer.teacherScore !== undefined && (
                                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                            <Row>
                                                <Col span={24}>
                                                    <Text type="secondary">教师评分：</Text>
                                                    <Tag color={answer.teacherScore >= answer.score * 0.6 ? 'success' : 'error'}>
                                                        {answer.teacherScore}分
                                                    </Tag>
                                                </Col>
                                                {answer.teacherComment && (
                                                    <Col span={24} className="mt-2">
                                                        <Text type="secondary">教师评语：</Text>
                                                        <div className="mt-1 text-gray-700">{answer.teacherComment}</div>
                                                    </Col>
                                                )}
                                            </Row>
                                        </div>
                                    )}

                                    {/* 答题图片部分 */}
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
                    ))}
                </Card>
            </Space>
        </div>
    );
} 