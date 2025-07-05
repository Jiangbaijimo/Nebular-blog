import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  User, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  Moon,
  Sun,
  Edit,
  Home,
  BookOpen,
  Shield
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useRoleGuard } from '../auth/RoleGuard';
import { tokenManager } from '../../services/auth/tokenManager';

interface HeaderProps {
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  onMenuToggle, 
  showMenuButton = false 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { isAdmin, isEditor } = useRoleGuard();
  
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSecretMessage, setShowSecretMessage] = useState(false);
  
  // 双击检测
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clickCountRef = useRef(0);

  // 主导航分类
  const mainNavItems = [
    { name: '首页', slug: 'home', icon: '🏠' },
    { name: '文稿', slug: 'posts', icon: '📝' },
    { name: '手记', slug: 'notes', icon: '📚' },
    { name: '时光', slug: 'timeline', icon: '⏰' },
    { name: '思考', slug: 'thinking', icon: '💭' },
    { name: '更多', slug: 'more', icon: '📦' },
  ];

  // 分类数据状态
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // 获取分类树数据
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await fetch('/api/categories/tree', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const result = await response.json();
        if (result.success) {
          setCategories(result.data.data || []);
        }
      } catch (error) {
        console.error('获取分类失败:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // 根据slug获取分类及其子分类
  const getCategoryBySlug = (slug: string) => {
    return categories.find(cat => cat.slug === slug);
  };

  // 处理分类点击
  const handleCategoryClick = (categoryId: string, slug: string) => {
    if (slug === 'home') {
      navigate('/');
    } else {
      navigate(`/blog?categoryId=${categoryId}`);
    }
    setActiveDropdown(null);
  };

  // 处理鼠标悬停
  const handleMouseEnter = (slug: string) => {
    setActiveDropdown(slug);
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
  };

  // 导航菜单项（保留原有的写作功能）
  const navItems = [
    { path: '/editor', label: '写作', icon: Edit, requireAuth: true },
  ];

  // 管理员菜单项（已隐藏，通过双击Logo进入）
  // const adminNavItems = [
  //   { path: '/admin', label: '管理后台', icon: Shield, requireAdmin: true },
  // ];

  const handleLogout = async () => {
    try {
      await logout();
      tokenManager.clearToken();
      navigate('/auth/login');
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // TODO: 实现主题切换逻辑
    document.documentElement.classList.toggle('dark');
  };

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // 处理Logo双击事件
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    clickCountRef.current += 1;
    
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    
    clickTimeoutRef.current = setTimeout(() => {
      if (clickCountRef.current === 1) {
        // 单击 - 正常跳转到首页
        navigate('/');
      } else if (clickCountRef.current === 2) {
        // 双击 - 神秘入口逻辑
        if (!isAuthenticated) {
          // 未登录用户显示神秘消息
          setShowSecretMessage(true);
          setTimeout(() => setShowSecretMessage(false), 3000);
        } else if (isAdmin) {
          // 管理员用户进入管理后台
          navigate('/admin');
        } else {
          // 普通登录用户显示神秘消息
          setShowSecretMessage(true);
          setTimeout(() => setShowSecretMessage(false), 3000);
        }
      }
      clickCountRef.current = 0;
    }, 300); // 300ms内的点击算作双击
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 左侧：Logo和导航 */}
          <div className="flex items-center space-x-8">
            {/* 菜单按钮（移动端） */}
            {showMenuButton && (
              <button
                onClick={onMenuToggle}
                className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors md:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}

            {/* Logo - 神秘入口 */}
            <div className="relative">
              <button
                onClick={handleLogoClick}
                className="flex items-center space-x-2 text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <span>博客系统</span>
              </button>
              
              {/* 神秘消息提示 */}
              {showSecretMessage && (
                <div className="absolute top-full left-0 mt-2 p-3 bg-gray-800 dark:bg-gray-700 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50 animate-fade-in">
                  <div className="relative">
                    你发现了神秘的登录入口，但这里什么也没有 🤫
                    <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-800 dark:bg-gray-700 rotate-45"></div>
                  </div>
                </div>
              )}
            </div>

            {/* 主导航（桌面端） */}
            <nav className="hidden md:flex space-x-6">
              {mainNavItems.map((item) => {
                const category = getCategoryBySlug(item.slug);
                const hasChildren = category && category.children && category.children.length > 0;
                
                return (
                  <div
                    key={item.slug}
                    className="relative"
                    onMouseEnter={() => hasChildren && handleMouseEnter(item.slug)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      onClick={() => handleCategoryClick(category?.id || '', item.slug)}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeDropdown === item.slug
                          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span>{item.name}</span>
                      {hasChildren && (
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>

                    {/* 下拉菜单 */}
                    {hasChildren && activeDropdown === item.slug && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                        <div className="max-h-96 overflow-y-auto">
                          {category.children.map((child: any) => (
                            <button
                              key={child.id}
                              onClick={() => handleCategoryClick(child.id, child.slug)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                            >
                              {child.icon && <span className="text-base">{child.icon}</span>}
                              <div>
                                <div className="font-medium">{child.name}</div>
                                {child.description && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {child.description}
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* 写作功能（需要登录） */}
              {navItems.map((item) => {
                const Icon = item.icon;
                const shouldShow = !item.requireAuth || isAuthenticated;
                
                if (!shouldShow) return null;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActivePath(item.path)
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* 管理员导航已隐藏 - 通过双击Logo进入 */}
            </nav>
          </div>

          {/* 右侧：搜索、通知、用户菜单 */}
          <div className="flex items-center space-x-4">
            {/* 搜索 */}
            <div className="relative">
              {isSearchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索博客..."
                    className="w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(false)}
                    className="ml-2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                >
                  <Search className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* 主题切换 */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {isAuthenticated ? (
              <>
                {/* 通知 */}
                <button className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* 用户菜单 */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      {user?.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <span className="hidden md:block text-sm font-medium">
                      {user?.username || '用户'}
                    </span>
                  </button>

                  {/* 用户下拉菜单 */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user?.username}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user?.email}
                        </p>
                      </div>
                      
                      <Link
                        to="/profile"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        <span>个人资料</span>
                      </Link>
                      
                      <Link
                        to="/settings"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        <span>设置</span>
                      </Link>
                      
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>退出登录</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* 未登录状态 */
              <div className="flex items-center space-x-2">
                <Link
                  to="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  登录
                </Link>
                <Link
                  to="/auth/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 移动端导航菜单 */}
      {showMenuButton && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
          <nav className="px-4 py-2 space-y-1">
            {/* 主导航分类（移动端） */}
            {mainNavItems.map((item) => {
              const category = getCategoryBySlug(item.slug);
              const hasChildren = category && category.children && category.children.length > 0;
              
              return (
                <div key={item.slug} className="space-y-1">
                  <button
                    onClick={() => handleCategoryClick(category?.id || '', item.slug)}
                    className="flex items-center space-x-2 w-full px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.name}</span>
                  </button>
                  
                  {/* 子分类（移动端展开显示） */}
                  {hasChildren && (
                    <div className="ml-6 space-y-1">
                      {category.children.map((child: any) => (
                        <button
                          key={child.id}
                          onClick={() => handleCategoryClick(child.id, child.slug)}
                          className="flex items-center space-x-2 w-full px-3 py-2 rounded-md text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          {child.icon && <span>{child.icon}</span>}
                          <span>{child.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 写作功能（移动端） */}
            {navItems.map((item) => {
              const Icon = item.icon;
              const shouldShow = !item.requireAuth || isAuthenticated;
              
              if (!shouldShow) return null;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActivePath(item.path)
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* 管理员导航已隐藏（移动端） - 通过双击Logo进入 */}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;