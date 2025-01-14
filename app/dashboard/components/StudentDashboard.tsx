"use client";

import { Card, Button, Input, Modal, message, Typography, Space, Row, Col, Spin, Empty, List, Tag } from "antd";
import { PlusOutlined, BookOutlined, TeamOutlined, HistoryOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Class } from "@/app/types";
import axiosInstance from '@/lib/axios';

const { Title, Text } = Typography;

interface StudentDashboardProps {
  session: any;
  classes: Class[];
  loading: boolean;
  fetchClasses: () => void;
}

export function StudentDashboard({ session, classes, loading, fetchClasses }: StudentDashboardProps) {
  const router = useRouter();
  const [joinClassModalOpen, setJoinClassModalOpen] = useState(false);
  const [classCode, setClassCode] = useState('');

  const handleJoinClass = async () => {
    try {
      const response = await axiosInstance.post('api/classes/join', {
        classId: classCode
      });

      if (response.status === 200) {
        message.success('成功加入班级');
        setJoinClassModalOpen(false);
        setClassCode('');
        fetchClasses();
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '加入失败，请稍后重试');
    }
  };

  const handleLeaveClass = async (classId: string) => {
    try {
      const response = await axiosInstance.delete(`api/classes/${classId}/leave`);
      if (response.status === 200) {
        message.success('已退出班级');
        fetchClasses();
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '退出失败，请稍后重试');
    }
  };

  return (
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
                onClick={() => setJoinClassModalOpen(true)}
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
                        key="leave"
                        type="text"
                        danger
                        onClick={() => handleLeaveClass(cls.id)}
                      >
                        退出班级
                      </Button>,
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

      {/* 加入班级 Modal */}
      <Modal
        title="加入班级"
        open={joinClassModalOpen}
        onCancel={() => setJoinClassModalOpen(false)}
        footer={null}
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          handleJoinClass();
        }}>
          <Space direction="vertical" className="w-full">
            <Input
              placeholder="请输入班级码"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
              required
            />
            <div className="flex justify-end gap-2">
              <Button onClick={() => setJoinClassModalOpen(false)}>
                取消
              </Button>
              <Button htmlType="submit">
                加入
              </Button>
            </div>
          </Space>
        </form>
      </Modal>
    </div>
  );
} 