'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Space, message, Card, Input, Tag, Image, Tooltip, Radio, Divider } from 'antd';
import { EditOutlined, CheckOutlined, RobotOutlined, ZoomInOutlined, ZoomOutOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import axiosInstance from '@/lib/axios';
import { useRouter } from 'next/navigation';

interface ExamInfo {
    id: string;
    name: string;
    fullScore: number;
    status: string;
}

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
        correctAnswer?: string;
    };
}

export default function GradePage({ params }: { params: { examId: string } }) {
    const router = useRouter();
    const [answers, setAnswers] = useState<AnswerQuestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentAnswer, setCurrentAnswer] = useState<AnswerQuestion | null>(null);
    const [imageScale, setImageScale] = useState(1);
    const [viewMode, setViewMode] = useState<'student' | 'question'>('student');
    const [showGuide, setShowGuide] = useState(false);
    const [examInfo, setExamInfo] = useState<ExamInfo | null>(null);

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

    useEffect(() => {
        fetchExamInfo();
    }, [params.examId]);

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

    // 修改学生视图列定义，移除操作列
    const studentColumns = [
        {
            title: '学号',
            dataIndex: ['examinee', 'studentId'],
            key: 'studentId',
            width: 40,
        },
        {
            title: '姓名',
            dataIndex: ['examinee', 'name'],
            key: 'name',
            width: 40,
        },
        {
            title: '题号',
            dataIndex: ['question', 'orderNum'],
            key: 'orderNum',
            width: 40,
        },
        {
            title: '题型',
            dataIndex: ['question', 'type'],
            key: 'type',
            width: 60,
            render: (type: string) => (
                <Tag color={type === 'SHORT_ANSWER' ? 'blue' : 'green'} className="px-1 text-xs">
                    {getQuestionTypeText(type)}
                </Tag>
            )
        },
        {
            title: '分值',
            dataIndex: ['question', 'score'],
            key: 'score',
            width: 50,
            render: (score: number) => (
                <Tag color="purple" className="px-1 text-xs">{score}分</Tag>
            )
        },
        {
            title: 'AI评分',
            key: 'aiScore',
            width: 80,
            render: (_: any, record: AnswerQuestion) => (
                <Space size={0}>
                    {record.aiScore !== null ? (
                        <Tag color="blue" className="px-1 text-xs">{record.aiScore}分</Tag>
                    ) : (
                        <Tag color="default" className="px-1 text-xs">未评分</Tag>
                    )}
                    {record.aiConfidence && (
                        <Tooltip title="AI置信度">
                            <Tag color="cyan" className="px-1 text-xs ml-1">{Math.round(record.aiConfidence * 100)}%</Tag>
                        </Tooltip>
                    )}
                </Space>
            )
        },
        {
            title: '教师评分',
            dataIndex: 'teacherScore',
            key: 'teacherScore',
            width: 60,
            render: (score: number | null) => (
                score !== null ? (
                    <Tag color="green" className="px-1 text-xs">{score}分</Tag>
                ) : (
                    <Tag color="default" className="px-1 text-xs">未评分</Tag>
                )
            )
        },
        {
            title: '状态',
            key: 'status',
            width: 60,
            render: (_: any, record: AnswerQuestion) => (
                <Tag 
                    color={record.isGraded ? 'success' : 'warning'}
                    className="px-1 text-xs"
                >
                    {record.isGraded ? '已批改' : '待批改'}
                </Tag>
            )
        }
    ];

    // 修改题目视图列定义，使其与学生视图保持一致
    const questionColumns = [
        {
            title: '题号',
            dataIndex: ['question', 'orderNum'],
            key: 'orderNum',
            width: 40,
            sorter: (a: AnswerQuestion, b: AnswerQuestion) => a.question.orderNum - b.question.orderNum,
        },
        {
            title: '题型',
            dataIndex: ['question', 'type'],
            key: 'type',
            width: 60,
            render: (type: string) => (
                <Tag color={type === 'SHORT_ANSWER' ? 'blue' : 'green'} className="px-1 text-xs">
                    {getQuestionTypeText(type)}
                </Tag>
            )
        },
        {
            title: '学号',
            dataIndex: ['examinee', 'studentId'],
            key: 'studentId',
            width: 40,
        },
        {
            title: '姓名',
            dataIndex: ['examinee', 'name'],
            key: 'name',
            width: 40,
        },
        {
            title: '分值',
            dataIndex: ['question', 'score'],
            key: 'score',
            width: 50,
            render: (score: number) => (
                <Tag color="purple" className="px-1 text-xs">{score}分</Tag>
            )
        },
        {
            title: 'AI评分',
            key: 'aiScore',
            width: 80,
            render: (_: any, record: AnswerQuestion) => (
                <Space size={0}>
                    {record.aiScore !== null ? (
                        <Tag color="blue" className="px-1 text-xs">{record.aiScore}分</Tag>
                    ) : (
                        <Tag color="default" className="px-1 text-xs">未评分</Tag>
                    )}
                    {record.aiConfidence && (
                        <Tooltip title="AI置信度">
                            <Tag color="cyan" className="px-1 text-xs ml-1">{Math.round(record.aiConfidence * 100)}%</Tag>
                        </Tooltip>
                    )}
                </Space>
            )
        },
        {
            title: '教师评分',
            dataIndex: 'teacherScore',
            key: 'teacherScore',
            width: 60,
            render: (score: number | null) => (
                score !== null ? (
                    <Tag color="green" className="px-1 text-xs">{score}分</Tag>
                ) : (
                    <Tag color="default" className="px-1 text-xs">未评分</Tag>
                )
            )
        },
        {
            title: '状态',
            key: 'status',
            width: 60,
            render: (_: any, record: AnswerQuestion) => (
                <Tag 
                    color={record.isGraded ? 'success' : 'warning'}
                    className="px-1 text-xs"
                >
                    {record.isGraded ? '已批改' : '待批改'}
                </Tag>
            )
        }
    ];

    // 根据视图模式获取排序后的数据
    const getSortedData = () => {
        return [...answers].sort((a, b) => {
            if (viewMode === 'student') {
                // 按学生排序：先按学号，再按题号
                return a.examinee.studentId.localeCompare(b.examinee.studentId) || 
                       a.question.orderNum - b.question.orderNum;
            } else {
                // 按题目排序：先按题号，再按学号
                return a.question.orderNum - b.question.orderNum || 
                       a.examinee.studentId.localeCompare(b.examinee.studentId);
            }
        });
    };

    // 修改快捷操作函数
    const handleQuickScore = (score: number) => {
        if (!currentAnswer) return;
        const newAnswer = { ...currentAnswer };
        newAnswer.teacherScore = score;
        setCurrentAnswer(newAnswer);
    };

    const handleNavigate = (direction: 'prev' | 'next') => {
        if (!currentAnswer) return;
        const sortedData = getSortedData();
        const currentIndex = sortedData.findIndex(item => item.id === currentAnswer.id);
        if (currentIndex === -1) return;

        const targetIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex >= 0 && targetIndex < sortedData.length) {
            setCurrentAnswer(sortedData[targetIndex]);
        }
    };

    return (
        <div className="p-6 space-y-4">
            {/* 顶部导航和考试信息 */}
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <Button 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => router.back()}
                        className="flex items-center"
                    >
                        返回
                    </Button>
                    <span className="text-xl font-bold">{examInfo?.name || '加载中...'}</span>
                    <Tag color="purple" className="text-base px-2">
                        总分：{examInfo?.fullScore || '--'} 分
                    </Tag>
                    <Tag color="blue" className="text-base px-2">
                        {examInfo?.status === 'GRADING' ? '批改中' : '已完成'}
                    </Tag>
                </div>
            </div>

            {/* 使用说明 - 可折叠 */}
            <Card 
                className="bg-gradient-to-r from-blue-50 to-blue-100"
                title={
                    <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setShowGuide(!showGuide)}>
                        <span className="text-lg font-bold text-blue-800">📖 批改说明</span>
                        <span className="text-blue-600 text-sm">
                            {showGuide ? '点击收起 ↑' : '点击展开 ↓'}
                        </span>
                    </div>
                }
            >
                {showGuide && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <h3 className="font-medium text-blue-700 flex items-center space-x-2">
                                    <span>👀 查看方式</span>
                                </h3>
                                <ul className="list-disc list-inside text-blue-600 space-y-1">
                                    <li>按学生：查看同一学生的所有题目答案</li>
                                    <li>按题目：查看同一题目的所有学生答案</li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-medium text-blue-700 flex items-center space-x-2">
                                    <span>✍️ 批改方式</span>
                                </h3>
                                <ul className="list-disc list-inside text-blue-600 space-y-1">
                                    <li>AI批改：快速获取AI评分建议</li>
                                    <li>人工批改：查看答题图片并手动评分</li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-medium text-blue-700 flex items-center space-x-2">
                                    <span>💡 操作提示</span>
                                </h3>
                                <ul className="list-disc list-inside text-blue-600 space-y-1">
                                    <li>点击表格行可查看答题详情</li>
                                    <li>使用缩放按钮调整图片大小</li>
                                    <li>可参考AI建议进行评分</li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-medium text-blue-700 flex items-center space-x-2">
                                    <span>⭐️ 评分说明</span>
                                </h3>
                                <ul className="list-disc list-inside text-blue-600 space-y-1">
                                    <li>分数不能超过题目满分</li>
                                    <li>评语为可选项</li>
                                    <li>确认无误后点击保存</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            <div className="flex space-x-4">
                {/* 左侧答题列表 */}
                <div className="w-3/5">
                    <Card 
                        title={
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <span className="text-lg font-bold">📝 答题记录</span>
                                    <Tag color="blue">{answers.length}条记录</Tag>
                                </div>
                                <Space>
                                    <Radio.Group 
                                        value={viewMode} 
                                        onChange={e => setViewMode(e.target.value)}
                                        buttonStyle="solid"
                                        size="middle"
                                    >
                                        <Radio.Button value="student">
                                            <Space>
                                                <span>👨‍🎓</span>
                                                按学生
                                            </Space>
                                        </Radio.Button>
                                        <Radio.Button value="question">
                                            <Space>
                                                <span>📋</span>
                                                按题目
                                            </Space>
                                        </Radio.Button>
                                    </Radio.Group>
                                </Space>
                            </div>
                        }
                        className="shadow-md hover:shadow-lg transition-shadow duration-300"
                    >
                        <Table 
                            columns={viewMode === 'student' ? studentColumns : questionColumns}
                            dataSource={getSortedData()}
                            rowKey="id"
                            loading={loading}
                            size="small"
                            className="ant-table-compact"
                            scroll={{ x: 'max-content', y: 'calc(100vh - 400px)' }}
                            pagination={{
                                pageSize: 10,
                                showTotal: (total) => `共 ${total} 条记录`,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                size: "small"
                            }}
                            onRow={(record) => ({
                                onClick: () => setCurrentAnswer(record),
                                className: `cursor-pointer transition-colors duration-300 ${
                                    currentAnswer?.id === record.id 
                                        ? 'bg-blue-50 hover:bg-blue-100' 
                                        : 'hover:bg-gray-50'
                                }`
                            })}
                            rowClassName={(record) => 
                                currentAnswer?.id === record.id ? 'ant-table-row-selected' : ''
                            }
                        />
                    </Card>
                </div>

                {/* 右侧批改区域 */}
                <div className="w-2/5">
                    {currentAnswer ? (
                        <Card 
                            title={
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold">✨ 批改详情</span>
                                    <Space>
                                        <Tooltip title="缩小">
                                            <Button 
                                                icon={<ZoomOutOutlined />} 
                                                onClick={() => setImageScale(scale => Math.max(0.5, scale - 0.1))}
                                            />
                                        </Tooltip>
                                        <Tooltip title="放大">
                                            <Button 
                                                icon={<ZoomInOutlined />} 
                                                onClick={() => setImageScale(scale => Math.min(2, scale + 0.1))}
                                            />
                                        </Tooltip>
                                    </Space>
                                </div>
                            }
                            className="shadow-md sticky top-6 hover:shadow-lg transition-shadow duration-300"
                        >
                            {/* 学生信息 */}
                            <div className="mb-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-gray-500">学生姓名</div>
                                        <div className="font-medium">{currentAnswer.examinee.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500">学号</div>
                                        <div className="font-medium">{currentAnswer.examinee.studentId}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500">题号</div>
                                        <div className="font-medium">第 {currentAnswer.question.orderNum} 题</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500">题型</div>
                                        <div className="font-medium">{getQuestionTypeText(currentAnswer.question.type)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* 答题图片 */}
                            <div className="mb-4 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                                <Image
                                    src={currentAnswer.answerQuestionImage}
                                    alt="答题图片"
                                    className="w-full"
                                    style={{ transform: `scale(${imageScale})`, transformOrigin: 'top left' }}
                                    preview={{
                                        mask: <div className="flex items-center"><ZoomInOutlined className="mr-2" /> 查看大图</div>
                                    }}
                                />
                            </div>
                            {/* AI批改按钮 */}
                            {!currentAnswer.aiScore && (
                                <div className="mb-4">
                                    <Button
                                        onClick={() => handleAIGrade(currentAnswer.id)}
                                        loading={loading}
                                        block
                                        size="large"
                                    >
                                        获取AI批改建议
                                    </Button>
                                </div>
                            )}

                            {/* AI 建议 */}
                            {currentAnswer.aiScore !== null && (
                                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                                    <div className="flex items-center mb-2">
                                        <span className="mr-2"></span>
                                        <span className="font-medium">AI 评分建议</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span>建议分数：</span>
                                            <Tag color="blue">{currentAnswer.aiScore} 分</Tag>
                                        </div>
                                        {currentAnswer.aiComment && (
                                            <div>
                                                <div className="text-gray-500 mb-1">评语：</div>
                                                <div className="bg-white p-3 rounded-lg shadow-sm">{currentAnswer.aiComment}</div>
                                            </div>
                                        )}
                                        {currentAnswer.aiConfidence && (
                                            <div className="flex justify-between items-center">
                                                <span>置信度：</span>
                                                <Tag color="cyan">{Math.round(currentAnswer.aiConfidence * 100)}%</Tag>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* 教师评分区域 */}
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="font-medium">教师评分</label>
                                        <Space>
                                            <Button size="small" danger onClick={() => handleQuickScore(0)}>0分</Button>
                                            <Button size="small" onClick={() => handleQuickScore(currentAnswer.question.score)}>满分</Button>
                                            <span className="text-gray-400 ml-2">满分 {currentAnswer.question.score} 分</span>
                                        </Space>
                                    </div>
                                    <Input
                                        type="number"
                                        max={currentAnswer.question.score}
                                        min={0}
                                        value={currentAnswer.teacherScore}
                                        onChange={(e) => {
                                            const newAnswer = { ...currentAnswer };
                                            newAnswer.teacherScore = Number(e.target.value);
                                            setCurrentAnswer(newAnswer);
                                        }}
                                        className="hover:border-blue-400 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block mb-2 font-medium">评语</label>
                                    <Input.TextArea
                                        value={currentAnswer.teacherComment}
                                        onChange={(e) => {
                                            const newAnswer = { ...currentAnswer };
                                            newAnswer.teacherComment = e.target.value;
                                            setCurrentAnswer(newAnswer);
                                        }}
                                        placeholder="请输入评语"
                                        rows={3}
                                        className="hover:border-blue-400 focus:border-blue-500"
                                    />
                                </div>

                                <div className="flex space-x-2">
                                    <Button
                                        size="middle"
                                        onClick={() => handleNavigate('prev')}
                                        disabled={!getSortedData().find((item, index) => 
                                            item.id === currentAnswer?.id && index > 0
                                        )}
                                    >
                                        ← 上一题
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            if (currentAnswer.teacherScore !== undefined) {
                                                handleTeacherGrade(
                                                    currentAnswer.id,
                                                    currentAnswer.teacherScore,
                                                    currentAnswer.teacherComment || ''
                                                );
                                            }
                                        }}
                                        className="flex-1"
                                    >
                                        保存评分
                                    </Button>
                                    <Button
                                        size="middle"
                                        onClick={() => handleNavigate('next')}
                                        disabled={!getSortedData().find((item, index) => 
                                            item.id === currentAnswer?.id && index < getSortedData().length - 1
                                        )}
                                    >
                                        下一题 →
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <Card className="shadow-md text-center py-12 hover:shadow-lg transition-shadow duration-300">
                            <div className="text-gray-400">
                                <span style={{ fontSize: 48 }} className="text-blue-300">✍️</span>
                                <p className="mt-4">请从左侧选择要批改的答题记录</p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
} 