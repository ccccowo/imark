# 考试结果

## 获取考试结果列表 [GET /api/exams/{examId}/results]

获取指定考试的所有学生成绩列表。

### 路径参数

- `examId`: 考试ID

### 响应示例

#### 成功响应
```json
[
    {
        "id": "string",
        "examId": "string",
        "studentId": "string",
        "totalScore": 85,
        "student": {
            "name": "string",
            "studentId": "string"
        },
        "exam": {
            "name": "string",
            "fullScore": 100
        }
    }
]
```

### 可能的错误码

- 401: 未授权（未登录或非教师身份）
- 500: 获取考试结果失败

### 权限要求

- 需要教师身份
- 需要登录状态
- 需要是考试所属班级的创建者

## 获取学生考试结果 [GET /api/exams/{examId}/student-result]

获取当前登录学生在指定考试中的成绩和答题详情。

### 路径参数

- `examId`: 考试ID

### 响应示例

#### 成功响应
```json
{
    "examInfo": {
        "id": "string",
        "name": "string",
        "fullScore": 100,
        "status": "COMPLETED"
    },
    "totalScore": 85,
    "answers": [
        {
            "id": "string",
            "questionId": "string",
            "answerQuestionImage": "string",
            "teacherScore": 9,
            "teacherComment": "string",
            "isGraded": true,
            "question": {
                "orderNum": 1,
                "type": "SHORT_ANSWER",
                "score": 10
            }
        }
    ]
}
```

### 可能的错误码

- 401: 未授权（未登录）
- 404: 考试不存在或未参加考试
- 500: 获取考试结果失败

### 权限要求

- 需要学生身份
- 需要登录状态
- 需要是考试所属班级的学生

## 导出考试结果 [GET /api/exams/{examId}/results/export]

导出指定考试的所有学生成绩为 Excel 文件。

### 路径参数

- `examId`: 考试ID

### 响应格式

返回 Excel 文件（.xlsx）

### 导出内容

Excel 文件包含以下列：
- 学号
- 姓名
- 总分
- 各题得分
- 各题评语

### 可能的错误码

- 401: 未授权（未登录或非教师身份）
- 404: 考试不存在
- 500: 导出失败

### 权限要求

- 需要教师身份
- 需要登录状态
- 需要是考试所属班级的创建者

## 获取考试结果详情 [GET /api/exams/{examId}/results/{resultId}/detail]

获取指定学生的考试结果详情。

### 路径参数

- `examId`: 考试ID
- `resultId`: 考试结果ID

### 响应示例

#### 成功响应
```json
{
    "id": "string",
    "examId": "string",
    "studentId": "string",
    "totalScore": 85,
    "student": {
        "name": "string",
        "studentId": "string"
    },
    "answers": [
        {
            "id": "string",
            "questionId": "string",
            "answerQuestionImage": "string",
            "teacherScore": 9,
            "teacherComment": "string",
            "isGraded": true,
            "question": {
                "orderNum": 1,
                "type": "SHORT_ANSWER",
                "score": 10,
                "correctAnswer": "string"
            }
        }
    ]
}
```

### 可能的错误码

- 401: 未授权（未登录或非教师身份）
- 404: 考试结果不存在
- 500: 获取详情失败

### 权限要求

- 需要教师身份
- 需要登录状态
- 需要是考试所属班级的创建者 