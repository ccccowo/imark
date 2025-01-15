'use client'

import { useState } from 'react'
import { Space, Button, Table, Upload, message, Input, Modal, Tag } from 'antd'
import { UploadOutlined, UserOutlined, IdcardOutlined, CalendarOutlined, DeleteOutlined, ExclamationCircleOutlined, SearchOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import * as XLSX from 'xlsx'
import axiosInstance from '@/lib/axios'
import { Student } from '@/app/types'

interface StudentManagementProps {
    students: Student[]
    loading: boolean
    classId: string
    onStudentUpdate: () => void
    editingKey: string
    editingField: string
    onEdit: (record: Student, field: string) => void
    onSave: (record: Student) => Promise<void>
    EditableCell: React.ComponentType<any>
    onDelete: (student: Student) => void
}

const { Search } = Input

export default function StudentManagement({
    students,
    loading,
    classId,
    onStudentUpdate,
    editingKey,
    editingField,
    onEdit,
    onSave,
    EditableCell,
    onDelete
}: StudentManagementProps) {
    const isEditing = (record: Student, field: string) => 
        record.id === editingKey && editingField === field

    const handleImportStudents = async (data: any[]) => {
        try {
            const response = await axiosInstance.post(`/api/classes/${classId}/import-students`, {
                students: data
            })
            
            if (response.status === 200) {
                message.success('导入成功')
                onStudentUpdate()
            }
        } catch (error) {
            message.error('导入失败')
            console.error(error)
        }
    }

    const columns: ColumnsType<Student> = [
        {
            title: (
                <div className="flex items-center">
                    <UserOutlined className="mr-2 text-blue-500" />
                    姓名
                </div>
            ),
            dataIndex: 'name',
            key: 'name',
            width: '30%',
            onCell: (record) => ({
                record,
                dataIndex: 'name',
                title: '姓名',
                editing: isEditing(record, 'name'),
                save: onSave,
            }),
            render: (text: string, record: Student) => (
                <div 
                    className="cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                    onDoubleClick={() => onEdit(record, 'name')}
                >
                    <span className="font-medium">{text}</span>
                </div>
            ),
        },
        {
            title: (
                <div className="flex items-center">
                    <IdcardOutlined className="mr-2 text-green-500" />
                    学号
                </div>
            ),
            dataIndex: 'studentId',
            key: 'studentId',
            width: '30%',
            onCell: (record) => ({
                record,
                dataIndex: 'studentId',
                title: '学号',
                editing: isEditing(record, 'studentId'),
                save: onSave,
            }),
            render: (text: string, record: Student) => (
                <div 
                    className="cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                    onDoubleClick={() => onEdit(record, 'studentId')}
                >
                    <Tag color="blue" className="text-sm">
                        {text}
                    </Tag>
                </div>
            ),
        },
        {
            title: (
                <div className="flex items-center">
                    <CalendarOutlined className="mr-2 text-orange-500" />
                    加入时间
                </div>
            ),
            dataIndex: 'joinTime',
            key: 'joinTime',
            width: '25%',
            render: (date: string) => (
                <div className="text-gray-500">
                    {new Date(date).toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </div>
            ),
        },
        {
            title: '操作',
            key: 'action',
            render: (_, record) => (
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => onDelete(record)}
                    className="hover:text-red-600 transition-colors"
                >
                    删除
                </Button>
            ),
        },
    ]

    const uploadProps: UploadProps = {
        accept: '.xlsx,.xls',
        showUploadList: false,
        beforeUpload: (file) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                const data = e.target?.result
                const workbook = XLSX.read(new Uint8Array(data as ArrayBuffer), { type: 'array' })
                const sheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[sheetName]
                const jsonData = XLSX.utils.sheet_to_json(worksheet)
                handleImportStudents(jsonData)
            }
            reader.readAsArrayBuffer(file)
            return false
        },
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <UserOutlined className="mr-2 text-blue-500" />
                    学生管理
                    <Tag color="blue" className="ml-3 text-sm">
                        {students.length} 名学生
                    </Tag>
                </h2>
                <Space>
                    <Search
                        placeholder="搜索姓名或学号"
                        allowClear
                        enterButton={<SearchOutlined />}
                        className="w-64"
                    />
                    <Button
                        type="primary"
                        onClick={() => Modal.info({
                            title: '使用说明',
                            icon: <ExclamationCircleOutlined className="text-blue-500" />,
                            content: (
                                <div className="mt-4">
                                    <p>• 双击姓名或学号可以直接编辑</p>
                                    <p>• 编辑完成后按回车键保存</p>
                                    <p>• 点击删除按钮可以移除学生</p>
                                </div>
                            ),
                        })}
                        style={{ backgroundColor: '#1677ff' }}
                    >
                        使用说明
                    </Button>
                </Space>
            </div>

            <Table
                components={{
                    body: {
                        cell: EditableCell,
                    },
                }}
                columns={columns}
                dataSource={students}
                rowKey="id"
                loading={loading}
                pagination={{
                    pageSize: 10,
                    showTotal: (total) => `共 ${total} 条记录`,
                    showQuickJumper: true,
                }}
                className="custom-table"
                rowClassName="hover:bg-gray-50 transition-colors"
            />
        </div>
    )
} 