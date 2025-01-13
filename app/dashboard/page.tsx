"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Card, Button, Input, Modal, message, Layout, Typography, Space, Row, Col, Spin } from "antd";
import { LogoutOutlined, PlusOutlined, SearchOutlined, DeleteOutlined, SettingOutlined } from "@ant-design/icons";
import axiosInstance from '@/lib/axios';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

interface Class {
  id: string;
  name: string;
  teacherId: string;
  _count: {
    students: number;
  };
  examStatus: "未准备" | "已准备" | "待批改" | "已完成";
  examName?: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<Class | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.role === 'TEACHER') {
      fetchClasses();
    }
  }, [session]);

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  const fetchClasses = async (name?: string) => {
    try {
      setLoading(true);
      const searchParams = name ? `?name=${encodeURIComponent(name)}` : '';
      const response = await axiosInstance.get(`api/classes${searchParams}`);
      if (response.status !== 200) throw new Error('获取失败');
      setClasses(response.data);
    } catch (error) {
      message.error('获取班级失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const createClass = async (name: string) => {
    try {
      const response = await axiosInstance.post('api/classes', {
        name,
        teacherId: session?.user?.id
      });

      setClasses([...classes, response.data]);
      message.success(`班级 "${name}" 已创建`);
      setIsModalOpen(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.details ||
        error.response?.data?.error ||
        error.message ||
        "请稍后重试";
      message.error(`创建失败: ${errorMessage}`);
    }
  };

  const deleteClass = async (id: string) => {
    try {
      const response = await axiosInstance.delete(`api/classes/${id}`);
      if (response.status !== 200) throw new Error('删除失败');
      setClasses(classes.filter(cls => cls.id !== id));
      message.success('班级已删除');
    } catch (error) {
      message.error('删除失败，请稍后重试');
    }
  };

  if (status === "loading" || !session) {
    return <Spin size="large" className="flex justify-center items-center min-h-screen" />;
  }

  return (
    <Layout className="min-h-screen">
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
        <div className="max-w-7xl mx-auto">
          {session.user.role === "TEACHER" && (
            <>
              <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                <div className="flex items-center justify-between">
                  <Space size="large">
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />}
                      onClick={() => setIsModalOpen(true)}
                      size="large"
                    >
                      创建班级
                    </Button>
                    <Input.Search
                      placeholder="搜索班级名称..."
                      allowClear
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      onSearch={() => fetchClasses(searchName)}
                      style={{ width: 300 }}
                      size="large"
                    />
                  </Space>
                </div>
              </div>

              <Row gutter={[16, 16]}>
                {loading ? (
                  <Col span={24}>
                    <div className="flex justify-center items-center py-32">
                      <Spin size="large" />
                    </div>
                  </Col>
                ) : classes.length === 0 ? (
                  <Col span={24}>
                    <div className="bg-white rounded-lg shadow-sm p-16 text-center">
                      <Text type="secondary" style={{ fontSize: 16 }}>
                        暂无班级，点击"创建班级"按钮开始添加
                      </Text>
                    </div>
                  </Col>
                ) : (
                  classes.map((cls) => (
                    <Col key={cls.id} xs={24} sm={12} md={8} lg={6}>
                      <Card
                        hoverable
                        className="shadow-sm"
                        title={
                          <div className="font-medium">{cls.name}</div>
                        }
                        extra={
                          <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />}
                            onClick={() => setClassToDelete(cls)}
                          />
                        }
                        actions={[
                          <Button 
                            key="manage" 
                            type="link" 
                            icon={<SettingOutlined />}
                            onClick={() => router.push(`/dashboard/classes/${cls.id}`)}
                          >
                            管理班级
                          </Button>
                        ]}
                      >
                        <div className="flex justify-between items-center">
                          <Text type="secondary">学生人数</Text>
                          <Text strong>{cls._count.students}</Text>
                        </div>
                      </Card>
                    </Col>
                  ))
                )}
              </Row>
            </>
          )}

          {session.user.role === "STUDENT" && (
            <Row gutter={[16, 16]}>
              <Col span={24} md={8}>
                <Card 
                  title="我的考试" 
                  className="shadow-sm"
                >
                  <Text type="secondary">暂无考试安排</Text>
                </Card>
              </Col>
            </Row>
          )}
        </div>
      </Content>

      <Modal
        title="创建新班级"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            createClass(formData.get("className") as string);
          }}
        >
          <Space direction="vertical" className="w-full">
            <Input
              name="className"
              placeholder="班级名称"
              required
            />
            <Button type="primary" htmlType="submit" block>
              创建
            </Button>
          </Space>
        </form>
      </Modal>

      <Modal
        title="确定要删除这个班级吗？"
        open={!!classToDelete}
        onCancel={() => setClassToDelete(null)}
        onOk={() => {
          if (classToDelete) {
            deleteClass(classToDelete.id);
            setClassToDelete(null);
          }
        }}
        okButtonProps={{ danger: true }}
        okText="删除"
        cancelText="取消"
      >
        <p>这将删除班级"{classToDelete?.name}"及其所有相关数据。此操作不可撤销。</p>
      </Modal>
    </Layout>
  );
}