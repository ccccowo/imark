"use client";

import { Card, Button, Input, Modal, message, Typography, Space, Row, Col, Spin, Empty, List, Tag } from "antd";
import { PlusOutlined, BookOutlined, TeamOutlined, HistoryOutlined, UserOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Class } from "@/app/types";
import axiosInstance from '@/lib/axios';
import { StudentProfile } from './StudentProfile';

const { Title, Text } = Typography;

interface StudentDashboardProps {
  session: any;
  classes: Class[];
  loading: boolean;
  fetchClasses: () => void;
}

interface RecentExam {
  id: string;
  name: string;
  status: 'NOT_READY' | 'GRADING' | 'COMPLETED';
  className: string;
  classId: string;
  examTime: string;
}

export function StudentDashboard({ session, classes, loading, fetchClasses }: StudentDashboardProps) {
  const router = useRouter();
  const [joinClassModalOpen, setJoinClassModalOpen] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [profileVisible, setProfileVisible] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(true);
  const [recentExams, setRecentExams] = useState<RecentExam[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);

  const checkProfile = async () => {
    try {
      const response = await axiosInstance.get('/api/students/check-profile');
      if (response.status === 200) {
        const isComplete = response.data.isComplete;
        setIsProfileComplete(isComplete);
        
        if (!isComplete) {
          message.warning('请先完善您的个人信息（姓名和学号）');
          setProfileVisible(true);
        }
      }
    } catch (error) {
      console.error('检查个人信息失败:', error);
    }
  };

  useEffect(() => {
    checkProfile();
  }, []);

  const handleProfileModalClose = () => {
    if (!isProfileComplete) {
      message.warning('请先完善您的个人信息');
      return;
    }
    setProfileVisible(false);
  };

  const handleProfileUpdate = (success: boolean) => {
    if (success) {
      checkProfile();
    }
  };

  const handleJoinClass = async () => {
    if (!classCode.trim()) {
      message.error('请输入班级编号');
      return;
    }

    try {
      const response = await axiosInstance.post('api/classes/join', {
        classId: classCode.trim()
      });

      if (response.status === 200) {
        message.success('成功加入班级');
        setJoinClassModalOpen(false);
        setClassCode('');
        fetchClasses();
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || '加入失败，请稍后重试';
      message.error(errorMsg);
    }
  };

  const handleLeaveClass = async (classId: string) => {
    Modal.confirm({
      title: '确认退出班级',
      content: '退出后将无法查看班级信息和考试记录，确定要退出吗？',
      okText: '确认退出',
      cancelText: '取消',
      onOk: async () => {
        try {
          console.log('正在退出班级:', classId);
          const response = await axiosInstance.delete(`/api/classes/${classId}/leave`);
          console.log('退出班级响应:', response.data);
          if (response.data) {
            await Promise.all([
              fetchClasses(),
              fetchRecentExams()
            ]);
            message.success('已退出班级');
          }
        } catch (error: any) {
          console.error('退出班级失败:', error);
          console.error('错误详情:', error.response?.data);
          message.error(error.response?.data?.error || '退出班级失败');
        }
      }
    });
  };

  // 获取最近考试记录
  const fetchRecentExams = async () => {
    try {
      setLoadingExams(true);
      const response = await axiosInstance.get('/api/students/recent-exams');
      if (response.data.success) {
        setRecentExams(response.data.exams);
      }
    } catch (error) {
      console.error('获取最近考试失败:', error);
    } finally {
      setLoadingExams(false);
    }
  };

  useEffect(() => {
    fetchRecentExams();
  }, []);

  // 获取考试状态标签
  const getExamStatusTag = (status: string) => {
    if (status === 'COMPLETED') {
      return <Tag color="success">已完成</Tag>;
    }
    if (status === 'GRADING') {
      return <Tag color="processing">批改中</Tag>;
    }
    return <Tag color="warning">未开始</Tag>;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* 欢迎卡片 */}
      <Card className="mb-6 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <BookOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            </div>
            <div>
              <Title level={5} style={{ margin: 0 }}>欢迎回来，{session.user.username}</Title>
              <Text type="secondary">这里是您的学习中心</Text>
            </div>
          </div>
          <Button
            type="link"
            icon={<UserOutlined />}
            onClick={() => setProfileVisible(true)}
          >
            个人中心
          </Button>
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
                        onClick={() => router.push(`/dashboard/classes/${cls.id}/student-view`)}
                      >
                        查看详情
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<TeamOutlined style={{ fontSize: 20, color: '#1890ff' }} />}
                      title={cls.name}
                      description={
                        <Space direction="vertical" size="small">
                          <Text type="secondary">科目：{cls.subject}</Text>
                          <Text type="secondary">加入时间：{new Date(cls.joinTime).toLocaleDateString()}</Text>
                        </Space>
                      }
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

        {/* 右侧栏 */}
        <Col span={24} lg={10}>
          {/* 历史考试 */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <ClockCircleOutlined className="text-blue-500" />
                <Title level={5} style={{ margin: 0 }}>最近考试</Title>
              </div>
            }
            className="shadow-sm"
          >
            {loadingExams ? (
              <div className="py-10 text-center">
                <Spin size="large" />
              </div>
            ) : recentExams.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span className="text-gray-500">
                    暂无考试记录
                  </span>
                }
              />
            ) : (
              <List
                dataSource={recentExams}
                renderItem={(exam) => (
                  <List.Item
                    actions={[
                      <Button
                        key="view"
                        type="link"
                        size="small"
                        onClick={() => router.push(`/dashboard/classes/${exam.classId}/student-view`)}
                      >
                        查看详情
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{exam.name}</span>
                          {getExamStatusTag(exam.status)}
                        </div>
                      }
                      description={
                        <div className="text-gray-500 text-sm">
                          <div>{exam.className}</div>
                          <div>考试时间：{new Date(exam.examTime).toLocaleString()}</div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
                size="small"
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* 加入班级 Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <TeamOutlined />
            <span>加入班级</span>
          </div>
        }
        open={joinClassModalOpen}
        onCancel={() => {
          setJoinClassModalOpen(false);
          setClassCode('');
        }}
        footer={null}
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          handleJoinClass();
        }}>
          <Space direction="vertical" className="w-full">
            <div>
              <Input
                prefix={<TeamOutlined className="text-gray-400" />}
                placeholder="请输入班级编号"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                required
                maxLength={8}
              />
              <div className="mt-2 text-gray-500 text-sm">
                请向老师获取班级编号，编号由字母和数字组成
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button onClick={() => {
                setJoinClassModalOpen(false);
                setClassCode('');
              }}>
                取消
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={loading}
                disabled={!classCode.trim()}
              >
                加入
              </Button>
            </div>
          </Space>
        </form>
      </Modal>

      {/* 个人中心 Modal */}
      <Modal
        open={profileVisible}
        onCancel={handleProfileModalClose}
        footer={null}
        width={800}
        destroyOnClose
        maskClosable={isProfileComplete}
        closable={isProfileComplete}
      >
        <StudentProfile 
          session={session} 
          onProfileUpdate={handleProfileUpdate}
          forceComplete={!isProfileComplete}
        />
      </Modal>
    </div>
  );
} 