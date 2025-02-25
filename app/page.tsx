"use client";

import { useState } from "react";
import { Button, Input, Card, message, Tabs, Space, Typography, Form } from "antd";
import { UserOutlined, BookOutlined, LoginOutlined, UserAddOutlined } from "@ant-design/icons";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";

const { Text } = Typography;

export default function Home() {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [role, setRole] = useState<"TEACHER" | "STUDENT">("STUDENT");
  const [activeTab, setActiveTab] = useState('login');

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        username,
        password,
        role,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      router.push("/dashboard");
    } catch (error: any) {
      message.error(error.message || "请检查用户名和密码");
    } finally {
      setIsLoading(false);
    }
  };

  // 注册
  const handleRegister = async (values: any) => {
    setIsLoading(true);

    try {
        const response = await axiosInstance.post("/api/auth/register", {
            username: values.username,
            password: values.password,
            role,
        });

        if (response.data?.success) {
            message.success("注册成功，正在为您跳转到登录页面");
            form.resetFields();
            
            setActiveTab('login');
            const loginForm = document.querySelector('form[name="login"]') as HTMLFormElement;
            if (loginForm) {
                const usernameInput = loginForm.querySelector('input[name="username"]') as HTMLInputElement;
                const passwordInput = loginForm.querySelector('input[name="password"]') as HTMLInputElement;
                if (usernameInput && passwordInput) {
                    usernameInput.value = values.username;
                    passwordInput.value = values.password;
                }
            }
        }
    } catch (error: any) {
        // 处理特定错误
        if (error.response?.data?.code === 'USERNAME_EXISTS') {
            message.error('该用户名已被注册，请更换其他用户名');
        } else if (error.response?.data?.error) {
            message.error(error.response.data.error);
        } else {
            message.error('注册失败，请稍后重试');
        }
    } finally {
        setIsLoading(false);
    }
  };

  // 用户名验证规则
  const validateUsername = (value: string) => {
    if (!value?.trim()) {
      return Promise.reject('用户名不能为空');
    }
    if (value.length < 2) {
      return Promise.reject('用户名至少2个字符');
    }
    if (value.length > 20) {
      return Promise.reject('用户名最多20个字符');
    }
    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(value)) {
      return Promise.reject('用户名只能包含字母、数字、下划线和中文');
    }
    return Promise.resolve();
  };

  // 密码验证规则
  const validatePassword = (value: string) => {
    if (!value) {
      return Promise.reject('请输入密码');
    }
    if (value.length < 6) {
      return Promise.reject('密码至少6个字符');
    }
    if (value.length > 20) {
      return Promise.reject('密码最多20个字符');
    }
    return Promise.resolve();
  };

  // 确认密码验证规则
  const validateConfirmPassword = ({ getFieldValue }: any) => ({
    validator(_: any, value: string) {
      if (!value) {
        return Promise.reject('请确认密码');
      }
      if (value !== getFieldValue('password')) {
        return Promise.reject('两次输入的密码不一致');
      }
      return Promise.resolve();
    },
  });

  const items = [
    {
      key: 'login',
      label: '登录',
      children: (
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            name="username"
            placeholder="用户名"
            prefix={<UserOutlined />}
            size="large"
            required
          />
          <Input.Password
            name="password"
            placeholder="密码"
            size="large"
            required
          />
          <Button 
            htmlType="submit"
            icon={<LoginOutlined />}
            loading={isLoading}
            block
            size="large"
          >
            {isLoading ? "登录中..." : "登录"}
          </Button>
        </form>
      ),
    },
    {
      key: 'register',
      label: '注册',
      children: (
        <Form
          form={form}
          name="register"
          onFinish={handleRegister}
          validateTrigger={['onBlur', 'onChange']}
          autoComplete="off"
        >
          <Form.Item
            name="username"
            validateTrigger={['onBlur', 'onChange']}
            rules={[
              { 
                validator: async (_, value) => validateUsername(value),
                validateTrigger: 'onBlur'
              }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            validateTrigger={['onBlur', 'onChange']}
            rules={[
              { 
                validator: async (_, value) => validatePassword(value),
                validateTrigger: 'onBlur'
              }
            ]}
          >
            <Input.Password
              placeholder="密码"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            validateTrigger={['onBlur', 'onChange']}
            rules={[validateConfirmPassword]}
          >
            <Input.Password
            
              placeholder="确认密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              htmlType="submit"
              icon={<UserAddOutlined />}
              loading={isLoading}
              block
              size="large"
            >
              {isLoading ? "注册中..." : "注册"}
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="flex items-center justify-center min-h-screen p-8">
            <Card 
                className="w-[420px] shadow-2xl hover:shadow-xl transition-all duration-300 border-0 backdrop-blur-sm bg-white/90"
                bodyStyle={{ padding: '2rem' }}
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        智能阅卷平台
                    </h1>
                    <p className="text-gray-500 mt-2">欢迎使用智能阅卷系统</p>
                </div>

                <Card 
                    className="mb-6 hover:shadow-md transition-all duration-300"
                    bodyStyle={{ padding: '1.5rem' }}
                >
                    <div className="flex gap-4">
                        <Button
                            type={role === "STUDENT" ? "primary" : "default"}
                            icon={<BookOutlined />}
                            onClick={() => setRole("STUDENT")}
                            block
                            size="large"
                            className={`
                                ${role === "STUDENT" ? 
                                    "shadow-md bg-gradient-to-r from-blue-500 to-blue-600" : 
                                    "hover:border-blue-400"
                                }
                                transform transition-all duration-200
                                hover:scale-102 hover:shadow-md
                            `}
                        >
                            我是学生
                        </Button>
                        <Button
                            type={role === "TEACHER" ? "primary" : "default"}
                            icon={<UserOutlined />}
                            onClick={() => setRole("TEACHER")}
                            block
                            size="large"
                            className={`
                                ${role === "TEACHER" ? 
                                    "shadow-md bg-gradient-to-r from-blue-500 to-blue-600" : 
                                    "hover:border-blue-400"
                                }
                                transform transition-all duration-200
                                hover:scale-102 hover:shadow-md
                            `}
                        >
                            我是教师
                        </Button>
                    </div>
                    <div className="text-center mt-3">
                        <Text type="secondary" className="text-sm">
                            当前选择：
                            <span className="text-blue-600 font-medium ml-1">
                                {role === "STUDENT" ? "学生" : "教师"}身份
                            </span>
                        </Text>
                    </div>
                </Card>

                <Tabs 
                    items={items}
                    centered
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    className="auth-tabs"
                />

                <style jsx global>{`
                    .auth-tabs .ant-tabs-nav::before {
                        border-bottom: none;
                    }
                    .auth-tabs .ant-tabs-tab {
                        font-size: 16px;
                        padding: 12px 0;
                        margin: 0 24px;
                    }
                    .auth-tabs .ant-tabs-tab-active {
                        font-weight: 600;
                    }
                    .auth-tabs .ant-tabs-ink-bar {
                        background: linear-gradient(to right, #2563eb, #4f46e5);
                        height: 3px;
                        border-radius: 3px;
                    }
                    .ant-input-affix-wrapper {
                        padding: 8px 11px;
                        border-radius: 8px;
                    }
                    .ant-input-affix-wrapper:hover {
                        border-color: #4f46e5;
                    }
                    .ant-input-affix-wrapper-focused {
                        border-color: #4f46e5;
                        box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
                    }
                    .ant-btn {
                        border-radius: 8px;
                        height: 45px;
                    }
                `}</style>
            </Card>
        </div>
    </main>
  );
}