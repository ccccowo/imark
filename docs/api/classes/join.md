# 加入班级

## 加入班级 [POST /api/classes/join]

学生通过班级ID加入指定班级。

### 请求参数

```json
{
    "classId": "string"  // 班级ID
}
```

### 响应示例

#### 成功响应
```json
{
    "success": true,
    "message": "成功加入班级",
    "data": {
        "studentId": "string",
        "classId": "string",
        "joinTime": "2024-03-20T12:00:00.000Z"
    }
}
```

#### 错误响应
```json
{
    "error": "班级不存在",
    "details": "未找到指定的班级"
}
```

### 可能的错误码

- 400: 班级ID不能为空
- 400: 您已经加入过这个班级了
- 401: 未授权（未登录）
- 404: 班级不存在
- 500: 加入班级失败

### 权限要求

- 需要学生身份
- 需要登录状态 