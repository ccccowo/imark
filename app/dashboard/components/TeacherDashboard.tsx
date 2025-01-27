"use client";

import { Card, Button, Input, Modal, message, Typography, Space, Row, Col, Spin, Empty, List, Tag, Form } from "antd";
import { 
  PlusOutlined, DeleteOutlined, SettingOutlined, UserOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Class } from "@/app/types";
import axiosInstance from '@/lib/axios';
import { ExamQuickView } from './ExamQuickView';
import AIAssistant from "@/app/components/AIAssistant";

const { Title, Text } = Typography;

interface TeacherDashboardProps {
  session: any;
  classes: Class[];
  setClasses: (classes: Class[]) => void;
  loading: boolean;
  fetchClasses: (name?: string) => void;
}

export function TeacherDashboard({ session, classes, setClasses, loading, fetchClasses }: TeacherDashboardProps) {
  const router = useRouter();
  const [searchName, setSearchName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<Class | null>(null);
  const [createClassModalVisible, setCreateClassModalVisible] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassSubject, setNewClassSubject] = useState('');
  const [createClassLoading, setCreateClassLoading] = useState(false);

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

  const handleCreateClass = async () => {
    if (!newClassName.trim() || !newClassSubject.trim()) {
      message.error('班级名称和科目为必填项');
      return;
    }

    setCreateClassLoading(true);
    try {
      const response = await axiosInstance.post('/api/classes', {
        name: newClassName.trim(),
        subject: newClassSubject.trim()
      });

      message.success('创建班级成功');
      setCreateClassModalVisible(false);
      setNewClassName('');
      setNewClassSubject('');
      fetchClasses();
    } catch (error: any) {
      message.error(error.response?.data?.error || '创建班级失败');
    } finally {
      setCreateClassLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 智能助手 */}
      <AIAssistant></AIAssistant>
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
                  onClick={() => setCreateClassModalVisible(true)}
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
                description="暂无班级，点击「创建班级」按钮开始添加"
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
                      description={
                        <Space direction="vertical" size="small">
                          <Text type="secondary">科目：{cls.subject}</Text>
                          <Text type="secondary">{`${cls._count.students} 名学生`}</Text>
                          <Text type="secondary" copyable={{ text: cls.id }} style={{ fontSize: 12 }}>
                            班级编号：{cls.id}
                          </Text>
                        </Space>
                      }
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

        {/* 考试快捷视图 */}
        <Col span={24} lg={10}>
          <ExamQuickView />
        </Col>
      </Row>

      {/* 创建班级 Modal */}
      <Modal
        title="创建新班级"
        open={createClassModalVisible}
        onOk={handleCreateClass}
        onCancel={() => {
          setCreateClassModalVisible(false);
          setNewClassName('');
          setNewClassSubject('');
        }}
        confirmLoading={createClassLoading}
      >
        <Form layout="vertical">
          <Form.Item label="班级名称" required>
            <Input
              placeholder="请输入班级名称"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="科目" required>
            <Input
              placeholder="请输入科目"
              value={newClassSubject}
              onChange={(e) => setNewClassSubject(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 删除班级 Modal */}
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
        <p>这将删除班级「{classToDelete?.name}」及其所有相关数据。此操作不可撤销。</p>
      </Modal>
    </div>
  );
} 