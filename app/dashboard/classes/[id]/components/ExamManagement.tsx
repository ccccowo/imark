"use client";

import {
  Space,
  Button,
  Table,
  Modal,
  Form,
  Input,
  message,
  Tag,
  Upload,
  Spin,
  Empty,
} from "antd";
import {
  UploadOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  FileImageOutlined,
  LoadingOutlined,
  InfoCircleOutlined,
  EyeOutlined,
  LineChartOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { UploadProps } from "antd";
import { Exam, Examinee } from "@/app/types";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import axiosInstance from "@/lib/axios";
import { ViewPaperModal } from "./ViewPaperModal";
import { useRouter } from "next/navigation";

// 考试管理组件的props
interface ExamManagementProps {
  classId: string;
  examModalVisible: boolean;
  editingExam: Exam | null;
  examName: string;
  onCreateExam: () => void;
  onEditExam: (exam: Exam) => void;
  onDeleteExam: (examId: string) => void;
  onSaveExam: () => Promise<void>;
  onCancelModal: () => void;
  onExamNameChange: (value: string) => void;
}

export default function ExamManagement({
  classId,
  examModalVisible,
  editingExam,
  examName,
  onCreateExam,
  onEditExam,
  onDeleteExam,
  onSaveExam,
  onCancelModal,
  onExamNameChange,
}: ExamManagementProps) {
  const router = useRouter();
  // 删除考试
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  // 删除考试弹窗
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // 考生列表
  const [examinees, setExaminees] = useState<Examinee[]>([]);
  // 选中的考试ID
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  // 考生列表弹窗
  const [showExamineesModal, setShowExamineesModal] = useState(false);
  // 样卷列表
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaperCropModal, setShowPaperCropModal] = useState(false);
  const [paperImage, setPaperImage] = useState<string>("");
  const [showViewPaperModal, setShowViewPaperModal] = useState(false);
  const [currentPaperUrl, setCurrentPaperUrl] = useState("");
  const [currentExamId, setCurrentExamId] = useState("");

  // 获取考试列表
  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/classes/${classId}/exams`);
      if (response.data) {
        console.log("Fetched exams:", response.data);
        setExams(response.data);
      }
    } catch (error) {
      console.error("获取考试列表失败:", error);
      message.error("获取考试列表失败");
    } finally {
      setLoading(false);
    }
  };
  // 处理上传考试名单
  const handleUploadStudentList = async (examId: string, file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(new Uint8Array(data as ArrayBuffer), {
          type: "array",
        });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // 添加日志查看原始数据
        console.log("Excel 原始数据:", jsonData);

        // 验证并格式化数据
        const formattedData = jsonData
          .map((row: any) => {
            console.log("处理行数据:", row); // 查看每行数据
            return {
              name: row["name"],
              studentId: String(row["studentId"]),
            };
          })
          .filter((item) => {
            const isValid = item.name && item.studentId;
            if (!isValid) {
              console.log("无效数据:", item); // 查看被过滤掉的数据
            }
            return isValid;
          });

        console.log("格式化后的数据:", formattedData);

        if (formattedData.length === 0) {
          throw new Error("Excel 文件中没有有效数据");
        }

        // 发送到后端API
        const response = await axiosInstance.post(
          `/api/exams/${examId}/students`,
          {
            students: formattedData,
          }
        );

        console.log("API 响应:", response.data); // 查看API响应

        if (response.status === 200) {
          message.success(`成功导入 ${response.data.count} 名考生`);
          await fetchExams();
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("上传失败:", error);
      message.error("上传失败，请确保 Excel 包含 name 和 studentId 列");
    }
  };

  const uploadProps = (examId: string): UploadProps => ({
    accept: ".xlsx,.xls",
    showUploadList: false,
    beforeUpload: (file) => {
      handleUploadStudentList(examId, file);
      return false;
    },
  });

  // 获取考生列表
  const fetchExaminees = async (examId: string) => {
    try {
      const response = await axiosInstance.get(`/api/exams/${examId}/students`);
      setExaminees(response.data); // 直接设置返回的数组
    } catch (error) {
      console.error("获取考生列表失败:", error);
      message.error("获取考生列表失败");
    }
  };

  // 处理查看考生
  const handleViewExaminees = async (examId: string) => {
    // 设置选中的考试ID
    setSelectedExamId(examId);
    // 显示考生列表弹窗
    setShowExamineesModal(true);
    // 获取考生列表
    await fetchExaminees(examId);
  };

  // 处理考生名单的重新上传
  const handleReupload = async (examId: string, file: File) => {
    Modal.confirm({
      title: "确认重新上传",
      icon: <ExclamationCircleOutlined />,
      content: "重新上传将覆盖现有考生名单，是否继续？",
      onOk: async () => {
        try {
          const reader = new FileReader();
          reader.onload = async (e) => {
            const data = e.target?.result;
            const workbook = XLSX.read(new Uint8Array(data as ArrayBuffer), {
              type: "array",
            });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const formattedData = jsonData
              .map((row: any) => ({
                name: row["name"],
                studentId: String(row["studentId"]),
              }))
              .filter((item) => item.name && item.studentId);

            if (formattedData.length === 0) {
              throw new Error("Excel 文件中没有有效数据");
            }

            const response = await axiosInstance.put(
              `/api/exams/${examId}/students`,
              {
                students: formattedData,
              }
            );

            if (response.status === 200) {
              message.success(response.data.message);
              await fetchExams(); // 刷新状态
              await fetchExaminees(examId);
            }
          };
          reader.readAsArrayBuffer(file);
        } catch (error) {
          console.error("上传失败:", error);
          message.error("上传失败，请确保 Excel 包含 name 和 studentId 列");
        }
      },
    });
  };

  // 处理上传样卷
  const handleUploadPaper = (examId: string) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";

    fileInput.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) {
        console.error("No file selected");
        return;
      }

      handleFileUpload(file, examId);
    };

    fileInput.click();
  };

  const handleFileUpload = async (file: File, examId: string) => {
    const formData = new FormData();
    formData.append("paper", file);

    try {
      const response = await axiosInstance.post(
        `/api/exams/${examId}/paper`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data && response.data.imageUrl) {
        message.success("试卷上传成功，即将进入切割页面");
        await fetchExams(); // 刷新状态
        setCurrentPaperUrl(response.data.imageUrl);
        // 跳转到切割页面
        router.push(`/dashboard/exams/${examId}/crop?classId=${classId}`);
      }
    } catch (error) {
      message.error("试卷上传失败");
    }
  };

  // 考生列表列定义
  const examineeColumns: ColumnsType<Examinee> = [
    {
      title: "姓名",
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <div className="font-medium text-gray-800">
          <span className="mr-2">👤</span>
          {text}
        </div>
      ),
    },
    {
      title: "学号",
      dataIndex: "studentId",
      key: "studentId",
      render: (text) => (
        <div className="text-gray-600">
          <span className="mr-2">🔢</span>
          {text}
        </div>
      ),
    },
    {
      title: "导入时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => (
        <div className="text-gray-500">
          <span className="mr-2">🕒</span>
          {new Date(date).toLocaleString()}
        </div>
      ),
    },
  ];

  // 考试列表列定义
  const columns: ColumnsType<Exam> = [
    {
      title: "考试名称",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div className="flex items-center">
          <span className="font-medium text-gray-800">{text}</span>
        </div>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const statusConfig = {
          READY: { color: "processing", text: "准备中", icon: "" },
          GRADING: { color: "warning", text: "批改中", icon: "" },
          COMPLETED: { color: "success", text: "已完成", icon: "" },
        };

        const config = statusConfig[status as keyof typeof statusConfig];
        return (
          <Tag color={config.color} className="px-3 py-1 rounded-full">
            <span className="mr-1">{config.icon}</span>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: "考生人数",
      dataIndex: "examinees",
      key: "examinees",
      render: (examinees, record) => (
        <Space>
          {Array.isArray(examinees) && examinees.length === 0 ? (
            <Upload {...uploadProps(record.id)} showUploadList={false}>
              <Button type="link">
                <UploadOutlined className="mr-1" />
                上传名单
              </Button>
            </Upload>
          ) : (
            <Button
              type="link"
              onClick={() => handleViewExaminees(record.id)}
              icon={<TeamOutlined />}
              className="text-gray-600 hover:text-blue-500"
            >
              {examinees?.length || 0} 人
            </Button>
          )}
        </Space>
      ),
    },
    {
      title: "操作",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          {/* 添加上传样卷按钮 */}
          {record.status !== "COMPLETED" &&
            (record.paperImage !== "" ? (
              <Button
                type="link"
                icon={<FileImageOutlined className="text-blue-500" />}
                onClick={() => {
                  setCurrentPaperUrl(record.paperImage!);
                  setCurrentExamId(record.id);
                  setShowViewPaperModal(true);
                }}
              >
                查看样卷
              </Button>
            ) : (
              <Button
                type="link"
                icon={<UploadOutlined className="mr-1" />}
                onClick={() => handleUploadPaper(record.id)}
              >
                上传样卷
              </Button>
            ))}
          {/* 添加上传考生答卷按钮 */}
          {record.status !== "COMPLETED" && (
            <Button
              type="link"
              icon={<UploadOutlined className="mr-1" />}
              disabled={
                !(
                  record.paperImage !== "" &&
                  Array.isArray(record.examinees) &&
                  record.examinees.length > 0
                )
              }
              onClick={() => {
                if (
                  !(
                    record.paperImage !== "" &&
                    Array.isArray(record.examinees) &&
                    record.examinees.length > 0
                  )
                ) {
                  message.warning("请先上传考生名单和样卷");
                  return;
                }
                openFileSelector(record.id);
              }}
            >
              上传考生答卷
            </Button>
          )}
          {/* 添加批改按钮 */}
          {record.status === "GRADING" && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => {
                router.push(`/dashboard/exams/${record.id}/grade`);
              }}
              className="text-green-500 hover:text-green-600"
            >
              批改试卷
            </Button>
          )}
          {/* 添加查看批改详情按钮按钮 */}
          {record.status === "COMPLETED" && (
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => router.push(`/dashboard/exams/${record.id}/grade`)}
              className="text-blue-500 hover:text-blue-600"
            >
              查看批改详情
            </Button>
          )}
          {/* 添加查看成绩按钮 */}
          {record.status === "COMPLETED" && (
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() =>
                router.push(`/dashboard/exams/${record.id}/results`)
              }
              className="text-blue-500 hover:text-blue-600"
            >
              查看成绩
            </Button>
          )}
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEditExam(record)}
            className="text-blue-500 hover:text-blue-600"
          >
            编辑
          </Button>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              setExamToDelete(record);
              setShowDeleteModal(true);
            }}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 初始加载和依赖更新时获取考试列表
  useEffect(() => {
    fetchExams();
  }, [classId, examModalVisible]);

  // 添加文件选择函数
  const openFileSelector = (examId: string) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.multiple = true;
    fileInput.accept = "image/*";

    fileInput.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (!target.files || target.files.length === 0) {
        return;
      }
      handleStudentPapersUpload(target.files, examId);
    };

    fileInput.click();
  };
  // 处理考生试卷上传
  const handleStudentPapersUpload = async (files: FileList, examId: string) => {
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("papers", file);
      });

      // 显示上传进度
      message.loading("正在上传试卷...", 0);

      const response = await axiosInstance.post(
        `/api/exams/${examId}/answer-papers`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        message.destroy(); // 清除loading消息
        message.success("试卷上传成功");
        await fetchExams(); // 刷新考试列表
      }
    } catch (error) {
      message.destroy();
      message.error("试卷上传失败");
      console.error("上传错误:", error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">考试管理</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onCreateExam}
          style={{ backgroundColor: "#1677ff" }}
        >
          创建考试
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={exams}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        className="custom-table"
        loading={loading}
        locale={{
          emptyText: loading ? (
            <div className="py-10">
              <Spin size="large" />
              <div className="mt-3 text-gray-500">加载中...</div>
            </div>
          ) : (
            <Empty description="暂无考试" />
          ),
        }}
      />

      {/* 考试表单模态框 */}
      <Modal
        title={
          <div className="flex items-center">
            <span className="mr-2">
              {editingExam ? <EditOutlined /> : <PlusOutlined />}
            </span>
            {editingExam ? "编辑考试" : "创建考试"}
          </div>
        }
        open={examModalVisible}
        onOk={async () => {
          try {
            await onSaveExam(); // 先保存考试
            await fetchExams(); // 然后刷新列表
            message.success(editingExam ? "编辑成功" : "创建成功");
            onCancelModal(); // 最后关闭模态框
          } catch (error) {
            console.error("保存考试失败:", error);
            message.error(editingExam ? "编辑失败" : "创建失败");
          }
        }}
        onCancel={onCancelModal}
        okText="保存"
        cancelText="取消"
      >
        <Form layout="vertical" className="mt-4">
          <Form.Item
            label="考试名称"
            required
            rules={[{ required: true, message: "请输入考试名称" }]}
          >
            <Input
              value={examName}
              onChange={(e) => onExamNameChange(e.target.value)}
              placeholder="请输入考试名称"
              prefix={<EditOutlined className="text-gray-400" />}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 删除考试 */}
      <Modal
        title={
          <div className="flex items-center text-red-500">
            <ExclamationCircleOutlined className="mr-2 text-xl" />
            确认删除
          </div>
        }
        open={showDeleteModal}
        onOk={async () => {
          if (examToDelete) {
            try {
              await onDeleteExam(examToDelete.id);
              await fetchExams(); // 刷新列表
              setShowDeleteModal(false);
            } catch (error) {
              console.error("删除失败:", error);
              message.error("删除失败");
            }
          }
        }}
        onCancel={() => setShowDeleteModal(false)}
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{
          danger: true,
          icon: <DeleteOutlined />,
        }}
        className="delete-modal"
      >
        <div className="py-4">
          <p className="text-gray-600 mb-2">
            确定要删除以下考试吗？此操作不可恢复。
          </p>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="font-medium text-gray-800">
              {examToDelete?.name}
            </div>
            <div className="text-gray-500 text-sm mt-1">
              考生人数: {examToDelete?.examinees?.length || 0}
            </div>
          </div>
        </div>
      </Modal>

      {/* 考生列表模态框 */}
      <Modal
        title={
          <div className="flex items-center">
            <TeamOutlined className="mr-2 text-blue-500" />
            <span className="font-bold">考生列表</span>
            <span className="ml-2 text-gray-400 text-sm font-normal">
              (共 {examinees.length} 人)
            </span>
          </div>
        }
        open={showExamineesModal}
        onCancel={() => setShowExamineesModal(false)}
        footer={
          <div className="flex justify-between items-center">
            <div className="text-gray-500 text-sm">
              提示: 重新上传将覆盖现有名单
            </div>
            <Upload
              {...uploadProps(selectedExamId || "")}
              showUploadList={false}
              beforeUpload={(file) => {
                handleReupload(selectedExamId || "", file);
                return false;
              }}
            >
              <Button
                type="primary"
                icon={<UploadOutlined />}
                style={{ backgroundColor: "#1677ff" }}
              >
                重新上传名单
              </Button>
            </Upload>
          </div>
        }
        width={800}
        className="examinees-modal"
      >
        <div className="bg-blue-50 p-3 rounded-lg mb-4">
          <div className="text-blue-600 text-sm">
            <InfoCircleOutlined className="mr-2" />
            请确保上传的 Excel 文件包含「name」和「studentId」列
          </div>
        </div>
        <Table
          columns={examineeColumns}
          dataSource={examinees}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          className="custom-table"
        />
      </Modal>

      {/* 查看样卷 */}
      <ViewPaperModal
        onReupload={handleUploadPaper}
        visible={showViewPaperModal}
        paperUrl={currentPaperUrl}
        examId={currentExamId}
        onClose={() => setShowViewPaperModal(false)}
      />
    </div>
  );
}
