# 班级基础操作

## 获取班级列表 [GET /api/classes]

获取教师创建的所有班级列表。

### 查询参数

- `name` (可选): 按班级名称搜索

### 响应示例

#### 成功响应
```json
[
    {
        "id": "string",
        "name": "string",
        "subject": "string",
        "teacherId": "string",
        "_count": {
            "students": 0
        }
    }
]
```

### 可能的错误码

- 401: 未授权（未登录）
- 500: 获取班级失败

### 权限要求

- 需要教师身份
- 需要登录状态

## 创建班级 [POST /api/classes]

创建新的班级。

### 请求参数

```json
{
    "name": "string",    // 班级名称
    "subject": "string"  // 科目
}
```

### 响应示例

#### 成功响应
```json
{
    "id": "string",
    "name": "string",
    "subject": "string",
    "teacherId": "string",
    "teacher": {
        "name": "string",
        "username": "string"
    },
    "_count": {
        "students": 0
    }
}
```

#### 错误响应
```json
{
    "error": "该班级名称已存在",
    "details": "请使用其他班级名称"
}
```

### 可能的错误码

- 400: 班级名称和科目为必填项
- 400: 该班级名称已存在
- 401: 未授权（未登录或非教师身份）
- 500: 创建班级失败

### 权限要求

- 需要教师身份
- 需要登录状态

## 获取班级详情 [GET /api/classes/{id}]

获取指定班级的详细信息。

### 路径参数

- `id`: 班级ID

### 响应示例

#### 成功响应
```json
{
    "id": "string",
    "name": "string",
    "subject": "string",
    "teacherId": "string",
    "teacher": {
        "name": "string",
        "username": "string"
    },
    "students": [
        {
            "id": "string",
            "name": "string",
            "studentId": "string"
        }
    ],
    "_count": {
        "students": 0
    }
}
```

### 可能的错误码

- 401: 未授权（未登录）
- 404: 未找到班级
- 500: 获取班级信息失败

### 权限要求

- 需要登录状态

## 删除班级 [DELETE /api/classes/{id}]

删除指定的班级及其相关数据。

### 路径参数

- `id`: 班级ID

### 响应示例

#### 成功响应
```json
{
    "success": true,
    "message": "班级删除成功"
}
```

### 可能的错误码

- 401: 未授权（未登录或非教师身份）
- 500: 删除班级失败

### 权限要求

- 需要教师身份
- 需要登录状态
- 需要是班级的创建者 