# 前端 OAuth 集成指南

## 概述

本指南说明如何在前端处理 OAuth 登录流程。后端已优化为使用临时授权码的方式，提高了安全性和用户体验。

## OAuth 流程说明

### 1. 整体流程

```
用户点击登录 → 跳转到OAuth提供商 → 用户授权 → 回调到后端 → 生成授权码 → 重定向到前端 → 前端交换授权码获取token
```

### 2. 安全优势

- ✅ JWT token 不会暴露在 URL 中
- ✅ 授权码有效期短（5分钟），一次性使用
- ✅ 减少了 token 泄露的风险
- ✅ 更好的用户体验，URL 更简洁

## 前端实现

### 1. OAuth 登录触发

```javascript
// Google OAuth 登录
const handleGoogleLogin = () => {
  window.location.href = `${API_BASE_URL}/auth/google`;
};

// GitHub OAuth 登录
const handleGithubLogin = () => {
  window.location.href = `${API_BASE_URL}/auth/github`;
};
```

### 2. 回调页面处理

创建一个 OAuth 回调页面（如 `/auth/callback`）：

```javascript
// React 示例
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 获取URL参数
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          throw new Error(decodeURIComponent(error));
        }

        if (!code) {
          throw new Error('未获取到授权码');
        }

        // 交换授权码获取token
        const response = await axios.post(`${API_BASE_URL}/auth/exchange-code`, {
          code: code
        });

        const { user, accessToken, refreshToken } = response.data;

        // 存储token
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        // 跳转到主页或用户指定页面
        const redirectTo = localStorage.getItem('oauth_redirect') || '/';
        localStorage.removeItem('oauth_redirect');
        navigate(redirectTo);

      } catch (err) {
        console.error('OAuth回调处理失败:', err);
        setError(err.message || 'OAuth登录失败');
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">正在处理登录...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">登录失败</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            返回登录页面
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default OAuthCallback;
```

### 3. Vue.js 示例

```vue
<template>
  <div class="oauth-callback">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>正在处理登录...</p>
    </div>
    
    <div v-else-if="error" class="error">
      <h2>登录失败</h2>
      <p>{{ error }}</p>
      <button @click="$router.push('/login')">返回登录页面</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'OAuthCallback',
  data() {
    return {
      loading: true,
      error: null
    };
  },
  async mounted() {
    await this.handleCallback();
  },
  methods: {
    async handleCallback() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
          throw new Error(decodeURIComponent(error));
        }

        if (!code) {
          throw new Error('未获取到授权码');
        }

        // 交换授权码获取token
        const response = await axios.post('/api/auth/exchange-code', {
          code: code
        });

        const { user, accessToken, refreshToken } = response.data;

        // 存储token
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        // 跳转到主页
        this.$router.push('/');

      } catch (err) {
        console.error('OAuth回调处理失败:', err);
        this.error = err.message || 'OAuth登录失败';
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
```

### 4. 路由配置

确保在前端路由中配置回调路径：

```javascript
// React Router
{
  path: '/auth/callback',
  element: <OAuthCallback />
}

// Vue Router
{
  path: '/auth/callback',
  component: OAuthCallback
}
```

### 5. API 请求拦截器

配置 axios 拦截器自动添加 token：

```javascript
// 请求拦截器
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理token过期
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post('/api/auth/refresh', {
            refreshToken: refreshToken
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          // 重试原请求
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // 刷新失败，清除token并跳转到登录页
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);
```

## API 接口说明

### 1. OAuth 登录入口

```
GET /api/auth/google    # Google OAuth 登录
GET /api/auth/github    # GitHub OAuth 登录
```

### 2. OAuth 回调接口（后端处理）

```
GET /api/auth/google/callback     # Google OAuth 回调（由OAuth提供商调用）
GET /api/auth/github/callback     # GitHub OAuth 回调（由OAuth提供商调用）
```

