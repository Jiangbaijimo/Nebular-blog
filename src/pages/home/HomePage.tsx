import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Github, Twitter, Linkedin, MapPin, Calendar, ArrowDown } from 'lucide-react';
import { type ThemeConfig } from '../../services/api/cloudFunctionTheme';
import { offlineCacheService } from '../../services/offline/offlineCacheService';

const HomePage: React.FC = () => {
  const [themeConfig, setThemeConfig] = useState<ThemeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 检查是否在Tauri环境中
  const isTauriApp = (): boolean => {
    return typeof window !== 'undefined' && '__TAURI__' in window;
  };

  // 获取首页配置（使用云函数）
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (isTauriApp()) {
          // App端：使用缓存机制
          await offlineCacheService.initialize();
          const themeConfigData = await offlineCacheService.getThemeConfigWithCache();
          setThemeConfig(themeConfigData);
        } else {
          // 网页端：使用云函数API获取Shiro主题配置
          const response = await fetch('/api/fn/shiro/config', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          const result = await response.json();
          if (result.success && result.data.success) {
            setThemeConfig(result.data.data);
          } else {
            throw new Error('获取主题配置失败');
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('Failed to fetch theme config:', err);
        setError('获取主题配置失败');
        // 设置默认配置
        setThemeConfig({
          config: {
            hero: {
              title: {
                template: [
                  { type: 'h1', text: 'Hi, I\'m ', class: 'font-light text-4xl' },
                  { type: 'h1', text: 'Admin', class: 'font-medium mx-2 text-4xl' },
                  { type: 'h1', text: '👋。', class: 'font-light text-4xl' }
                ]
              },
              description: '欢迎来到我的博客系统！'
            }
          },
          footer: {
            linkSections: [],
            otherInfo: {
              date: '2024',
              icp: { text: '', link: '' }
            }
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const socialLinks = [
    {
      icon: <Mail className="w-5 h-5" />,
      href: "mailto:contact@example.com",
      label: "邮箱",
      color: "text-red-500 hover:text-red-600"
    },
    {
      icon: <Github className="w-5 h-5" />,
      href: "https://github.com",
      label: "GitHub",
      color: "text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
    },
    {
      icon: <Twitter className="w-5 h-5" />,
      href: "https://twitter.com",
      label: "Twitter",
      color: "text-blue-500 hover:text-blue-600"
    },
    {
      icon: <Linkedin className="w-5 h-5" />,
      href: "https://linkedin.com",
      label: "LinkedIn",
      color: "text-blue-700 hover:text-blue-800"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <section className="relative px-6 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Profile Section */}
          <div className="flex flex-col lg:flex-row items-center gap-12 mb-16">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-2xl">
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face" 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                  <span className="text-white text-xl">👋</span>
                </div>
              </div>
            </div>
            
            {/* Profile Info */}
            <div className="flex-1 text-center lg:text-left">
              {/* 动态标题 */}
              <div className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                {themeConfig?.config.hero.title.template.map((item, index) => {
                  const Component = item.type as keyof JSX.IntrinsicElements;
                  return (
                    <Component key={index} className={item.class}>
                      {item.text}
                    </Component>
                  );
                }) || (
                  <>
                    Hi, I'm <span className="text-blue-600">Innei</span> 👋
                  </>
                )}
              </div>
              <h2 className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-6">
                A Node.JS Full Stack <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono text-sm">&lt;Developer /&gt;</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl">
                {themeConfig?.config.hero.description || 'An independent developer coding with love'}
              </p>
              
              {/* Social Links */}
              <div className="flex justify-center lg:justify-start gap-4 mb-8">
                {socialLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 ${link.color}`}
                    title={link.label}
                  >
                    {link.icon}
                  </a>
                ))}
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/blog"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl"
                >
                  查看文章
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                >
                  关于我
                </Link>
              </div>
            </div>
          </div>
          
          {/* Scroll Indicator */}
          <div className="text-center">
            <ArrowDown className="w-6 h-6 text-gray-400 mx-auto animate-bounce" />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="px-6 py-16 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                关于我的故事
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                我是一名热爱编程的全栈开发者，专注于 Node.js 生态系统。喜欢探索新技术，分享开发经验，用代码创造有趣的东西。
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                在这个博客里，我会分享我的技术心得、项目经验，以及对技术趋势的思考。希望能与更多开发者交流学习。
              </p>
              
              <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>中国</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>加入于 2024</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  技术栈
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Rust', 'Docker', 'AWS'].map((tech) => (
                    <span 
                      key={tech}
                      className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300 shadow-sm"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* 动态页脚链接 - 从主题配置获取 */}
            {themeConfig?.footer.linkSections.map((section, index) => (
              <div key={index}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {section.name}
                </h3>
                <ul className="space-y-2">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a
                        href={link.href}
                        target={link.external ? "_blank" : undefined}
                        rel={link.external ? "noopener noreferrer" : undefined}
                        className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )) || (
              // 默认页脚内容
              <>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    快速链接
                  </h3>
                  <ul className="space-y-2">
                    <li><Link to="/blog" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">博客</Link></li>
                    <li><Link to="/about" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">关于</Link></li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    联系方式
                  </h3>
                  <ul className="space-y-2">
                    <li><a href="mailto:contact@example.com" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">邮箱</a></li>
                    <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">GitHub</a></li>
                  </ul>
                </div>
              </>
            )}
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {themeConfig?.footer.otherInfo?.date ? `© ${themeConfig.footer.otherInfo.date} Innei. All rights reserved.` : '© 2024 Innei. All rights reserved.'}
              {themeConfig?.footer.otherInfo?.icp && (
                <>
                  {' | '}
                  <a 
                    href={themeConfig.footer.otherInfo.icp.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {themeConfig.footer.otherInfo.icp.text}
                  </a>
                </>
              )}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;