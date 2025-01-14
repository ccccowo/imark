"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Layout as AntLayout, Typography, Button, Spin, message } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { TeacherDashboard } from "./components/TeacherDashboard";
import { StudentDashboard } from "./components/StudentDashboard";
import { Class } from "@/app/types";
import axiosInstance from '@/lib/axios';

const { Header, Content } = AntLayout;
const { Title, Text } = Typography;

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchClasses();
    }
  }, [session]);

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  // 获取班级列表
  const fetchClasses = async (name?: string) => {
    try {
      setLoading(true);
      const searchParams = name ? `?name=${encodeURIComponent(name)}` : '';
      const endpoint = session?.user?.role === 'TEACHER' ? 
        `api/classes${searchParams}` : 
        'api/classes/joined';

      console.log('Fetching from endpoint:', endpoint);

      const response = await axiosInstance.get(endpoint);
      console.log('Response:', response);

      if (!response.data) {
        throw new Error('No data received');
      }

      setClasses(response.data);
    } catch (error: any) {
      console.error('Fetch error:', error);
      message.error(
        error.response?.data?.error || 
        error.message || 
        '获取班级失败，请稍后重试'
      );
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || !session) {
    return <Spin size="large" className="flex justify-center items-center min-h-screen" />;
  }

  return (
    <AntLayout className="min-h-screen">
      <Header className="bg-white px-8 py-4 shadow-sm fixed w-full z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
              智能阅卷平台
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {session.user.role === "TEACHER" ? "教师控制台" : "学生控制台"} · {session.user.username}
            </Text>
          </div>
          <Button
            type="text"
            danger
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            退出登录
          </Button>
        </div>
      </Header>

      <Content className="pt-20 px-8 pb-8 bg-gray-50 min-h-screen">
        {session.user.role === "TEACHER" ? (
          <TeacherDashboard
            session={session}
            classes={classes}
            setClasses={setClasses}
            loading={loading}
            fetchClasses={fetchClasses}
          />
        ) : (
          <StudentDashboard
            session={session}
            classes={classes}
            loading={loading}
            fetchClasses={fetchClasses}
          />
        )}
      </Content>
    </AntLayout>
  );
}