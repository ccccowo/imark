# 班级学生管理

## 导入学生 [POST /api/classes/{id}/import-students]

批量导入学生到指定班级。

### 路径参数

- `id`: 班级ID

### 请求参数

```json
{
    "students": [
        {
            "name": "string",      // 学生姓名
            "studentId": "string"  // 学号
        }
    ]
}
```

### 响应示例

#### 成功响应
```json
{
    "success": true,
    "message": "成功导入 3 名学生",
    "students": [
        {
            "id": "string",
            "name": "string",
            "studentId": "string",
            "role": "STUDENT"
        }
    ]
}
```

#### 错误响应
```json
{
    "error": "学生数据格式不正确",
    "details": "请检查导入数据的格式"
}
```

### 可能的错误码

- 400: 学生数据格式不正确
- 401: 未授权（未登录或非教师身份）
- 404: 班级不存在或无权限
- 500: 导入学生失败

### 权限要求

- 需要教师身份
- 需要登录状态
- 需要是班级的创建者

## 删除学生 [DELETE /api/classes/{id}/students/{studentId}]

从班级中移除指定学生。

### 路径参数

- `id`: 班级ID
- `studentId`: 学生ID

### 响应示例

#### 成功响应
```json
{
    "message": "已从班级中移除学生"
}
```

### 可能的错误码

- 401: 未授权（未登录或非教师身份）
- 404: 班级不存在或无权限
- 500: 删除学生失败

### 权限要求

- 需要教师身份
- 需要登录状态
- 需要是班级的创建者

## 更新学生信息 [PUT /api/students/{studentId}]

更新学生的基本信息。

### 路径参数

- `studentId`: 学生ID

### 请求参数

```json
{
    "name": "string",      // 学生姓名
    "studentId": "string"  // 学号
}
```

### 响应示例

#### 成功响应
```json
{
    "id": "string",
    "name": "string",
    "studentId": "string"
}
```

### 可能的错误码

- 401: 未授权（未登录或非教师身份）
- 500: 更新学生信息失败

### 权限要求

- 需要教师身份
- 需要登录状态 