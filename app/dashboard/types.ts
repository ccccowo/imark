export interface Class {
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