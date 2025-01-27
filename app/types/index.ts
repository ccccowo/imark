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
    subject: string;
    _count: {
      students: number;
    };
    examStatus?: string;
    examName?: string;
    joinTime?: string;
} 
export interface Examinee {
    id: string;
    name: string;
    studentId: string;
    examId: string;
    createdAt: string;
} 

// 题目类型
enum QuestionType {
    // 单选题
    SINGLE_CHOICE,
    // 多选题
    MULTIPLE_CHOICE,
    // 填空题
    FILL_IN_THE_BLANK,
    // 判断题
    TRUE_OR_FALSE,
    // 简答题
    SHORT_ANSWER
}
// 题目
export interface Question {
    id: string;
    examId: string;
    exam: Exam;
    coordinates: { x1: number; y1: number; x2: number; y2: number }; // 存储题目坐标 {x1,y1,x2,y2}
    // 题目类型
    type: QuestionType;
    orderNum: number; // 题号
    score: number; // 分值


}