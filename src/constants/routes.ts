// 路由配置常量

// 公共路由
export const PUBLIC_ROUTES = {
  HOME: '/',
  BLOG: '/blog',
  BLOG_DETAIL: '/blog/:id',
  BLOG_CATEGORY: '/blog/category/:slug',
  BLOG_TAG: '/blog/tag/:slug',
  SEARCH: '/search',
  ABOUT: '/about',
  CONTACT: '/contact',
} as const;

// 认证路由
export const AUTH_ROUTES = {
  LOGIN: '/auth/login',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
  OAUTH_CALLBACK: '/auth/callback/:provider',
} as const;



// 管理后台路由
export const ADMIN_ROUTES = {
  DASHBOARD: '/admin',
  
  // 博客管理
  BLOG_MANAGEMENT: '/admin/blogs',
  BLOG_CREATE: '/admin/blogs/create',
  BLOG_EDIT: '/admin/blogs/:id/edit',
  BLOG_PREVIEW: '/admin/blogs/:id/preview',
  
  // 分类管理
  CATEGORIES: '/admin/categories',
  CATEGORY_CREATE: '/admin/categories/create',
  CATEGORY_EDIT: '/admin/categories/:id/edit',
  
  // 标签管理
  TAGS: '/admin/tags',
  TAG_CREATE: '/admin/tags/create',
  TAG_EDIT: '/admin/tags/:id/edit',
  
  // 评论管理
  COMMENTS: '/admin/comments',
  COMMENT_DETAIL: '/admin/comments/:id',
  
  // 用户管理
  USERS: '/admin/users',
  USER_DETAIL: '/admin/users/:id',
  USER_CREATE: '/admin/users/create',
  USER_EDIT: '/admin/users/:id/edit',
  
  // 媒体库
  MEDIA_LIBRARY: '/admin/media',
  MEDIA_UPLOAD: '/admin/media/upload',
  
  // 云函数管理
  CLOUD_FUNCTIONS: '/admin/cloud-functions',
  CLOUD_FUNCTION_CREATE: '/admin/cloud-functions/create',
  CLOUD_FUNCTION_EDIT: '/admin/cloud-functions/:id/edit',
  CLOUD_FUNCTION_LOGS: '/admin/cloud-functions/:id/logs',
  
  // 主题管理
  THEMES: '/admin/themes',
  THEME_EDITOR: '/admin/themes/editor',
  THEME_PREVIEW: '/admin/themes/preview',
  
  // 系统设置
  SETTINGS: '/admin/settings',
  SETTINGS_GENERAL: '/admin/settings/general',
  SETTINGS_EMAIL: '/admin/settings/email',
  SETTINGS_SECURITY: '/admin/settings/security',
  SETTINGS_BACKUP: '/admin/settings/backup',
  
  // 统计分析
  ANALYTICS: '/admin/analytics',
  ANALYTICS_POSTS: '/admin/analytics/posts',
  ANALYTICS_USERS: '/admin/analytics/users',
  ANALYTICS_TRAFFIC: '/admin/analytics/traffic',
  
  // 同步管理
  SYNC: '/admin/sync',
  SYNC_CONFLICTS: '/admin/sync/conflicts',
  SYNC_HISTORY: '/admin/sync/history',
} as const;

// 所有路由集合
export const ROUTES = {
  ...PUBLIC_ROUTES,
  ...AUTH_ROUTES,
  ...ADMIN_ROUTES,
} as const;

// 路由权限配置
export const ROUTE_PERMISSIONS = {
  // 公共路由 - 无需权限
  PUBLIC: Object.values(PUBLIC_ROUTES),
  
  // 认证路由 - 仅未登录用户
  GUEST_ONLY: Object.values(AUTH_ROUTES),
  
  // 需要登录的路由
  AUTHENTICATED: [],
  
  // 管理员路由
  ADMIN_ONLY: Object.values(ADMIN_ROUTES),
  
  // 编辑者及以上权限
  EDITOR_AND_ABOVE: [
    ADMIN_ROUTES.BLOG_MANAGEMENT,
    ADMIN_ROUTES.BLOG_CREATE,
    ADMIN_ROUTES.BLOG_EDIT,
    ADMIN_ROUTES.MEDIA_LIBRARY,
  ],
} as const;

