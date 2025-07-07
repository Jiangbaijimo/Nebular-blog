# 布局系统使用指南

## 概述

重构后的布局系统提供了高度模块化和可配置的布局组件，让每个页面都可以选择性地使用不同的布局元素。

## 核心组件

### MainLayout

主布局组件，支持完全自定义配置：

```tsx
import { MainLayout } from '@/components/layout';

// 完全自定义布局
<MainLayout
  showHeader={true}
  showSidebar={true}
  showFooter={false}
  headerProps={{
    showMenuButton: true,
    className: 'custom-header'
  }}
  sidebarProps={{
    className: 'custom-sidebar'
  }}
  footerProps={{
    variant: 'minimal',
    className: 'custom-footer'
  }}
  containerClassName="min-h-screen bg-custom"
  mainClassName="flex-1 p-4"
>
  <YourPageContent />
</MainLayout>
```

## 预设布局

### 1. AuthLayout - 认证页面布局

用于登录、注册等认证页面：

```tsx
import { AuthLayout } from '@/components/layout';

<AuthLayout>
  <LoginForm />
</AuthLayout>
```

特点：
- 无头部、侧边栏、底部
- 居中显示
- 包含品牌信息

### 2. AdminLayout - 管理后台布局

用于管理后台页面：

```tsx
import { AdminLayout } from '@/components/layout';

<AdminLayout>
  <DashboardContent />
</AdminLayout>
```

特点：
- 包含头部和侧边栏
- 无底部
- 主内容区域有内边距

### 3. BlogLayout - 博客页面布局

用于博客文章页面：

```tsx
import { BlogLayout } from '@/components/layout';

<BlogLayout>
  <ArticleContent />
</BlogLayout>
```

特点：
- 包含头部和底部
- 无侧边栏
- 适合内容展示

### 4. EditorLayout - 编辑器布局

用于写作编辑页面：

```tsx
import { EditorLayout } from '@/components/layout';

<EditorLayout>
  <MarkdownEditor />
</EditorLayout>
```

特点：
- 全屏高度
- 仅包含头部
- 无侧边栏和底部

### 5. FullscreenLayout - 全屏布局

用于首页等需要全屏展示的页面：

```tsx
import { FullscreenLayout } from '@/components/layout';

<FullscreenLayout>
  <LandingPage />
</FullscreenLayout>
```

特点：
- 包含头部和底部
- 无侧边栏
- 最小化底部样式

## 使用预设配置

你也可以直接使用预设配置：

```tsx
import { MainLayout, LayoutPresets } from '@/components/layout';

// 使用管理后台预设
<MainLayout {...LayoutPresets.admin}>
  <YourContent />
</MainLayout>

// 在预设基础上自定义
<MainLayout 
  {...LayoutPresets.blog}
  headerProps={{
    ...LayoutPresets.blog.headerProps,
    className: 'custom-header'
  }}
>
  <YourContent />
</MainLayout>
```

## 可用的预设配置

- `LayoutPresets.auth` - 认证页面
- `LayoutPresets.admin` - 管理后台
- `LayoutPresets.blog` - 博客页面
- `LayoutPresets.editor` - 编辑器
- `LayoutPresets.fullscreen` - 全屏页面

## 配置选项

### LayoutConfig 接口

```tsx
interface LayoutConfig {
  showHeader?: boolean;          // 是否显示头部
  showSidebar?: boolean;         // 是否显示侧边栏
  showFooter?: boolean;          // 是否显示底部
  headerProps?: {                // 头部组件属性
    showMenuButton?: boolean;
    onMenuToggle?: () => void;
    className?: string;
  };
  sidebarProps?: {               // 侧边栏组件属性
    isOpen?: boolean;
    onClose?: () => void;
    className?: string;
  };
  footerProps?: {                // 底部组件属性
    variant?: 'default' | 'minimal' | 'admin';
    className?: string;
  };
  containerClassName?: string;   // 容器样式类
  mainClassName?: string;        // 主内容区域样式类
}
```

## 最佳实践

1. **优先使用预设布局**：对于常见的页面类型，直接使用预设布局组件。

2. **按需自定义**：只有在预设布局不满足需求时，才使用 MainLayout 进行自定义。

3. **保持一致性**：同类型的页面应该使用相同的布局配置。

4. **响应式设计**：布局系统已内置移动端适配，无需额外处理。

5. **性能考虑**：布局组件会自动处理侧边栏的显示/隐藏逻辑，避免不必要的重渲染。

## 迁移指南

如果你正在从旧的布局系统迁移：

1. 将 `<MainLayout>` 替换为对应的预设布局组件
2. 移除路由级别的布局配置逻辑
3. 在页面组件中直接使用布局组件包装内容

### 迁移示例

```tsx
// 旧方式
<Route path="/admin" element={<AdminPage />} />
// AdminPage 内部需要处理布局逻辑

// 新方式
<Route path="/admin" element={
  <AdminLayout>
    <AdminPage />
  </AdminLayout>
} />
// AdminPage 只需关注业务逻辑
```

这样的设计让布局更加模块化，每个页面都可以独立选择合适的布局方式。