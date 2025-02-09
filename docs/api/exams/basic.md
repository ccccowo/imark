# 考试基础操作

## 获取考试列表 [GET /api/classes/{id}/exams]

获取指定班级的所有考试列表。

### 路径参数

- `id`: 班级ID

### 响应示例

#### 成功响应
```json
[
    {
        "id": "string",
        "name": "string",
        "status": "NOT_READY",  // NOT_READY, GRADING, COMPLETED
        "fullScore": 100,
        "createdAt": "2024-03-20T12:00:00.000Z",
        "classId": "string"
    }
]
```

### 可能的错误码

- 401: 未授权（未登录）
- 500: 获取考试列表失败

### 权限要求

- 需要登录状态

## 创建考试 [POST /api/classes/{id}/exams]

在指定班级中创建新的考试。

### 路径参数

- `id`: 班级ID

### 请求参数

```json
{
    "name": "string"  // 考试名称
}
```

### 响应示例

#### 成功响应
```json
{
    "id": "string",
    "name": "string",
    "status": "NOT_READY",
    "fullScore": 0,
    "createdAt": "2024-03-20T12:00:00.000Z",
    "classId": "string"
}
```

### 可能的错误码

- 400: 考试名称为必填项
- 401: 未授权（未登录或非教师身份）
- 404: 班级不存在
- 500: 创建考试失败

### 权限要求

- 需要教师身份
- 需要登录状态
- 需要是班级的创建者

## 更新考试状态 [POST /api/exams/{examId}/update-status]

更新指定考试的状态。

### 路径参数

- `examId`: 考试ID

### 请求参数

```json
{
    "status": "string"  // NOT_READY, GRADING, COMPLETED
}
```

### 响应示例

#### 成功响应
```json
{
    "success": true,
    "message": "考试状态更新成功"
}
```

### 可能的错误码

- 400: 状态值无效
- 401: 未授权（未登录或非教师身份）
- 404: 考试不存在
- 500: 更新考试状态失败

### 权限要求

- 需要教师身份
- 需要登录状态
- 需要是考试所属班级的创建者

## 删除考试 [DELETE /api/exams/{examId}]

删除指定的考试及其相关数据。

### 路径参数

- `examId`: 考试ID

### 响应示例

#### 成功响应
```json
{
    "success": true,
    "message": "考试删除成功"
}
```

### 可能的错误码

- 401: 未授权（未登录或非教师身份）
- 404: 考试不存在
- 500: 删除考试失败

### 权限要求

- 需要教师身份
- 需要登录状态
- 需要是考试所属班级的创建者 