// 导航菜单配置
export const NAVIGATION_MENUS = {
  // 主导航
  MAIN: [
    {
      key: 'home',
      label: '首页',
      path: PUBLIC_ROUTES.HOME,
      icon: 'Home',
    },
    {
      key: 'blog',
      label: '博客',
      path: PUBLIC_ROUTES.BLOG,
      icon: 'BookOpen',
    },
  ],
  
  // 管理员菜单
  ADMIN: [
    {
      key: 'dashboard',
      label: '仪表板',
      path: ADMIN_ROUTES.DASHBOARD,
      icon: 'BarChart3',
    },
    {
      key: 'blogs',
      label: '博客管理',
      path: ADMIN_ROUTES.BLOG_MANAGEMENT,
      icon: 'FileText',
      children: [
        {
          key: 'blog-list',
          label: '博客列表',
          path: ADMIN_ROUTES.BLOG_MANAGEMENT,
        },
        {
          key: 'blog-create',
          label: '创建博客',
          path: ADMIN_ROUTES.BLOG_CREATE,
        },
        {
          key: 'categories',
          label: '分类管理',
          path: ADMIN_ROUTES.CATEGORIES,
        },
        {
          key: 'tags',
          label: '标签管理',
          path: ADMIN_ROUTES.TAGS,
        },
      ],
    },
    {
      key: 'comments',
      label: '评论管理',
      path: ADMIN_ROUTES.COMMENTS,
      icon: 'MessageSquare',
    },
    {
      key: 'users',
      label: '用户管理',
      path: ADMIN_ROUTES.USERS,
      icon: 'Users',
    },
    {
      key: 'media',
      label: '媒体库',
      path: ADMIN_ROUTES.MEDIA_LIBRARY,
      icon: 'Image',
    },
    {
      key: 'cloud-functions',
      label: '云函数',
      path: ADMIN_ROUTES.CLOUD_FUNCTIONS,
      icon: 'Zap',
    },
    {
      key: 'themes',
      label: '主题管理',
      path: ADMIN_ROUTES.THEMES,
      icon: 'Palette',
    },
    {
      key: 'analytics',
      label: '统计分析',
      path: ADMIN_ROUTES.ANALYTICS,
      icon: 'TrendingUp',
    },
    {
      key: 'sync',
      label: '同步管理',
      path: ADMIN_ROUTES.SYNC,
      icon: 'RefreshCw',
    },
    {
      key: 'settings',
      label: '系统设置',
      path: ADMIN_ROUTES.SETTINGS,
      icon: 'Settings',
    },
  ],
} as const;

// 面包屑配置
export const BREADCRUMB_CONFIG = {
  [ADMIN_ROUTES.DASHBOARD]: [
    { label: '管理后台', path: ADMIN_ROUTES.DASHBOARD },
  ],
  [ADMIN_ROUTES.BLOG_MANAGEMENT]: [
    { label: '管理后台', path: ADMIN_ROUTES.DASHBOARD },
    { label: '博客管理', path: ADMIN_ROUTES.BLOG_MANAGEMENT },
  ],
  [ADMIN_ROUTES.BLOG_CREATE]: [
    { label: '管理后台', path: ADMIN_ROUTES.DASHBOARD },
    { label: '博客管理', path: ADMIN_ROUTES.BLOG_MANAGEMENT },
    { label: '创建博客' },
  ],
  [ADMIN_ROUTES.USERS]: [
    { label: '管理后台', path: ADMIN_ROUTES.DASHBOARD },
    { label: '用户管理', path: ADMIN_ROUTES.USERS },
  ],
  [ADMIN_ROUTES.MEDIA_LIBRARY]: [
    { label: '管理后台', path: ADMIN_ROUTES.DASHBOARD },
    { label: '媒体库', path: ADMIN_ROUTES.MEDIA_LIBRARY },
  ],
  [ADMIN_ROUTES.SETTINGS]: [
    { label: '管理后台', path: ADMIN_ROUTES.DASHBOARD },
    { label: '系统设置', path: ADMIN_ROUTES.SETTINGS },
  ],
} as const;

// 路由元信息
export const ROUTE_META = {
  [PUBLIC_ROUTES.HOME]: {
    title: '首页',
    description: '高性能博客系统首页',
    keywords: ['博客', '首页', 'Tauri'],
  },
  [PUBLIC_ROUTES.BLOG]: {
    title: '博客列表',
    description: '浏览所有博客文章',
    keywords: ['博客', '文章', '列表'],
  },
  [ADMIN_ROUTES.DASHBOARD]: {
    title: '管理后台',
    description: '博客系统管理后台',
    keywords: ['管理', '后台', '仪表板'],
    requiresAuth: true,
    requiredRole: 'admin',
  },

} as const;