import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  BookOpen,
  Edit,
  Image,
  Users,
  Settings,
  BarChart3,
  FileText,
  Tag,
  MessageSquare,
  Shield,
  Cloud,
  Palette,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen
} from 'lucide-react';
import { useRoleGuard } from '../auth/RoleGuard';
import { cn } from '../../utils/common';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  children?: MenuItem[];
  requireAuth?: boolean;
  requireRoles?: string[];
  requirePermissions?: string[];
  badge?: string | number;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen = true, 
  onClose,
  className 
}) => {
  const location = useLocation();
  const { isAuthenticated, isAdmin, isEditor, hasPermission } = useRoleGuard();
  const [expandedItems, setExpandedItems] = useState<string[]>(['blog', 'admin']);

  // 菜单配置
  const menuItems: MenuItem[] = [
    {
      id: 'home',
      label: '首页',
      icon: Home,
      path: '/'
    },
    {
      id: 'blog',
      label: '博客管理',
      icon: BookOpen,
      requireAuth: true,
      children: [
        {
          id: 'blog-list',
          label: '博客列表',
          icon: FileText,
          path: '/blog'
        },
        {
          id: 'blog-editor',
          label: '写作',
          icon: Edit,
          path: '/editor'
        },
        {
          id: 'blog-drafts',
          label: '草稿箱',
          icon: FileText,
          path: '/blog/drafts',
          badge: 3
        },
        {
          id: 'blog-categories',
          label: '分类管理',
          icon: Folder,
          path: '/blog/categories',
          requirePermissions: ['blog:manage']
        },
        {
          id: 'blog-tags',
          label: '标签管理',
          icon: Tag,
          path: '/blog/tags',
          requirePermissions: ['blog:manage']
        }
      ]
    },
    {
      id: 'media',
      label: '媒体库',
      icon: Image,
      path: '/media',
      requireAuth: true,
      badge: '新'
    },
    {
      id: 'comments',
      label: '评论管理',
      icon: MessageSquare,
      path: '/comments',
      requireAuth: true,
      requirePermissions: ['comment:manage'],
      badge: 5
    },
    {
      id: 'admin',
      label: '系统管理',
      icon: Shield,
      requireAuth: true,
      requireRoles: ['admin', 'super_admin'],
      children: [
        {
          id: 'admin-dashboard',
          label: '仪表板',
          icon: BarChart3,
          path: '/admin'
        },
        {
          id: 'admin-users',
          label: '用户管理',
          icon: Users,
          path: '/admin/users',
          requirePermissions: ['user:manage']
        },
        {
          id: 'admin-roles',
          label: '角色权限',
          icon: Shield,
          path: '/admin/roles',
          requirePermissions: ['role:manage']
        },
        {
          id: 'admin-cloud-functions',
          label: '云函数',
          icon: Cloud,
          path: '/admin/cloud-functions',
          requirePermissions: ['cloud_function:manage']
        },
        {
          id: 'admin-themes',
          label: '主题管理',
          icon: Palette,
          path: '/admin/themes',
          requirePermissions: ['theme:manage']
        },
        {
          id: 'admin-settings',
          label: '系统设置',
          icon: Settings,
          path: '/admin/settings',
          requirePermissions: ['system:manage']
        }
      ]
    }
  ];

  // 检查菜单项是否应该显示
  const shouldShowMenuItem = (item: MenuItem): boolean => {
    // 检查认证要求
    if (item.requireAuth && !isAuthenticated) {
      return false;
    }

    // 检查角色要求
    if (item.requireRoles && item.requireRoles.length > 0) {
      const hasRequiredRole = item.requireRoles.some(role => {
        switch (role) {
          case 'admin':
          case 'super_admin':
            return isAdmin;
          case 'editor':
            return isEditor;
          default:
            return false;
        }
      });
      if (!hasRequiredRole) {
        return false;
      }
    }

    // 检查权限要求
    if (item.requirePermissions && item.requirePermissions.length > 0) {
      const hasRequiredPermission = item.requirePermissions.some(permission => 
        hasPermission(permission as any)
      );
      if (!hasRequiredPermission) {
        return false;
      }
    }

    return true;
  };

  // 切换展开状态
  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // 检查路径是否激活
  const isActivePath = (path?: string) => {
    if (!path) return false;
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // 检查父级菜单是否有激活的子项
  const hasActiveChild = (children?: MenuItem[]): boolean => {
    if (!children) return false;
    return children.some(child => 
      shouldShowMenuItem(child) && (
        isActivePath(child.path) || hasActiveChild(child.children)
      )
    );
  };

  // 渲染菜单项
  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    if (!shouldShowMenuItem(item)) {
      return null;
    }

    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const isActive = isActivePath(item.path);
    const hasActiveChildren = hasActiveChild(item.children);
    const Icon = item.icon;

    const itemClasses = cn(
      'flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
      level === 0 ? 'mb-1' : 'mb-0.5',
      level > 0 && 'ml-4 pl-6',
      isActive || hasActiveChildren
        ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20'
        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
    );

    const content = (
      <>
        <Icon className={cn('h-5 w-5 flex-shrink-0', level > 0 && 'h-4 w-4')} />
        <span className="ml-3 flex-1 text-left">{item.label}</span>
        {item.badge && (
          <span className={cn(
            'inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full',
            typeof item.badge === 'number'
              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
          )}>
            {item.badge}
          </span>
        )}
        {hasChildren && (
          <div className="ml-2">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        )}
      </>
    );

    return (
      <div key={item.id}>
        {hasChildren ? (
          <button
            onClick={() => toggleExpanded(item.id)}
            className={itemClasses}
          >
            {content}
          </button>
        ) : (
          <Link
            to={item.path!}
            onClick={onClose}
            className={itemClasses}
          >
            {content}
          </Link>
        )}
        
        {/* 子菜单 */}
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-0.5">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside 
      className={cn(
        'bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300',
        isOpen ? 'w-64' : 'w-0 overflow-hidden',
        className
      )}
    >
      <div className="h-full flex flex-col">
        {/* 侧边栏头部 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                博客系统
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                内容管理平台
              </p>
            </div>
          </div>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map(item => renderMenuItem(item))}
        </nav>

        {/* 侧边栏底部 */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            <p>© 2024 博客系统</p>
            <p>v1.0.0</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;