'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Space, Button, Table, Modal, Upload, QRCode, message } from 'antd'
import { UploadOutlined, QrcodeOutlined, PlusOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import * as XLSX from 'xlsx'
import { useSession } from 'next-auth/react'
import axiosInstance from '@/lib/axios'

interface Student {
    id: string
    name: string
    studentId: string
    joinTime: string
}

export default function ClassDetail({ params }: { params: { id: string } }) {
    const router = useRouter()
    const { data: session } = useSession()
    const [students, setStudents] = useState<Student[]>([])
    const [qrVisible, setQrVisible] = useState(false)
    const [loading, setLoading] = useState(false)

    //   获取学生列表
    const fetchStudents = async () => {

    }

    useEffect(() => {
        fetchStudents()
    }, [params.id])

    //   导入学生
    const handleImportStudents = async (data: any[]) => {

    }

    //   删除学生
    const handleDeleteStudent = async (studentId: string) => {

    }

    //   创建考试
    const handleCreateExam = async () => {

    }

    const columns = [
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
            title: '加入时间',
            dataIndex: 'joinTime',
            key: 'joinTime',
        },
        {
            title: '操作',
            key: 'action',
            render: (_: any, record: Student) => (
                <Space size="middle">
                    <Button type="link">
                        编辑
                    </Button>
                    <Button type="link" danger onClick={() => handleDeleteStudent(record.id)}>
                        删除
                    </Button>
                </Space>
            ),
        },
    ]

    const uploadProps: UploadProps = {
        accept: '.xlsx,.xls',
        showUploadList: false,
        beforeUpload: (file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = e.target?.result;
                const workbook = XLSX.read(new Uint8Array(data as ArrayBuffer), { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                handleImportStudents(jsonData);
            };
            reader.readAsArrayBuffer(file);
            return false;
        },
    };

    return (
        <div className="p-6">
            <div className="flex justify-between mb-6">
                <div className="space-x-4">
                    <Upload {...uploadProps}>
                        <Button icon={<UploadOutlined />}>批量导入学生</Button>
                    </Upload>
                    <Button
                        icon={<QrcodeOutlined />}
                        onClick={() => setQrVisible(true)}
                    >
                        查看班级二维码
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleCreateExam}
                    >
                        创建考试
                    </Button>
                </div>
            </div>

            <Table
                columns={columns}
                dataSource={students}
                rowKey="id"
                loading={loading}
            />

            <Modal
                title="班级加入二维码"
                open={qrVisible}
                onCancel={() => setQrVisible(false)}
                footer={null}
            >
                <div className="flex justify-center">
                    <QRCode
                        value={`${process.env.NEXT_PUBLIC_APP_URL}/join-class/${params.id}`}
                        size={200}
                    />
                </div>
            </Modal>
        </div>
    )
}
