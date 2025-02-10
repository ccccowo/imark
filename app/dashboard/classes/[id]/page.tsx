"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Form,
  Space,
  Button,
  Table,
  Modal,
  Upload,
  QRCode,
  message,
  Input,
  Modal as AntModal,
  Input as AntInput,
  Tabs,
  Tag,
  Card,
} from "antd";
import {
  UploadOutlined,
  QrcodeOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import type { UploadProps } from "antd";
import * as XLSX from "xlsx";
import { useSession } from "next-auth/react";
import axiosInstance from "@/lib/axios";
import StudentManagement from "./components/StudentManagement";
import ExamManagement from "./components/ExamManagement";
import { Student, Exam } from "@/app/types";

// 可编辑单元格的属性
interface EditableCellProps {
  editing: boolean;
  dataIndex: keyof Student;
  title: string;
  record: Student;
  index: number;
  children: React.ReactNode;
  save: (record: Student) => Promise<void>;
}

// 可编辑单元格组件
const EditableCell: React.FC<EditableCellProps> = ({
  editing,
  dataIndex,
  title,
  record,
  index,
  children,
  save,
  ...restProps
}) => {
  const inputRef = useRef<any>(null);
  const [value, setValue] = useState<string>(() =>
    record ? String(record[dataIndex] || "") : ""
  );

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  useEffect(() => {
    if (record) {
      setValue(String(record[dataIndex] || ""));
    }
  }, [record, dataIndex]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleBlur = async () => {
    if (!record) return;
    try {
      await save({ ...record, [dataIndex]: value });
    } catch (error) {
      console.error("保存失败:", error);
    }
  };

  return (
    <td {...restProps}>
      {editing ? (
        <Input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onPressEnter={handleBlur}
        />
      ) : (
        children
      )}
    </td>
  );
};

const { Search } = AntInput;

interface ClassInfo {
  id: string;
  name: string;
  teacherId: string;
  subject: string;
}

export default function ClassPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [students, setStudents] = useState<Student[]>([]);
  const [qrVisible, setQrVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingKey, setEditingKey] = useState("");
  const [editingField, setEditingField] = useState("");
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [searchText, setSearchText] = useState("");
  const [exams, setExams] = useState<Exam[]>([]);
  const [examModalVisible, setExamModalVisible] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [examName, setExamName] = useState("");
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);

  //   获取学生列表
  const fetchStudents = async (search?: string) => {
    try {
      setLoading(true);
      const searchParams = search ? `?search=${encodeURIComponent(search)}` : "";
      const url = `/api/classes/${params.id}${searchParams}`;
      
      // 添加请求 URL 日志
      console.log("Fetching students from:", url);
      
      const response = await axiosInstance.get(url);
      
      // 添加原始响应数据日志
      console.log("API Response:", response.data);
      
      // 检查 students 数组是否存在
      if (!response.data.students) {
        console.error("No students array in response:", response.data);
        message.error("获取学生数据格式错误");
        return;
      }
      
      // 添加学生数组日志
      console.log("Students array:", response.data.students);
      
      const formattedStudents = response.data.students.map((student: any) => {
        // 添加单个学生数据处理日志
        console.log("Processing student:", student);
        
        return {
          id: student.id,
          name: student.name,
          studentId: student.studentId,
          joinTime: student.joinTime,
        };
      });
      
      // 添加最终格式化数据日志
      console.log("Formatted students:", formattedStudents);
      setStudents(formattedStudents);
    } catch (error) {
      // 改进错误日志
      console.error("Error fetching students:", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        response: error
      });
      message.error("获取学生列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [params.id]);

  //   导入学生
  const handleImportStudents = async (data: any[]) => {
    try {
      const response = await axiosInstance.post(
        `/api/classes/${params.id}/import-students`,
        {
          students: data,
        }
      );

      if (response.status === 200) {
        message.success("导入成功");
        fetchStudents(); // 重新获取学生列表
      }
    } catch (error) {
      message.error("导入失败");
      console.error(error);
    }
  };

  //   删除学生
  const handleDeleteStudent = async (student: Student) => {
    setStudentToDelete(student);
  };

  // 确认删除
  const confirmDelete = async () => {
    if (!studentToDelete) return;

    try {
      await axiosInstance.delete(
        `/api/classes/${params.id}/students/${studentToDelete.id}`
      );
      message.success("删除成功");
      fetchStudents(); // 重新获取学生列表
      setStudentToDelete(null);
    } catch (error) {
      console.error("删除失败:", error);
      message.error("删除失败");
    }
  };

  const isEditing = (record: Student, field: string) =>
    record.id === editingKey && editingField === field;

  const edit = (record: Student, field: string) => {
    setEditingKey(record.id);
    setEditingField(field);
  };

  const save = async (record: Student) => {
    try {
      const response = await axiosInstance.put(`/api/students/${record.id}`, {
        name: record.name,
        studentId: record.studentId,
      });

      if (response.status === 200) {
        message.success("更新成功");
        setEditingKey("");
        setEditingField("");
        fetchStudents();
      }
    } catch (error) {
      message.error("更新失败");
      console.error(error);
    }
  };

  const columns = [
    {
      title: "姓名",
      dataIndex: "name",
      key: "name",
      onCell: (record: Student) => ({
        record,
        dataIndex: "name",
        title: "姓名",
        editing: isEditing(record, "name"),
        save,
      }),
      render: (text: string, record: Student) => (
        <div onDoubleClick={() => edit(record, "name")}>{text}</div>
      ),
    },
    {
      title: "学号",
      dataIndex: "studentId",
      key: "studentId",
      onCell: (record: Student) => ({
        record,
        dataIndex: "studentId",
        title: "学号",
        editing: isEditing(record, "studentId"),
        save,
      }),
      render: (text: string, record: Student) => (
        <div onDoubleClick={() => edit(record, "studentId")}>{text}</div>
      ),
    },
    {
      title: "加入时间",
      dataIndex: "joinTime",
      key: "joinTime",
      render: (joinTime: string) => new Date(joinTime).toLocaleDateString(),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: Student) => (
        <Space size="middle">
          <Button
            type="link"
            danger
            onClick={() => handleDeleteStudent(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const uploadProps: UploadProps = {
    accept: ".xlsx,.xls",
    showUploadList: false,
    beforeUpload: (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(new Uint8Array(data as ArrayBuffer), {
          type: "array",
        });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        handleImportStudents(jsonData);
      };
      reader.readAsArrayBuffer(file);
      return false;
    },
  };

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value);
    fetchStudents(value);
  };

  // 获取考试列表
  const fetchExams = async () => {
    try {
      const response = await axiosInstance.get(
        `/api/classes/${params.id}/exams`
      );
      setExams(response.data);
    } catch (error) {
      console.error("获取考试列表失败:", error);
      message.error("获取考试列表失败");
    }
  };

  useEffect(() => {
    fetchExams();
  }, [params.id]);

  // 创建或更新考试
  const handleSaveExam = async () => {
    try {
      if (editingExam) {
        // 更新考试
        await axiosInstance.put(`/api/exams/${editingExam.id}`, {
          name: examName,
        });
        message.success("考试更新成功");
      } else {
        // 创建新考试
        await axiosInstance.post(`/api/classes/${params.id}/exams`, {
          name: examName,
        });
        message.success("考试创建成功");
      }
      setExamModalVisible(false);
      setEditingExam(null);
      setExamName("");
      fetchExams();
    } catch (error) {
      console.error("保存考试失败:", error);
      message.error("保存考试失败");
    }
  };

  // 处理删除考试
  const handleDeleteExam = async (examId: string) => {
    try {
      await axiosInstance.delete(`/api/exams/${examId}`);
      message.success("删除成功");
      // 重新获取考试列表
      const response = await axiosInstance.get(
        `/api/classes/${params.id}/exams`
      );
      setExams(response.data);
    } catch (error) {
      console.error("删除考试失败:", error);
      message.error("删除考试失败");
    }
  };

  // 考试表格列配置
  const examColumns = [
    {
      title: "考试名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const statusConfig = {
          NOT_READY: {
            color: "default",
            text: "未准备",
          },
          IN_PROGRESS: {
            color: "processing",
            text: "进行中",
          },
          FINISHED: {
            color: "success",
            text: "批改完成",
          },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || {
          color: "default",
          text: status,
        };

        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: Exam) => (
        <Space size="middle">
          <Button
            type="link"
            onClick={() => {
              setEditingExam(record);
              setExamName(record.name);
              setExamModalVisible(true);
            }}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            onClick={() => handleDeleteExam(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 获取班级信息
  const fetchClassInfo = async () => {
    try {
      const response = await axiosInstance.get(`/api/classes/${params.id}`);
      setClassInfo(response.data);
    } catch (error) {
      console.error('获取班级信息失败:', error);
      message.error('获取班级信息失败');
    }
  };

  useEffect(() => {
    fetchClassInfo();
  }, [params.id]);

  // 处理退出登录
  const handleLogout = async () => {
    try {
      await axiosInstance.post('/api/auth/logout');
      message.success('退出成功');
      router.push('/login');
    } catch (error) {
      console.error('退出失败:', error);
      message.error('退出失败');
    }
  };

  return (
    <div className="p-6">
        {/* 顶部导航栏 */}
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
                <Button 
                    icon={<ArrowLeftOutlined />} 
                    onClick={() => router.back()}
                >
                    返回
                </Button>
                <div>
                    <span className="text-xl font-bold">
                        {classInfo?.name || '加载中...'}
                    </span>
                    <span className="ml-2 text-gray-500">
                        {classInfo?.subject}
                    </span>
                </div>
            </div>
            <Button 
                type="primary" 
                danger
                icon={<LogoutOutlined />}
                onClick={handleLogout}
            >
                退出登录
            </Button>
        </div>

        {/* 主要内容区域 */}
        <Card className="shadow-md">
            <div className="flex justify-between items-center mb-4">
                <div className="space-x-4">
                    <Upload {...uploadProps}>
                        <Button icon={<UploadOutlined />}>批量导入学生</Button>
                    </Upload>
                    <Button icon={<QrcodeOutlined />} onClick={() => setQrVisible(true)}>
                        查看班级二维码
                    </Button>
                </div>
                <Search
                    placeholder="搜索姓名或学号"
                    allowClear
                    onSearch={handleSearch}
                    onChange={(e) => {
                        if (!e.target.value) {
                            handleSearch("");
                        }
                    }}
                    style={{ width: 200 }}
                />
            </div>

            <Tabs defaultActiveKey="exams">
                <Tabs.TabPane tab="学生管理" key="students">
                    <StudentManagement
                        students={students}
                        loading={loading}
                        classId={params.id}
                        onStudentUpdate={fetchStudents}
                        editingKey={editingKey}
                        editingField={editingField}
                        onEdit={edit}
                        onSave={save}
                        EditableCell={EditableCell}
                        onDelete={handleDeleteStudent}
                    />
                </Tabs.TabPane>
                <Tabs.TabPane tab="考试管理" key="exams">
                    <ExamManagement
                        classId={params.id}
                        examModalVisible={examModalVisible}
                        editingExam={editingExam}
                        examName={examName}
                        onCreateExam={() => {
                            setEditingExam(null);
                            setExamName("");
                            setExamModalVisible(true);
                        }}
                        onEditExam={(exam) => {
                            setEditingExam(exam);
                            setExamName(exam.name);
                            setExamModalVisible(true);
                        }}
                        onDeleteExam={handleDeleteExam}
                        onSaveExam={handleSaveExam}
                        onCancelModal={() => {
                            setExamModalVisible(false);
                            setEditingExam(null);
                            setExamName("");
                        }}
                        onExamNameChange={setExamName}
                    />
                </Tabs.TabPane>
            </Tabs>
        </Card>

        {/* Modals */}
        <Modal
            title="班级加入二维码"
            open={qrVisible}
            onCancel={() => setQrVisible(false)}
            footer={null}
        >
            <div className="flex justify-center">
                <QRCode
                    value={`${process.env.NEXT_PUBLIC_APP_URL}/join-class/${params.id}`}
                    size={200}
                />
            </div>
        </Modal>

        <AntModal
            title="确认删除"
            open={!!studentToDelete}
            onOk={confirmDelete}
            onCancel={() => setStudentToDelete(null)}
            okText="确认"
            cancelText="取消"
            okButtonProps={{ danger: true }}
        >
            <p>确定要将学生 {studentToDelete?.name} 从班级中移除吗？</p>
        </AntModal>

        <Modal
            title={editingExam ? "编辑考试" : "新建考试"}
            open={examModalVisible}
            onOk={handleSaveExam}
            onCancel={() => {
                setExamModalVisible(false);
                setEditingExam(null);
                setExamName("");
            }}
        >
            <Form layout="vertical">
                <Form.Item label="考试名称" required>
                    <Input
                        value={examName}
                        onChange={(e) => setExamName(e.target.value)}
                        placeholder="请输入考试名称"
                    />
                </Form.Item>
            </Form>
        </Modal>
    </div>
  );
}
