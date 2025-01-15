// 学生类型
export interface Student {
    id: string;
    name: string;
    studentId: string;
    joinTime: string;
}

// 考试类型
export interface Exam {
    id: string;
    name: string;
    status: 'READY' | 'GRADING' | 'COMPLETED';
    createdAt: string;
    classId: string;
    paperImage?: string;
    examinees: Examinee[];
}

// 可编辑单元格组件的属性
export interface EditableCellProps {
    editing: boolean;
    dataIndex: keyof Student;
    title: string;
    record: Student;
    index: number;
    children: React.ReactNode;
    save: (record: Student) => Promise<void>;
} 
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
export interface Examinee {
    id: string;
    name: string;
    studentId: string;
    examId: string;
    createdAt: string;
} 