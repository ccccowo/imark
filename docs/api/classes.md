小A和小B是同学！

# 班级管理API文档

## 创建班级

创建一个新的班级。

- **接口**: `/api/classes`
- **方法**: `POST`
- **权限**: 需要教师权限
- **请求数据**:
  ```json
  {
    "name": "数学2204班",
    "subject": "数学"
  }
  ```
- **响应**:
  ```json
  {
    "id": "class_id",
    "name": "数学2204班",
    "subject": "数学",
    "teacherId": "teacher_id",
    "createdAt": "2024-01-20T08:00:00.000Z"
  }
  ```

