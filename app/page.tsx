"use client";

import { useState } from "react";
import { Button, Input, Card, message, Tabs, Space, Typography } from "antd";
import { UserOutlined, BookOutlined, LoginOutlined, UserAddOutlined } from "@ant-design/icons";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";

const { Text } = Typography;

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [role, setRole] = useState<"TEACHER" | "STUDENT">("STUDENT");

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
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      message.error("两次输入的密码不一致");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.post("/api/auth/register", {
        username,
        password,
        role,
      });

      if (response.status !== 200) {
        throw new Error(response.data.message || "注册失败");
      }

      message.success("注册成功，请使用新账号登录");
    } catch (error: any) {
      message.error(error.message || "请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

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
        <form onSubmit={handleRegister} className="space-y-4">
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
          <Input.Password
            name="confirmPassword"
            placeholder="确认密码"
            size="large"
            required
          />
          <Button 
            htmlType="submit"
            icon={<UserAddOutlined />}
            loading={isLoading}
            block
            size="large"
          >
            {isLoading ? "注册中..." : "注册"}
          </Button>
        </form>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card style={{ width: 400 }}>
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">智能阅卷平台</h1>
        
        <Card className="mb-6 bg-gray-50 border-dashed">
          <div className="flex gap-4">
            <Button
              type={role === "STUDENT" ? "primary" : "default"}
              icon={<BookOutlined />}
              onClick={() => setRole("STUDENT")}
              block
              size="large"
              className={`${role === "STUDENT" ? "shadow-md" : ""} hover:text-blue-600 text-gray-600`}
              style={{ 
                borderColor: role === "STUDENT" ? undefined : '#d9d9d9',
                color: role === "STUDENT" ? undefined : '#595959'
              }}
            >
              我是学生
            </Button>
            <Button
              type={role === "TEACHER" ? "primary" : "default"}
              icon={<UserOutlined />}
              onClick={() => setRole("TEACHER")}
              block
              size="large"
              className={`${role === "TEACHER" ? "shadow-md" : ""} hover:text-blue-600 text-gray-600`}
              style={{ 
                borderColor: role === "TEACHER" ? undefined : '#d9d9d9',
                color: role === "TEACHER" ? undefined : '#595959'
              }}
            >
              我是教师
            </Button>
          </div>
          <div className="text-center mt-2">
            <Text type="secondary" style={{ color: '#595959' }}>
              当前选择：{role === "STUDENT" ? "学生" : "教师"}身份
            </Text>
          </div>
        </Card>
        
        <Tabs 
          items={items} 
          centered
          style={{
            color: '#262626'
          }}
        />
      </Card>
    </div>
  );
}