# 考试题目管理

## 获取题目列表 [GET /api/exams/{examId}/questions]

获取指定考试的所有题目列表。

### 路径参数

- `examId`: 考试ID

### 响应示例

#### 成功响应
```json
[
    {
        "id": "string",
        "examId": "string",
        "orderNum": 1,
        "type": "SHORT_ANSWER",  // SINGLE_CHOICE, MULTIPLE_CHOICE, FILL_BLANK, TRUE_FALSE, SHORT_ANSWER
        "score": 10,
        "correctAnswer": "string",
        "coordinates": {
            "x": 100,
            "y": 200,
            "width": 300,
            "height": 400
        }
    }
]
```

### 可能的错误码

- 401: 未授权（未登录）
- 500: 获取题目失败

### 权限要求

- 需要登录状态

## 创建/更新题目 [POST /api/exams/{examId}/questions]

创建或更新考试的题目列表。此操作会先删除原有题目，然后批量创建新题目。

### 路径参数

- `examId`: 考试ID

### 请求参数

```json
{
    "questions": [
        {
            "orderNum": 1,
            "coordinates": {
                "x": 100,
                "y": 200,
                "width": 300,
                "height": 400
            },
            "score": 10,
            "type": "SHORT_ANSWER",
            "correctAnswer": "string"
        }
    ],
    "fullScore": 100  // 考试总分
}
```

### 请求参数说明

- `type`: 题目类型
  - `SINGLE_CHOICE`: 单选题
  - `MULTIPLE_CHOICE`: 多选题
  - `FILL_BLANK`: 填空题
  - `TRUE_FALSE`: 判断题
  - `SHORT_ANSWER`: 简答题
- `coordinates`: 题目在试卷图片中的坐标和尺寸
- `correctAnswer`: 正确答案
  - 单选题：A-D中的一个字母
  - 多选题：多个字母组合，如"ABC"
  - 判断题：T或F
  - 其他题型：文本答案

### 响应示例

#### 成功响应
```json
{
    "success": true,
    "message": "题目和分数设置成功"
}
```

### 可能的错误码

- 401: 未授权（未登录或非教师身份）
- 500: 保存题目失败

### 权限要求

- 需要教师身份
- 需要登录状态
- 需要是考试所属班级的创建者 