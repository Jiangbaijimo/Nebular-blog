# API 文档

本目录包含了博客系统的 API 接口文档，可供前端开发者使用。

## 文件说明

- `swagger.json`: OpenAPI 3.0 规范的 JSON 格式文档
- `swagger.yaml`: OpenAPI 3.0 规范的 YAML 格式文档

## 使用方式

### 1. 在线查看

启动开发服务器后，访问: http://localhost:3000/api/docs

### 2. 导入到 API 工具

可以将 `swagger.json` 或 `swagger.yaml` 文件导入到以下工具中：

- **Postman**: File → Import → 选择文件
- **Insomnia**: Application → Preferences → Data → Import Data
- **Swagger Editor**: https://editor.swagger.io/ → File → Import File
- **Apifox**: 导入 → OpenAPI → 选择文件

### 3. 代码生成

使用 OpenAPI Generator 可以生成各种语言的客户端代码：

```bash
# 安装 OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# 生成 TypeScript 客户端
openapi-generator-cli generate -i docs/swagger.json -g typescript-axios -o client

# 生成 JavaScript 客户端
openapi-generator-cli generate -i docs/swagger.json -g javascript -o client-js
```

### 4. 前端集成示例

#### TypeScript/JavaScript

```typescript
// 使用 axios 调用 API
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 添加认证拦截器
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 获取博客列表
const getBlogs = async (params = {}) => {
  const response = await api.get('/blogs', { params });
  return response.data;
};
```

## 认证说明

大部分 API 需要 JWT 认证，请在请求头中添加：

```
Authorization: Bearer <your-jwt-token>
```

## 更新文档

当 API 发生变化时，运行以下命令重新生成文档：

```bash
npm run export:swagger
```

## 联系方式

如有问题，请联系后端开发团队。
