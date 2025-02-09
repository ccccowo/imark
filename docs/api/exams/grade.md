# 考试批改

## 获取答题记录 [GET /api/exams/{examId}/answer-questions]

获取指定考试的所有答题记录。

### 路径参数

- `examId`: 考试ID

### 响应示例

#### 成功响应
```json
[
    {
        "id": "string",
        "examineeId": "string",
        "questionId": "string",
        "answerQuestionImage": "string",
        "answerQuestionImageCOS": "string",
        "aiScore": 8,
        "teacherScore": 9,
        "aiComment": "string",
        "teacherComment": "string",
        "aiConfidence": 0.85,
        "isGraded": true,
        "examinee": {
            "name": "string",
            "studentId": "string"
        },
        "question": {
            "orderNum": 1,
            "type": "SHORT_ANSWER",
            "score": 10,
            "correctAnswer": "string"
        }
    }
]
```

### 可能的错误码

- 401: 未授权（未登录或非教师身份）
- 500: 获取答题记录失败

### 权限要求

- 需要教师身份
- 需要登录状态
- 需要是考试所属班级的创建者

## AI 批改 [POST /api/exams/{examId}/grade/ai]

使用 AI 对答题进行批改。

### 路径参数

- `examId`: 考试ID

### 请求参数

```json
{
    "answerId": "string",
    "imageUrl": "string",
    "score": 10,
    "correctAnswer": "string"
}
```

### 响应示例

#### 成功响应
```json
{
    "success": true,
    "data": {
        "aiScore": 8,
        "aiComment": "string",
        "aiConfidence": 0.85
    }
}
```

### 可能的错误码

- 400: 参数不完整
- 401: 未授权（未登录或非教师身份）
- 500: AI 批改失败

### 权限要求

- 需要教师身份
- 需要登录状态
- 需要是考试所属班级的创建者

## 教师批改 [POST /api/exams/{examId}/grade/teacher]

教师手动批改答题。

### 路径参数

- `examId`: 考试ID

### 请求参数

```json
{
    "answerId": "string",
    "score": 9,
    "comment": "string"
}
```

### 响应示例

#### 成功响应
```json
{
    "success": true,
    "message": "保存成功"
}
```

### 可能的错误码

- 401: 未授权（未登录或非教师身份）
- 500: 保存失败

### 权限要求

- 需要教师身份
- 需要登录状态
- 需要是考试所属班级的创建者

## 处理答题图片 [POST /api/exams/{examId}/process-image]

处理答题图片，上传到对象存储并更新答题记录。

### 路径参数

- `examId`: 考试ID

### 请求参数

使用 `multipart/form-data` 格式：
- `file`: 图片文件
- `answerId`: 答题记录ID

### 响应示例

#### 成功响应
```json
{
    "success": true,
    "message": "图片处理成功",
    "data": {
        "imageUrl": "string"  // COS 图片 URL
    }
}
```

### 可能的错误码

- 400: 文件格式不正确
- 401: 未授权（未登录或非教师身份）
- 500: 图片处理失败

### 权限要求

- 需要教师身份
- 需要登录状态
- 需要是考试所属班级的创建者 