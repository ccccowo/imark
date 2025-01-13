"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Card, Button, Input, Modal, message, Layout, Typography, Space, Row, Col, Spin, Empty, List, Tag, Tabs } from "antd";
import { LogoutOutlined, PlusOutlined, SearchOutlined, DeleteOutlined, SettingOutlined, BookOutlined, ClockCircleOutlined, TrophyOutlined, HistoryOutlined, TeamOutlined, UserOutlined, FileTextOutlined, EditOutlined, CheckCircleOutlined } from "@ant-design/icons";
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
  joinTime: string;
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
            <div className="max-w-7xl mx-auto">
              {/* 欢迎卡片 */}
              <Card className="mb-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <UserOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                  </div>
                  <div>
                    <Title level={5} style={{ margin: 0 }}>欢迎回来，{session.user.username}</Title>
                    <Text type="secondary">这里是您的教学管理中心</Text>
                  </div>
                </div>
              </Card>

              <Row gutter={[16, 16]}>
                {/* 班级管理 */}
                <Col span={24} lg={14}>
                  <Card 
                    title={
                      <div className="flex items-center gap-2">
                        <TeamOutlined />
                        <span>班级管理</span>
                      </div>
                    }
                    className="shadow-sm"
                    extra={
                      <Space>
                        <Input.Search
                          placeholder="搜索班级..."
                          allowClear
                          value={searchName}
                          onChange={(e) => setSearchName(e.target.value)}
                          onSearch={() => fetchClasses(searchName)}
                          style={{ width: 200 }}
                        />
                        <Button 
                          icon={<PlusOutlined />}
                          onClick={() => setIsModalOpen(true)}
                        >
                          创建班级
                        </Button>
                      </Space>
                    }
                  >
                    {loading ? (
                      <div className="py-20 text-center">
                        <Spin size="large" />
                      </div>
                    ) : classes.length === 0 ? (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="暂无班级，点击“创建班级”按钮开始添加"
                      />
                    ) : (
                      <List
                        dataSource={classes}
                        renderItem={(cls) => (
                          <List.Item
                            actions={[
                              <Button 
                                key="delete" 
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => setClassToDelete(cls)}
                              >
                                删除
                              </Button>,
                              <Button 
                                key="manage" 
                                type="link"
                                icon={<SettingOutlined />}
                                onClick={() => router.push(`/dashboard/classes/${cls.id}`)}
                              >
                                管理
                              </Button>
                            ]}
                          >
                            <List.Item.Meta
                              avatar={<TeamOutlined style={{ fontSize: 20, color: '#1890ff' }} />}
                              title={cls.name}
                              description={`${cls._count.students} 名学生`}
                            />
                            {cls.examStatus !== "未准备" && (
                              <Tag color={
                                cls.examStatus === "已准备" ? "processing" :
                                cls.examStatus === "待批改" ? "warning" :
                                "success"
                              }>
                                {cls.examName || "考试进行中"}
                              </Tag>
                            )}
                          </List.Item>
                        )}
                      />
                    )}
                  </Card>
                </Col>

                {/* 考试管理 */}
                <Col span={24} lg={10}>
                  <Card 
                    title={
                      <div className="flex items-center gap-2">
                        <FileTextOutlined />
                        <span>考试管理</span>
                      </div>
                    }
                    className="shadow-sm"
                  >
                    <Tabs
                      items={[
                        {
                          key: 'pending',
                          label: (
                            <span>
                              <ClockCircleOutlined /> 待批改
                            </span>
                          ),
                          children: (
                            <Empty
                              image={Empty.PRESENTED_IMAGE_SIMPLE}
                              description="暂无待批改的考试"
                            />
                          ),
                        },
                        {
                          key: 'grading',
                          label: (
                            <span>
                              <EditOutlined /> 批改中
                            </span>
                          ),
                          children: (
                            <Empty
                              image={Empty.PRESENTED_IMAGE_SIMPLE}
                              description="暂无正在批改的考试"
                            />
                          ),
                        },
                        {
                          key: 'completed',
                          label: (
                            <span>
                              <CheckCircleOutlined /> 已完成
                            </span>
                          ),
                          children: (
                            <Empty
                              image={Empty.PRESENTED_IMAGE_SIMPLE}
                              description="暂无已完成的考试"
                            />
                          ),
                        },
                      ]}
                    />
                  </Card>
                </Col>
              </Row>
            </div>
          )}

          {session.user.role === "STUDENT" && (
            <div className="max-w-7xl mx-auto">
              {/* 欢迎卡片 */}
              <Card className="mb-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <BookOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                  </div>
                  <div>
                    <Title level={5} style={{ margin: 0 }}>欢迎回来，{session.user.username}</Title>
                    <Text type="secondary">这里是您的学习中心</Text>
                  </div>
                </div>
              </Card>

              <Row gutter={[16, 16]}>
                {/* 已加入的班级 */}
                <Col span={24} lg={14}>
                  <Card 
                    title={
                      <div className="flex items-center gap-2">
                        <TeamOutlined />
                        <span>已加入的班级</span>
                      </div>
                    }
                    className="shadow-sm"
                    extra={
                      <Button 
                        icon={<PlusOutlined />}
                        size="small"
                      >
                        加入新班级
                      </Button>
                    }
                  >
                    {loading ? (
                      <div className="py-20 text-center">
                        <Spin size="large" />
                      </div>
                    ) : classes.length === 0 ? (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="暂未加入任何班级"
                      />
                    ) : (
                      <List
                        dataSource={classes}
                        renderItem={(cls) => (
                          <List.Item
                            actions={[
                              <Button 
                                key="view" 
                                type="link"
                                onClick={() => router.push(`/dashboard/classes/${cls.id}`)}
                              >
                                查看详情
                              </Button>
                            ]}
                          >
                            <List.Item.Meta
                              avatar={<TeamOutlined style={{ fontSize: 20, color: '#1890ff' }} />}
                              title={cls.name}
                              description={`加入时间：${new Date(cls.joinTime).toLocaleDateString()}`}
                            />
                            {cls.examStatus !== "未准备" && (
                              <Tag color={
                                cls.examStatus === "已准备" ? "processing" :
                                cls.examStatus === "待批改" ? "warning" :
                                "success"
                              }>
                                {cls.examName || "有新考试"}
                              </Tag>
                            )}
                          </List.Item>
                        )}
                      />
                    )}
                  </Card>
                </Col>

                {/* 历史考试 */}
                <Col span={24} lg={10}>
                  <Card 
                    title={
                      <div className="flex items-center gap-2">
                        <HistoryOutlined />
                        <span>历史考试</span>
                      </div>
                    }
                    className="shadow-sm"
                  >
                    {loading ? (
                      <div className="py-20 text-center">
                        <Spin size="large" />
                      </div>
                    ) : (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="暂无历史考试记录"
                      />
                    )}
                  </Card>
                </Col>
              </Row>
            </div>
          )}
        </div>
      </Content>

      <Modal
        title="创建新班级"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        maskClosable={false}
        destroyOnClose
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const className = formData.get("className") as string;
            if (className.trim()) {
              createClass(className.trim());
            }
          }}
        >
          <Space direction="vertical" className="w-full">
            <Input
              name="className"
              placeholder="请输入班级名称"
              required
              autoFocus
              maxLength={50}
            />
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsModalOpen(false)}>
                取消
              </Button>
              <Button htmlType="submit">
                创建
              </Button>
            </div>
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