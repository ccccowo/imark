'use client'

import { Space, Button, Table, Modal, Form, Input, message, Tag, Upload } from 'antd'
import { UploadOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { UploadProps } from 'antd'
import { Exam, Examinee } from '@/app/types'
import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import axiosInstance from '@/lib/axios'
import { PaperCropModal } from './PaperCropModal'

// 考试管理组件的props
interface ExamManagementProps {
    classId: string
    examModalVisible: boolean
    editingExam: Exam | null
    examName: string
    onCreateExam: () => void
    onEditExam: (exam: Exam) => void
    onDeleteExam: (examId: string) => void
    onSaveExam: () => Promise<void>
    onCancelModal: () => void
    onExamNameChange: (value: string) => void
}

export default function ExamManagement({
    classId,
    examModalVisible,
    editingExam,
    examName,
    onCreateExam,
    onEditExam,
    onDeleteExam,
    onSaveExam,
    onCancelModal,
    onExamNameChange
}: ExamManagementProps) {
    const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
    const [examinees, setExaminees] = useState<Examinee[]>([]);
    const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
    const [showExamineesModal, setShowExamineesModal] = useState(false);
    const [exams, setExams] = useState<Exam[]>([]);
    const [showPaperCropModal, setShowPaperCropModal] = useState(false);

    // 获取考试列表
    const fetchExams = async () => {
        try {
            const response = await axiosInstance.get(`/api/classes/${classId}/exams`);
            setExams(response.data);
        } catch (error) {
            console.error('获取考试列表失败:', error);
            message.error('获取考试列表失败');
        }
    };

    // 处理上传考试名单
    const handleUploadStudentList = async (examId: string, file: File) => {
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const data = e.target?.result;
                const workbook = XLSX.read(new Uint8Array(data as ArrayBuffer), { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                // 验证并格式化数据
                const formattedData = jsonData.map((row: any) => ({
                    name: row['name'],  // 直接使用 Excel 中的列名
                    studentId: String(row['studentId']),  // 直接使用 Excel 中的列名
                })).filter(item => item.name && item.studentId); // 过滤掉无效数据

                if (formattedData.length === 0) {
                    throw new Error('Excel 文件中没有有效数据');
                }

                // 发送到后端API
                const response = await axiosInstance.post(`/api/exams/${examId}/students`, {
                    students: formattedData
                });

                if (response.status === 200) {
                    message.success(`成功导入 ${response.data.count} 名考生`);
                    await fetchExams();  // 重新获取考试列表
                }
            };
            reader.readAsArrayBuffer(file);
        } catch (error) {
            console.error('上传失败:', error);
            message.error('上传失败，请确保 Excel 包含 name 和 studentId 列');
        }
    };

    const uploadProps = (examId: string): UploadProps => ({
        accept: '.xlsx,.xls',
        showUploadList: false,
        beforeUpload: (file) => {
            handleUploadStudentList(examId, file);
            return false;
        },
    });

    // 获取考生列表
    const fetchExaminees = async (examId: string) => {
        try {
            const response = await axiosInstance.get(`/api/exams/${examId}/students`);
            setExaminees(response.data);  // 直接设置返回的数组
        } catch (error) {
            console.error('获取考生列表失败:', error);
            message.error('获取考生列表失败');
        }
    };

    // 处理查看考生
    const handleViewExaminees = async (examId: string) => {
        // 设置选中的考试ID
        setSelectedExamId(examId);
        // 显示考生列表弹窗
        setShowExamineesModal(true);
        // 获取考生列表
        await fetchExaminees(examId);
    };

    // 处理重新上传
    const handleReupload = async (examId: string, file: File) => {
        Modal.confirm({
            title: '确认重新上传',
            icon: <ExclamationCircleOutlined />,
            content: '重新上传将覆盖现有考生名单，是否继续？',
            onOk: async () => {
                try {
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        const data = e.target?.result;
                        const workbook = XLSX.read(new Uint8Array(data as ArrayBuffer), { type: 'array' });
                        const sheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[sheetName];
                        const jsonData = XLSX.utils.sheet_to_json(worksheet);

                        const formattedData = jsonData.map((row: any) => ({
                            name: row['name'],
                            studentId: String(row['studentId']),
                        })).filter(item => item.name && item.studentId);

                        if (formattedData.length === 0) {
                            throw new Error('Excel 文件中没有有效数据');
                        }

                        const response = await axiosInstance.put(`/api/exams/${examId}/students`, {
                            students: formattedData
                        });

                        if (response.status === 200) {
                            message.success(response.data.message);
                            await fetchExams();  // 重新获取考试列表
                            await fetchExaminees(examId);  // 如果模态框打开，也更新考生列表
                        }
                    };
                    reader.readAsArrayBuffer(file);
                } catch (error) {
                    console.error('上传失败:', error);
                    message.error('上传失败，请确保 Excel 包含 name 和 studentId 列');
                }
            },
        });
    };

    // 考生列表列定义
    const examineeColumns: ColumnsType<Examinee> = [
        {
            title: '姓名',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: '学号',
            dataIndex: 'studentId',
            key: 'studentId',
        },
        {
            title: '导入时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => new Date(date).toLocaleString()
        },
    ];

    // 考试列表列定义
    const examColumns: ColumnsType<Exam> = [
        {
            title: '考试名称',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const statusConfig = {
                    READY: {
                        color: 'processing',
                        text: '准备中'
                    },
                    GRADING: {
                        color: 'warning',
                        text: '批改中'
                    },
                    COMPLETED: {
                        color: 'success',
                        text: '已完成'
                    }
                }

                const config = statusConfig[status as keyof typeof statusConfig] || {
                    color: 'default',
                    text: status
                }

                return (
                    <Tag color={config.color}>
                        {config.text}
                    </Tag>
                )
            }
        },
        {
            title: '创建时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => new Date(date).toLocaleString()
        },
        {
            title: '操作',
            key: 'action',
            render: (_: any, record: Exam) => (
                <Space size="middle">
                    {record.status === 'READY' && (
                        <>
                            <Button
                                type="link"
                                onClick={() => handleViewExaminees(record.id)}
                            >
                                查看考生
                            </Button>
                            <Upload
                                {...uploadProps(record.id)}
                                showUploadList={false}
                                beforeUpload={(file) => {
                                    if (record.examinees.length > 0) {
                                        // 如果已有考生，显示重新上传确认
                                        handleReupload(record.id, file);
                                    } else {
                                        // 如果没有考生，直接上传
                                        handleUploadStudentList(record.id, file);
                                    }
                                    return false;
                                }}
                            >
                                <Button type="link">
                                    {record.examinees.length > 0 ? '重新上传考试单' : '上传考试名单'}
                                </Button>
                            </Upload>
                            <Button
                                type="link"
                                onClick={() => {
                                    setSelectedExamId(record.id);
                                    setShowPaperCropModal(true);
                                }}
                            >
                                上传样卷
                            </Button>
                        </>
                    )}
                    <Button
                        type="link"
                        onClick={() => onEditExam(record)}
                    >
                        编辑
                    </Button>
                    <Button
                        type="link"
                        danger
                        onClick={() => setExamToDelete(record)}
                    >
                        删除
                    </Button>
                </Space>
            ),
        },
    ]

    // 初始加载和依赖更新时获取考试列表
    useEffect(() => {
        fetchExams();
    }, [classId]);

    return (
        <div>
            <div className="mb-4">
                <Button onClick={onCreateExam}>
                    新建考试
                </Button>
            </div>
            <Table
                columns={examColumns}
                dataSource={exams}
                rowKey="id"
            />
            <Modal
                title={editingExam ? "编辑考试" : "新建考试"}
                open={examModalVisible}
                onOk={onSaveExam}
                onCancel={onCancelModal}
            >
                <Form layout="vertical">
                    <Form.Item label="考试名称" required>
                        <Input
                            value={examName}
                            onChange={e => onExamNameChange(e.target.value)}
                            placeholder="请输入考试名称"
                        />
                    </Form.Item>
                </Form>
            </Modal>
            <Modal
                title="确认删除"
                open={!!examToDelete}
                onOk={() => {
                    if (examToDelete) {
                        onDeleteExam(examToDelete.id);
                        setExamToDelete(null);
                    }
                }}
                onCancel={() => setExamToDelete(null)}
                okText="确认"
                cancelText="取消"
                okButtonProps={{ danger: true }}
            >
                <p>确定要删除考试"{examToDelete?.name}"吗？此操作不可恢复。</p>
            </Modal>
            <Modal
                title="考生列表"
                open={showExamineesModal}
                onCancel={() => setShowExamineesModal(false)}
                footer={null}
                width={800}
            >
                <Table
                    columns={examineeColumns}
                    dataSource={examinees}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                />
            </Modal>
            <PaperCropModal
                visible={showPaperCropModal}
                examId={selectedExamId}
                onClose={() => {
                    setShowPaperCropModal(false);
                    setSelectedExamId(null);
                }}
            />
        </div>
    )
}