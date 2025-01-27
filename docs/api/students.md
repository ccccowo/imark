# 学生管理接口文档

## 获取个人信息

获取当前登录学生的个人信息。

- **接口**: `/api/students/profile`
- **方法**: `GET`
- **权限**: 需要学生权限
- **响应**:
  ```json
  {
    "id": "student_id",
    "name": "张三",
    "username": "zhangsan",
    "studentId": "2024001",
    "email": "zhangsan@example.com"
  }
  ```

## 更新个人信息

更新学生的个人信息。

- **接口**: `/api/students/profile`
- **方法**: `PUT`
- **权限**: 需要学生权限
- **请求体**:
  ```json
  {
    "name": "张三",
    "studentId": "2024001",
    "currentPassword": "oldpass",  // 可选，仅在修改密码时需要
    "newPassword": "newpass"       // 可选，仅在修改密码时需要
  }
  ```
- **响应**:
  ```json
  {
    "message": "更新成功",
    "user": {
      "id": "student_id",
      "name": "张三",
      "username": "zhangsan",
      "studentId": "2024001",
      "email": "zhangsan@example.com"
    }
  }
  ```

## 检查个人信息完整性

检查学生的个人信息是否完整。

- **接口**: `/api/students/check-profile`
- **方法**: `GET`
- **权限**: 需要学生权限
- **响应**:
  ```json
  {
    "isComplete": true,
    "profile": {
      "name": "张三",
      "studentId": "2024001"
    }
  }
  ```

## 获取成绩列表

获取学生的所有考试成绩。

- **接口**: `/api/students/grades`
- **方法**: `GET`
- **权限**: 需要学生权限
- **响应**:
  ```json
  {
    "success": true,
    "grades": [
      {
        "examId": "exam_id",
        "examName": "期中考试",
        "fullScore": 100,
        "className": "软工2204班",
        "classId": "class_id",
        "score": 85
      }
    ]
  }
  ```

## 获取最近考试

获取学生最近的考试记录。

- **接口**: `/api/students/recent-exams`
- **方法**: `GET`
- **权限**: 需要学生权限
- **响应**:
  ```json
  {
    "success": true,
    "exams": [
      {
        "id": "exam_id",
        "name": "期中考试",
        "status": "COMPLETED",
        "className": "软工2204班",
        "classId": "class_id",
        "score": 85,
        "fullScore": 100,
        "examTime": "2024-01-20T08:00:00.000Z"
      }
    ]
  }
  ``` 