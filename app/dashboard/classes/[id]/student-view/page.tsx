// 该界面是学生查看自己班级考试列表的界面
'use client';

import { useState, useEffect } from 'react';
import { Card, Button, List, Tag, message, Typography, Space, Row, Col, Spin, Empty, Modal } from 'antd';
import { ArrowLeftOutlined, TeamOutlined, ClockCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axios';
import { useSession } from 'next-auth/react';

const { Title, Text } = Typography;

interface ClassInfo {
    id: string;
    name: string;
    subject: string;
    _count?: {
        students: number;
    };
    students?: any[];
    teacher?: {
        name: string;
    };
}

interface Exam {
    id: string;
    name: string;
    status: string;
    createdAt: string;
    examinees?: {
        id: string;
        studentId: string;
        totalScore?: number;
    }[];
}

export default function StudentClassView({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { data: session } = useSession();
    const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [studentId, setStudentId] = useState<string>('');

    // 获取班级信息
    const fetchClassInfo = async () => {
        try {
            const response = await axiosInstance.get(`/api/classes/${params.id}`);
            setClassInfo(response.data);
        } catch (error) {
            console.error('获取班级信息失败:', error);
            message.error('获取班级信息失败');
        }
    };

    // 获取考试列表
    const fetchExams = async () => {
        try {
            setLoading(true);
            // 先获取学生信息
            const profileResponse = await axiosInstance.get('/api/students/profile');
            const studentId = profileResponse.data.studentId;
            
            // 获取并过滤考试
            const response = await axiosInstance.get(`/api/classes/${params.id}/exams`);
            const studentExams = response.data.filter((exam: Exam) => 
                exam.examinees?.some(examinee => 
                    examinee.studentId === studentId
                )
            );
            
            setExams(studentExams || []);
        } catch (error) {
            console.error('获取考试列表失败:', error);
            message.error('获取考试列表失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClassInfo();
        fetchExams();
    }, [params.id]);

    useEffect(() => {
        const fetchStudentId = async () => {
            const response = await axiosInstance.get('/api/students/profile');
            setStudentId(response.data.studentId);
        };
        fetchStudentId();
    }, []);

    // 获取考试状态标签
    const getExamStatusTag = (status: string, score?: number, fullScore?: number) => {
        if (status === 'COMPLETED') {
            const rate = score && fullScore ? (score / fullScore * 100).toFixed(1) : 0;
            const color = score && fullScore && score >= fullScore * 0.6 ? 'success' : 'error';
            return <Tag color={color}>{score}分 ({rate}%)</Tag>;
        }
        if (status === 'GRADING') {
            return <Tag color="processing">批改中</Tag>;
        }
        return <Tag color="warning">未开始</Tag>;
    };

    // 查看考试详情
    const handleViewExamDetail = (examId: string) => {
        if (!studentId) {  // 直接使用状态中的 studentId
            message.error('未找到学生信息');
            return;
        }
        router.push(`/dashboard/exams/${examId}/student/${studentId}`);
    };

    // 退出班级
    const handleLeaveClass = async () => {
        try {
            console.log('正在退出班级:', params.id);
            const response = await axiosInstance.delete(`/api/classes/${params.id}/leave`);
            console.log('退出班级响应:', response.data);
            if (response.data) {
                message.success('已退出班级');
                router.push('/dashboard');
            }
        } catch (error: any) {
            console.error('退出班级失败:', error);
            console.error('错误详情:', error.response?.data);
            message.error(error.response?.data?.error || '退出班级失败');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Spin size="large" />
            </div>
        );
    }

    if (!classInfo) {
        return (
            <div className="flex justify-center items-center h-full">
                <Empty description="未找到班级信息" />
            </div>
        );
    }

    // 计算学生人数
    const studentCount = classInfo._count?.students || classInfo.students?.length || 0;

    return (
        <div className="p-6">
            {/* 顶部导航栏 */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <Button 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => router.back()}
                    >
                        返回
                    </Button>
                    <div>
                        <span className="text-xl font-bold">
                            {classInfo.name}
                        </span>
                        <span className="ml-2 text-gray-500">
                            {classInfo.subject}
                        </span>
                    </div>
                </div>
                <Button 
                    danger
                    onClick={() => {
                        Modal.confirm({
                            title: '确认退出班级',
                            content: '退出后将无法查看班级信息和考试记录，确定要退出吗？',
                            okText: '确认退出',
                            cancelText: '取消',
                            onOk: handleLeaveClass
                        });
                    }}
                >
                    退出班级
                </Button>
            </div>

            <Card>
                <Space direction="vertical" size="large" className="w-full">
                    <div>
                        <Title level={4}>{classInfo.name}</Title>
                        <Space size="large">
                            <Text type="secondary">科目：{classInfo.subject}</Text>
                            <Text type="secondary">教师：{classInfo.teacher?.name || '未知'}</Text>
                            <Text type="secondary">学生人数：{studentCount}</Text>
                        </Space>
                    </div>

                    <div>
                        <Title level={5}>考试列表</Title>
                        {exams.length > 0 ? (
                            <List
                                dataSource={exams}
                                renderItem={(exam) => (
                                    <List.Item
                                        actions={[
                                            <Button
                                                key="view"
                                                type="link"
                                                icon={<EyeOutlined />}
                                                onClick={() => handleViewExamDetail(exam.id)}
                                            >
                                                查看批改详情
                                            </Button>
                                        ]}
                                    >
                                        <Row className="w-full" align="middle" justify="space-between">
                                            <Col>
                                                <Space>
                                                    <Text>{exam.name}</Text>
                                                    <Tag color={exam.status === 'COMPLETED' ? 'green' : 'blue'}>
                                                        {exam.status === 'COMPLETED' ? '已完成' : '进行中'}
                                                    </Tag>
                                                    {(() => {
                                                        const examinee = exam.examinees?.find(e => e.studentId === studentId);
                                                        return examinee?.totalScore !== undefined && (
                                                            <Tag color={examinee.totalScore >= 60 ? 'success' : 'error'}>
                                                                {examinee.totalScore}分
                                                            </Tag>
                                                        );
                                                    })()}
                                                </Space>
                                            </Col>
                                            <Col>
                                                <Text type="secondary">
                                                    {new Date(exam.createdAt).toLocaleString()}
                                                </Text>
                                            </Col>
                                        </Row>
                                    </List.Item>
                                )}
                            />
                        ) : (
                            <Empty description="暂无考试" />
                        )}
                    </div>
                </Space>
            </Card>
        </div>
    );
} 