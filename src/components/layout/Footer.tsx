import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Github, Mail, Rss } from 'lucide-react';

interface FooterProps {
  className?: string;
  variant?: 'default' | 'minimal' | 'admin';
}

export const Footer: React.FC<FooterProps> = ({ 
  className = '',
  variant = 'default'
}) => {
  const currentYear = new Date().getFullYear();

  if (variant === 'minimal') {
    return (
      <footer className={`bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              © {currentYear} Innei
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="/rss.xml"
                className="text-gray-400 hover:text-orange-500 transition-colors"
                aria-label="RSS"
              >
                <Rss className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  if (variant === 'admin') {
    return (
      <footer className={`bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              © {currentYear} 管理后台 • v1.0.0
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/admin/logs"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                日志
              </Link>
              <a
                href="/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                文档
              </a>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className={`bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center space-y-4">
          {/* 主要内容 */}
          <div className="space-y-2">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Stay hungry, Stay foolish.
            </p>
            <div className="flex items-center justify-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
              <span>© 2020-{currentYear} Innei.</span>
              <span>|</span>
              <Link to="/sitemap" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                站点地图
              </Link>
              <span>|</span>
              <Link to="/subscribe" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                订阅
              </Link>
              <span>|</span>
              <Link to="/monitor" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                监控
              </Link>
              <span>|</span>
              <Link to="/contact" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                联系
              </Link>
              <span>|</span>
              <Link to="/write" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                写首诗
              </Link>
              <span>|</span>
              <Link to="/github" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                Github
              </Link>
            </div>
          </div>
          
          {/* 技术信息 */}
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>
              Powered by{' '}
              <a 
                href="https://github.com/mix-space" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Mix Space
              </a>
              {' '}& 白い. | 闽CP备20236136号 | 正在被 8 人看着{' '}
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full ml-1"></span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;