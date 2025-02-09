# 学生个人信息

## 获取个人信息 [GET /api/students/profile]

获取当前登录学生的个人信息。

### 响应示例

#### 成功响应
```json
{
    "id": "string",
    "name": "string",
    "username": "string",
    "studentId": "string",
    "email": "string"
}
```

#### 错误响应
```json
{
    "error": "未授权",
    "details": "需要学生身份"
}
```

### 可能的错误码

- 401: 未授权（未登录或非学生身份）
- 404: 用户不存在
- 500: 获取个人信息失败

### 权限要求

- 需要学生身份
- 需要登录状态

## 更新个人信息 [PUT /api/students/profile]

更新当前登录学生的个人信息，包括基本信息和密码。

### 请求参数

#### 更新基本信息
```json
{
    "name": "string",      // 姓名
    "studentId": "string"  // 学号
}
```

#### 修改密码
```json
{
    "currentPassword": "string",  // 当前密码
    "newPassword": "string"       // 新密码
}
```

### 响应示例

#### 成功响应
```json
{
    "message": "更新成功",
    "user": {
        "id": "string",
        "name": "string",
        "username": "string",
        "studentId": "string",
        "email": "string"
    }
}
```

#### 错误响应
```json
{
    "error": "当前密码错误",
    "details": "请输入正确的当前密码"
}
```

### 可能的错误码

- 400: 当前密码错误
- 401: 未授权（未登录或非学生身份）
- 404: 用户不存在
- 500: 更新个人信息失败

### 权限要求

- 需要学生身份
- 需要登录状态 