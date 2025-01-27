import { useState, useEffect } from 'react';
import { Card, Table, Tag, message, Empty, Spin, Typography } from 'antd';
import { TrophyOutlined, BookOutlined } from '@ant-design/icons';
import axiosInstance from '@/lib/axios';
import { useRouter } from 'next/navigation';

const { Title } = Typography;

interface Grade {
    examId: string;
    examName: string;
    fullScore: number;
    className: string;
    classId: string;
    score: number;
}

export function StudentGrades() {
    const router = useRouter();
    const [grades, setGrades] = useState<Grade[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchGrades = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/api/students/grades');
            if (response.data.success) {
                setGrades(response.data.grades);
            }
        } catch (error) {
            message.error('获取成绩失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGrades();
    }, []);

    const columns = [
        {
            title: '考试名称',
            dataIndex: 'examName',
            key: 'examName',
            render: (text: string) => (
                <span className="font-medium text-blue-600">{text}</span>
            )
        },
        {
            title: '班级',
            dataIndex: 'className',
            key: 'className',
            render: (text: string) => (
                <Tag color="blue">{text}</Tag>
            )
        },
        {
            title: '得分/满分',
            key: 'score',
            render: (record: Grade) => (
                <div>
                    <span className={`font-medium ${record.score >= record.fullScore * 0.6 ? 'text-green-500' : 'text-red-500'}`}>
                        {record.score}
                    </span>
                    <span className="text-gray-400 mx-1">/</span>
                    <span className="text-gray-600">{record.fullScore}</span>
                </div>
            )
        },
        {
            title: '得分率',
            key: 'scoreRate',
            render: (record: Grade) => {
                const rate = (record.score / record.fullScore * 100).toFixed(1);
                const color = Number(rate) >= 60 ? 'success' : 'error';
                return <Tag color={color}>{rate}%</Tag>;
            }
        }
    ];

    return (
        <Card
            title={
                <div className="flex items-center gap-2">
                    <TrophyOutlined className="text-yellow-500" />
                    <Title level={5} style={{ margin: 0 }}>我的成绩</Title>
                </div>
            }
            className="shadow-sm"
        >
            {loading ? (
                <div className="py-20 text-center">
                    <Spin size="large" />
                </div>
            ) : grades.length === 0 ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                        <span className="text-gray-500">
                            暂无考试成绩
                        </span>
                    }
                />
            ) : (
                <Table
                    columns={columns}
                    dataSource={grades}
                    rowKey="examId"
                    pagination={{
                        pageSize: 10,
                        showTotal: (total) => `共 ${total} 条记录`,
                        showSizeChanger: true,
                        showQuickJumper: true
                    }}
                />
            )}
        </Card>
    );
} 