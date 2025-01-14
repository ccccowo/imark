'use client'

import { useState } from 'react'
import { Space, Button, Table, Upload, message, Input } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
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
            title: '姓名',
            dataIndex: 'name',
            key: 'name',
            onCell: (record: Student) => ({
                record,
                dataIndex: 'name',
                title: '姓名',
                editing: isEditing(record, 'name'),
                save: onSave,
            }),
            render: (text: string, record: Student) => (
                <div onDoubleClick={() => onEdit(record, 'name')}>
                    {text}
                </div>
            ),
        },
        {
            title: '学号',
            dataIndex: 'studentId',
            key: 'studentId',
            onCell: (record: Student) => ({
                record,
                dataIndex: 'studentId',
                title: '学号',
                editing: isEditing(record, 'studentId'),
                save: onSave,
            }),
            render: (text: string, record: Student) => (
                <div onDoubleClick={() => onEdit(record, 'studentId')}>
                    {text}
                </div>
            ),
        },
        {
            title: '加入时间',
            dataIndex: 'joinTime',
            key: 'joinTime',
            render: (joinTime: string) => new Date(joinTime).toLocaleDateString()
        },
        {
            title: '操作',
            key: 'action',
            render: (_: any, record: Student) => (
                <Space size="middle">
                    <Button type="link" danger onClick={() => onDelete(record)}>
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
        <div>
            <div className="mb-4">
                <Upload {...uploadProps}>
                    <Button icon={<UploadOutlined />}>导入学生</Button>
                </Upload>
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
            />
        </div>
    )
} 