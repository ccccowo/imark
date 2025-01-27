# 考试管理接口文档

## 创建考试

在指定班级中创建新的考试。

- **接口**: `/api/classes/{id}/exams`
- **方法**: `POST`
- **权限**: 需要教师权限
- **参数**:
  - `id`: 班级ID
- **请求体**:
  ```json
  {
    "name": "期中考试"
  }
  ```
- **响应**:
  ```json
  {
    "id": "exam_id",
    "name": "期中考试",
    "status": "READY",
    "classId": "class_id",
    "createdAt": "2024-01-20T08:00:00.000Z"
  }
  ```

## 删除考试

删除指定的考试。

- **接口**: `/api/exams/{examId}`
- **方法**: `DELETE`
- **权限**: 需要教师权限
- **参数**:
  - `examId`: 考试ID
- **响应**:
  ```json
  {
    "success": true,
    "message": "考试删除成功"
  }
  ```

## 获取考试列表

获取指定班级的所有考试。

- **接口**: `/api/classes/{id}/exams`
- **方法**: `GET`
- **权限**: 需要教师权限
- **参数**:
  - `id`: 班级ID
- **响应**:
  ```json
  [
    {
      "id": "exam_id",
      "name": "期中考试",
      "status": "COMPLETED",
      "createdAt": "2024-01-20T08:00:00.000Z",
      "paperImage": "url_to_image",
      "fullScore": 100,
      "examineeCount": 30
    }
  ]
  ```

## 获取考试详情

获取指定考试的详细信息。

- **接口**: `/api/exams/{examId}`
- **方法**: `GET`
- **权限**: 需要教师权限
- **参数**:
  - `examId`: 考试ID
- **响应**:
  ```json
  {
    "id": "exam_id",
    "name": "期中考试",
    "status": "COMPLETED",
    "paperImage": "url_to_image",
    "fullScore": 100,
    "class": {
      "id": "class_id",
      "name": "软工2204班"
    },
    "questions": [
      {
        "id": "question_id",
        "type": "SHORT_ANSWER",
        "score": 20,
        "orderNum": 1
      }
    ]
  }
  ```

## 更新考试状态

更新考试的状态。

- **接口**: `/api/exams/{examId}/update-status`
- **方法**: `POST`
- **权限**: 需要教师权限
- **参数**:
  - `examId`: 考试ID
- **请求体**:
  ```json
  {
    "status": "COMPLETED"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "exam_id",
      "status": "COMPLETED"
    }
  }
  ```

## 批改试卷

教师批改试卷。

- **接口**: `/api/exams/{examId}/grade`
- **方法**: `POST`
- **权限**: 需要教师权限
- **参数**:
  - `examId`: 考试ID
- **请求体**:
  ```json
  {
    "examineeId": "examinee_id",
    "questionId": "question_id",
    "score": 18,
    "comment": "答案基本正确，但有一些细节需要改进"
  }
  ```
- **响应**:
  ```json
  {
    "message": "批改成功",
    "totalScore": 85
  }
  ```

## 获取考试成绩

获取考试的成绩列表。

- **接口**: `/api/exams/{examId}/results`
- **方法**: `GET`
- **权限**: 需要教师权限
- **参数**:
  - `examId`: 考试ID
- **响应**:
  ```json
  {
    "success": true,
    "results": [
      {
        "id": "result_id",
        "studentId": "2024001",
        "score": 85,
        "student": {
          "name": "张三",
          "studentId": "2024001"
        }
      }
    ]
  }
  ``` 