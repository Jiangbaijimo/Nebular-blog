import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';
import { useRoleGuard } from '../../components/auth/RoleGuard';
import { cn } from '../../utils/common';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  Menu, 
  X, 
  LogOut,
  Home,
  Bell,
  Search
} from 'lucide-react';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { isAdmin } = useRoleGuard();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login');
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            访问被拒绝
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            您没有权限访问管理后台
          </p>
        </div>
      </div>
    );
  }

  // 导航菜单项
  const navigationItems = [
    {
      name: '仪表板',
      href: '/admin',
      icon: LayoutDashboard,
      current: location.pathname === '/admin'
    },
    {
      name: '文章管理',
      href: '/admin/blogs',
      icon: FileText,
      current: location.pathname === '/admin/blogs'
    },
    {
      name: '用户管理',
      href: '/admin/users',
      icon: Users,
      current: location.pathname === '/admin/users'
    },
    {
      name: '媒体库',
      href: '/admin/media',
      icon: FileText,
      current: location.pathname === '/admin/media'
    },
    {
      name: '系统设置',
      href: '/admin/settings',
      icon: Settings,
      current: location.pathname === '/admin/settings'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部导航栏 */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 左侧 - Logo和菜单按钮 */}
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
              >
                {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <div className="flex items-center ml-4 lg:ml-0">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  管理后台
                </h1>
              </div>
            </div>

            {/* 右侧 - 搜索、通知、用户菜单 */}
            <div className="flex items-center space-x-4">
              {/* 搜索框 */}
              <div className="hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索..."
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* 通知按钮 */}
              <button className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                <Bell className="h-6 w-6" />
              </button>

              {/* 返回首页按钮 */}
              <Link
                to="/"
                className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                title="返回首页"
              >
                <Home className="h-6 w-6" />
              </Link>

              {/* 用户菜单 */}
              <div className="flex items-center space-x-3">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.username || '未知用户'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    管理员
                  </p>
                </div>
                <img
                  className="h-8 w-8 rounded-full"
                  src={user?.avatar || '/default-avatar.png'}
                  alt={user?.username || '用户'}
                />
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                  title="退出登录"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* 侧边栏 */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full",
            "lg:translate-x-0 lg:static lg:inset-0 lg:top-16"
          )}
          style={{ top: '64px' }}
        >
          <div className="flex flex-col h-full pt-4">
            {/* 导航菜单 */}
            <nav className="flex-1 px-4 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={closeSidebar}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      item.current
                        ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 border-r-2 border-blue-700 dark:border-blue-200"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                    )}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* 遮罩层 */}
        {isMobile && isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
            onClick={closeSidebar}
          />
        )}

        {/* 主内容区域 */}
        <main className={cn(
          "flex-1 min-h-screen transition-all duration-300",
          isSidebarOpen ? "lg:ml-64" : "lg:ml-0"
        )} style={{ paddingTop: '64px' }}>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;