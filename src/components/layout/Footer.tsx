import React from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  Github,
  Twitter,
  Mail,
  ExternalLink,
  BookOpen,
  Rss,
  Shield,
  Globe
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth';
import { useRoleGuard } from '../auth/RoleGuard';

interface FooterProps {
  className?: string;
  variant?: 'default' | 'minimal' | 'admin';
}

export const Footer: React.FC<FooterProps> = ({ 
  className = '',
  variant = 'default'
}) => {
  const { isAuthenticated } = useAuthStore();
  const { isAdmin } = useRoleGuard();
  const currentYear = new Date().getFullYear();

  // 快速链接
  const quickLinks = [
    { label: '首页', path: '/' },
    { label: '博客', path: '/blog' },
    { label: '关于', path: '/about' },
    { label: '联系', path: '/contact' }
  ];

  // 管理链接
  const adminLinks = [
    { label: '仪表板', path: '/admin' },
    { label: '用户管理', path: '/admin/users' },
    { label: '系统设置', path: '/admin/settings' }
  ];

  // 社交链接
  const socialLinks = [
    {
      label: 'GitHub',
      icon: Github,
      url: 'https://github.com',
      color: 'hover:text-gray-900 dark:hover:text-white'
    },
    {
      label: 'Twitter',
      icon: Twitter,
      url: 'https://twitter.com',
      color: 'hover:text-blue-400'
    },
    {
      label: 'RSS',
      icon: Rss,
      url: '/rss.xml',
      color: 'hover:text-orange-500'
    },
    {
      label: 'Email',
      icon: Mail,
      url: 'mailto:contact@example.com',
      color: 'hover:text-red-500'
    }
  ];

  // 法律链接
  const legalLinks = [
    { label: '隐私政策', path: '/privacy' },
    { label: '服务条款', path: '/terms' },
    { label: '使用协议', path: '/agreement' }
  ];

  if (variant === 'minimal') {
    return (
      <footer className={`bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <span>© {currentYear} 博客系统</span>
              <span>•</span>
              <span>基于 Tauri 构建</span>
            </div>
            <div className="flex items-center space-x-4">
              {socialLinks.slice(0, 2).map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-gray-400 ${social.color} transition-colors`}
                    aria-label={social.label}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </footer>
    );
  }

  if (variant === 'admin') {
    return (
      <footer className={`bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  管理后台
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span>系统版本: v1.0.0</span>
                <span className="mx-2">•</span>
                <span>在线用户: 12</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <Link
                to="/admin/system-info"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                系统信息
              </Link>
              <Link
                to="/admin/logs"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                系统日志
              </Link>
              <a
                href="/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <span>帮助文档</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className={`bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* 品牌信息 */}
          <div className="col-span-1 lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  博客系统
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  基于 Tauri 的高性能博客平台
                </p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
              一个现代化的博客管理系统，支持本地优先架构、富文本编辑、图床管理和云函数驱动的动态功能。
            </p>
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.url}
                    target={social.url.startsWith('http') ? '_blank' : undefined}
                    rel={social.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className={`text-gray-400 ${social.color} transition-colors`}
                    aria-label={social.label}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* 快速链接 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              快速链接
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {isAuthenticated && (
                <li>
                  <Link
                    to="/editor"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    写作
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* 管理链接（仅管理员可见） */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              {isAdmin ? '管理功能' : '支持'}
            </h4>
            <ul className="space-y-2">
              {isAdmin ? (
                adminLinks.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <a
                      href="/docs"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      使用文档
                    </a>
                  </li>
                  <li>
                    <a
                      href="/api-docs"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      API 文档
                    </a>
                  </li>
                  <li>
                    <Link
                      to="/feedback"
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      意见反馈
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/help"
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      帮助中心
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* 底部信息 */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <span>© {currentYear} 博客系统</span>
                <span>•</span>
                <span>保留所有权利</span>
              </div>
              <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                <span>Made with</span>
                <Heart className="h-4 w-4 text-red-500" />
                <span>by</span>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  开发团队
                </a>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {legalLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          
          {/* 技术信息 */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-4">
                <span>基于 Tauri + React + TypeScript 构建</span>
                <span>•</span>
                <span>版本 v1.0.0</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>系统正常</span>
                </div>
                <span>•</span>
                <span>最后更新: {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;