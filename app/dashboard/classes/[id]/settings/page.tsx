'use client';

import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Divider, Space, Alert, Modal } from 'antd';
import { 
    SaveOutlined, 
    DeleteOutlined, 
    ExclamationCircleOutlined,
    EditOutlined,
    TeamOutlined,
    CalendarOutlined,
    SettingOutlined
} from '@ant-design/icons';
import axiosInstance from '@/lib/axios';
import { useRouter } from 'next/navigation';

export default function ClassSettings({ params }: { params: { id: string } }) {
    const [form] = Form.useForm();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchClass = async () => {
            try {
                const response = await axiosInstance.get(`/api/classes/${params.id}`);
                form.setFieldsValue(response.data);
            } catch (error) {
                message.error('获取班级信息失败');
            }
        };
        fetchClass();
    }, [params.id]);

    const handleSave = async (values: any) => {
        setLoading(true);
        try {
            await axiosInstance.put(`/api/classes/${params.id}`, values);
            message.success('保存成功');
        } catch (error) {
            message.error('保存失败');
        }
        setLoading(false);
    };

    const handleDelete = () => {
        Modal.confirm({
            title: '确认删除班级',
            icon: <ExclamationCircleOutlined className="text-red-500" />,
            content: (
                <div className="py-4">
                    <Alert
                        message="警告"
                        description="删除班级将同时删除所有相关的考试和学生数据，此操作不可恢复！"
                        type="warning"
                        showIcon
                        className="mb-4"
                    />
                    <p className="text-gray-600">
                        请输入班级名称以确认删除
                    </p>
                </div>
            ),
            okText: '确认删除',
            okButtonProps: { 
                danger: true,
                icon: <DeleteOutlined />
            },
            cancelText: '取消',
            onOk: async () => {
                try {
                    await axiosInstance.delete(`/api/classes/${params.id}`);
                    message.success('删除成功');
                    router.push('/dashboard/classes');
                } catch (error) {
                    message.error('删除失败');
                }
            },
        });
    };

    return (
        <div className="max-w-3xl mx-auto">
            <Card 
                className="shadow-sm hover:shadow-md transition-shadow duration-300"
                title={
                    <div className="flex items-center text-lg font-bold">
                        <SettingOutlined className="mr-2 text-blue-500" />
                        班级设置
                    </div>
                }
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSave}
                    className="space-y-6"
                >
                    <div className="bg-blue-50 p-4 rounded-lg mb-6">
                        <div className="flex items-center text-blue-600 mb-2">
                            <TeamOutlined className="mr-2" />
                            基本信息
                        </div>
                        <Form.Item
                            label="班级名称"
                            name="name"
                            rules={[{ required: true, message: '请输入班级名称' }]}
                        >
                            <Input 
                                prefix={<EditOutlined className="text-gray-400" />}
                                placeholder="请输入班级名称"
                            />
                        </Form.Item>

                        <Form.Item
                            label="创建时间"
                            name="createdAt"
                        >
                            <Input 
                                prefix={<CalendarOutlined className="text-gray-400" />}
                                disabled
                                className="bg-gray-50"
                            />
                        </Form.Item>
                    </div>

                    <Divider className="my-8" />

                    <div className="flex justify-between">
                        <Button
                            danger
                            type="primary"
                            icon={<DeleteOutlined />}
                            onClick={handleDelete}
                            className="hover:opacity-90"
                        >
                            删除班级
                        </Button>
                        <Space>
                            <Button onClick={() => router.back()}>
                                取消
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                icon={<SaveOutlined />}
                                style={{ backgroundColor: '#1677ff' }}
                            >
                                保存更改
                            </Button>
                        </Space>
                    </div>
                </Form>
            </Card>
        </div>
    );
} 