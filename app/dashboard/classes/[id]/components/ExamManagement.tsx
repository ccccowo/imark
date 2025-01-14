'use client'

import { Space, Button, Table, Modal, Form, Input, message, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Exam } from '@/app/types'
import { useState } from 'react'

interface ExamManagementProps {
    exams: Exam[]
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
    exams,
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
                    NOT_READY: {
                        color: 'default',
                        text: '未准备'
                    },
                    IN_PROGRESS: {
                        color: 'processing',
                        text: '进行中'
                    },
                    FINISHED: {
                        color: 'success',
                        text: '已结束'
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
        </div>
    )
} 