**重要说明：**
- 这些回调接口是由 OAuth 提供商（Google/GitHub）在用户授权后自动调用的
- 前端不需要直接调用这些接口
- 这些接口会处理 OAuth 认证，生成临时授权码，然后重定向到前端的 `/auth/callback` 页面
- 你需要在 OAuth 应用配置中将这些 URL 设置为回调地址

### 3. 授权码交换接口

```
POST /api/auth/exchange-code

请求体:
{
  "code": "授权码"
}

响应:
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "username",
    "nickname": "昵称",
    "avatar": "头像URL",
    "roles": [...]
  },
  "accessToken": "JWT访问令牌",
  "refreshToken": "JWT刷新令牌",
  "expiresIn": "7d"
}
```

### 4. 刷新令牌接口

```
POST /api/auth/refresh

请求体:
{
  "refreshToken": "刷新令牌"
}
```

## 错误处理

### 常见错误类型

1. **授权码无效或已过期**
   - 状态码：401
   - 处理：提示用户重新登录

2. **网络错误**
   - 处理：显示网络错误提示，提供重试选项

3. **OAuth提供商错误**
   - 处理：显示具体错误信息，引导用户重新尝试

### 错误处理示例

```javascript
const handleOAuthError = (error) => {
  if (error.response?.status === 401) {
    // 授权码无效
    showError('登录已过期，请重新登录');
    navigate('/login');
  } else if (error.code === 'NETWORK_ERROR') {
    // 网络错误
    showError('网络连接失败，请检查网络后重试');
  } else {
    // 其他错误
    showError(error.message || '登录失败，请重试');
  }
};
```

## OAuth 应用配置

### 1. GitHub OAuth 应用配置

在 GitHub 中创建 OAuth 应用时，需要设置以下回调 URL：

```
开发环境: http://localhost:3000/api/auth/github/callback
生产环境: https://your-api-domain.com/api/auth/github/callback
```

配置步骤：
1. 访问 GitHub Settings > Developer settings > OAuth Apps
2. 点击 "New OAuth App"
3. 填写应用信息：
   - Application name: 你的应用名称
   - Homepage URL: 你的应用主页
   - Authorization callback URL: `http://localhost:3000/api/auth/github/callback`
4. 获取 Client ID 和 Client Secret

### 2. Google OAuth 应用配置

在 Google Cloud Console 中配置 OAuth 应用时，需要设置以下回调 URL：

```
开发环境: http://localhost:3000/api/auth/google/callback
生产环境: https://your-api-domain.com/api/auth/google/callback
```

配置步骤：
1. 访问 Google Cloud Console
2. 创建或选择项目
3. 启用 Google+ API
4. 创建 OAuth 2.0 客户端 ID
5. 在"已获授权的重定向 URI"中添加回调 URL
6. 获取客户端 ID 和客户端密钥

## 环境配置

### 1. 后端环境配置

在 `.env` 文件中配置以下变量：

```bash
# OAuth 2.0配置
OAUTH_GOOGLE_CLIENT_ID=your-google-client-id
OAUTH_GOOGLE_CLIENT_SECRET=your-google-client-secret
OAUTH_GITHUB_CLIENT_ID=your-github-client-id
OAUTH_GITHUB_CLIENT_SECRET=your-github-client-secret

# 前端配置
FRONTEND_URL=http://localhost:3001
```

### 2. 前端环境配置

确保在前端项目中配置正确的 API 基础 URL：

```javascript
// 开发环境
const API_BASE_URL = 'http://localhost:3000/api';

// 生产环境
const API_BASE_URL = 'https://your-api-domain.com/api';
```

## 注意事项

1. **授权码有效期**：授权码有效期为5分钟，请及时交换
2. **一次性使用**：每个授权码只能使用一次
3. **HTTPS要求**：生产环境建议使用HTTPS
4. **错误处理**：做好各种异常情况的处理
5. **用户体验**：在处理过程中显示适当的加载状态

## 测试建议

1. 测试正常的OAuth登录流程
2. 测试授权码过期的情况
3. 测试网络错误的处理
4. 测试用户取消授权的情况
5. 测试token刷新机制

通过以上实现，你的前端应用将能够安全、稳定地处理OAuth登录流程。