# 班级管理接口文档

## 创建班级

创建一个新的班级。

- **接口**: `/api/classes`
- **方法**: `POST`
- **权限**: 需要教师权限
- **请求体**:
  ```json
  {
    "name": "软工2204班",
    "subject": "数学"
  }
  ```
- **响应**:
  ```json
  {
    "id": "class_id",
    "name": "软工2204班",
    "subject": "数学",
    "teacherId": "teacher_id",
    "createdAt": "2024-01-20T08:00:00.000Z"
  }
  ```

## 删除班级

删除指定的班级。

- **接口**: `/api/classes/{id}`
- **方法**: `DELETE`
- **权限**: 需要教师权限
- **参数**: 
  - `id`: 班级ID
- **响应**:
  ```json
  {
    "success": true,
    "message": "班级删除成功"
  }
  ```

## 获取班级列表

获取当前教师的所有班级。

- **接口**: `/api/classes`
- **方法**: `GET`
- **权限**: 需要教师权限
- **查询参数**:
  - `name`: (可选) 按班级名称搜索
- **响应**:
  ```json
  [
    {
      "id": "class_id",
      "name": "软工2204班",
      "subject": "数学",
      "_count": {
        "students": 30
      }
    }
  ]
  ```

## 获取班级详情

获取指定班级的详细信息。

- **接口**: `/api/classes/{id}`
- **方法**: `GET`
- **权限**: 需要教师权限
- **参数**:
  - `id`: 班级ID
- **响应**:
  ```json
  {
    "id": "class_id",
    "name": "软工2204班",
    "subject": "数学",
    "teacher": {
      "name": "张老师",
      "username": "teacher1"
    },
    "students": [],
    "_count": {
      "students": 30
    }
  }
  ```

## 加入班级

学生加入指定的班级。

- **接口**: `/api/classes/join`
- **方法**: `POST`
- **权限**: 需要学生权限
- **请求体**:
  ```json
  {
    "classCode": "class_id"
  }
  ```
- **响应**:
  ```json
  {
    "message": "加入班级成功",
    "data": {
      "id": "membership_id",
      "studentId": "student_id",
      "classId": "class_id",
      "joinTime": "2024-01-20T08:00:00.000Z"
    }
  }
  ```

## 退出班级

学生退出指定的班级。

- **接口**: `/api/classes/{id}/leave`
- **方法**: `DELETE`
- **权限**: 需要学生权限
- **参数**:
  - `id`: 班级ID
- **响应**:
  ```json
  {
    "message": "已退出班级"
  }
  ``` 