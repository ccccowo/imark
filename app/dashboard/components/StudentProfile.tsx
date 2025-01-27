import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Tabs, Space, Divider, Tag } from 'antd';
import { UserOutlined, LockOutlined, IdcardOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import axiosInstance from '@/lib/axios';

interface StudentProfileProps {
    session: any;
    onProfileUpdate?: (success: boolean) => void;
    forceComplete?: boolean;
}

export function StudentProfile({ session, onProfileUpdate, forceComplete }: StudentProfileProps) {
    const [loading, setLoading] = useState(false);
    const [profileForm] = Form.useForm();
    const [passwordForm] = Form.useForm();
    const [activeTab, setActiveTab] = useState('basic');

    // 获取个人信息
    const fetchProfile = async () => {
        try {
            const response = await axiosInstance.get('/api/students/profile');
            if (response.status === 200) {
                profileForm.setFieldsValue({
                    name: response.data.name,
                    studentId: response.data.studentId,
                    username: response.data.username,
                    email: response.data.email,
                });
            }
        } catch (error) {
            message.error('获取个人信息失败');
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    // 更新基本信息
    const handleUpdateProfile = async (values: any) => {
        try {
            setLoading(true);
            const response = await axiosInstance.put('/api/students/profile', {
                name: values.name,
                studentId: values.studentId,
            });

            if (response.status === 200) {
                message.success('个人信息更新成功');
                onProfileUpdate?.(true);
            }
        } catch (error: any) {
            message.error(error.response?.data?.error || '更新失败');
            onProfileUpdate?.(false);
        } finally {
            setLoading(false);
        }
    };

    // 修改密码
    const handleChangePassword = async (values: any) => {
        try {
            setLoading(true);
            const response = await axiosInstance.put('/api/students/profile', {
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
            });

            if (response.status === 200) {
                message.success('密码修改成功');
                passwordForm.resetFields();
            }
        } catch (error: any) {
            message.error(error.response?.data?.error || '修改失败');
        } finally {
            setLoading(false);
        }
    };

    const items = [
        {
            key: 'basic',
            label: (
                <div className="flex items-center gap-2">
                    <UserOutlined />
                    <span>基本信息</span>
                    {forceComplete && <span className="text-red-500">*</span>}
                </div>
            ),
            children: (
                <div>
                    {forceComplete && (
                        <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <ExclamationCircleOutlined className="text-yellow-400" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-yellow-800">
                                        请完善个人信息
                                    </h3>
                                    <div className="mt-2 text-sm text-yellow-700">
                                        <p>
                                            为了更好的学习体验，请先设置您的姓名和学号。
                                            完善信息后才能使用其他功能。
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <Form
                        form={profileForm}
                        layout="vertical"
                        onFinish={handleUpdateProfile}
                        className="max-w-md"
                    >
                        <Form.Item
                            label="用户名"
                            name="username"
                        >
                            <Input 
                                prefix={<UserOutlined />} 
                                disabled 
                                className="bg-gray-50"
                            />
                        </Form.Item>

                        <Form.Item
                            label="邮箱"
                            name="email"
                        >
                            <Input 
                                prefix={<UserOutlined />} 
                                disabled 
                                className="bg-gray-50"
                            />
                        </Form.Item>

                        <Form.Item
                            label="姓名"
                            name="name"
                            rules={[{ required: true, message: '请输入姓名' }]}
                        >
                            <Input 
                                prefix={<UserOutlined />} 
                                placeholder="请输入姓名" 
                            />
                        </Form.Item>

                        <Form.Item
                            label="学号"
                            name="studentId"
                            rules={[{ required: true, message: '请输入学号' }]}
                        >
                            <Input 
                                prefix={<IdcardOutlined />} 
                                placeholder="请输入学号" 
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button 
                                type="primary" 
                                htmlType="submit" 
                                loading={loading}
                                block
                            >
                                保存修改
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            ),
        },
        {
            key: 'password',
            label: '修改密码',
            disabled: forceComplete,
            children: (
                <Form
                    form={passwordForm}
                    layout="vertical"
                    onFinish={handleChangePassword}
                    className="max-w-md"
                >
                    <Form.Item
                        label="当前密码"
                        name="currentPassword"
                        rules={[{ required: true, message: '请输入当前密码' }]}
                    >
                        <Input.Password 
                            prefix={<LockOutlined />} 
                            placeholder="请输入当前密码" 
                        />
                    </Form.Item>

                    <Form.Item
                        label="新密码"
                        name="newPassword"
                        rules={[
                            { required: true, message: '请输入新密码' },
                            { min: 6, message: '密码长度不能小于6位' }
                        ]}
                    >
                        <Input.Password 
                            prefix={<LockOutlined />} 
                            placeholder="请输入新密码" 
                        />
                    </Form.Item>

                    <Form.Item
                        label="确认新密码"
                        name="confirmPassword"
                        dependencies={['newPassword']}
                        rules={[
                            { required: true, message: '请确认新密码' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('两次输入的密码不一致'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password 
                            prefix={<LockOutlined />} 
                            placeholder="请再次输入新密码" 
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            loading={loading}
                            block
                        >
                            修改密码
                        </Button>
                    </Form.Item>
                </Form>
            ),
        },
    ];

    return (
        <Card 
            title={
                <div className="flex items-center gap-2">
                    <UserOutlined />
                    <span>个人中心</span>
                    {forceComplete && (
                        <Tag color="warning">需要完善信息</Tag>
                    )}
                </div>
            }
            className="shadow-sm"
        >
            <Tabs 
                items={items} 
                activeKey={activeTab}
                onChange={setActiveTab}
            />
        </Card>
    );
} 