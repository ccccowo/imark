# iMark API 文档

## 简介

iMark API 是一个基于 Next.js 和 Prisma 构建的 RESTful API，用于支持在线考试批改系统的各项功能。

## 基础信息

- 基础路径: `/api`
- 认证方式: NextAuth.js Session 认证
- 响应格式: JSON

## API 目录

### 认证相关
- [登录认证](./auth.md)

### 用户管理
- [学生个人信息](./students/profile.md)
- [学生成绩查询](./students/grades.md)

### 班级管理
- [班级操作](./classes/basic.md)
- [班级学生管理](./classes/students.md)
- [加入班级](./classes/join.md)

### 考试管理
- [考试基础操作](./exams/basic.md)
- [考试题目管理](./exams/questions.md)
- [考试批改](./exams/grade.md)
- [考试结果](./exams/results.md)

## 通用响应格式

### 成功响应
```json
{
    "success": true,
    "message": "操作成功",
    "data": {
        // 具体的数据
    }
}
```

### 错误响应
```json
{
    "error": "错误信息",
    "details": "详细错误说明（如果有）"
}
```

## 状态码说明

- 200: 请求成功
- 400: 请求参数错误
- 401: 未授权
- 403: 禁止访问
- 404: 资源不存在
- 500: 服务器内部错误 