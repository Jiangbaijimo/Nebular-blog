import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Github, Twitter, Linkedin, MapPin, Calendar, ArrowDown } from 'lucide-react';
import { blogAPI } from '../../services/api';
import { formatDate } from '../../utils/dateUtils';
import type { BlogPost } from '../../types/blog';

const HomePage: React.FC = () => {
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取最新文章
  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        setLoading(true);
        const response = await blogAPI.getBlogs({
          page: 1,
          limit: 3,
          status: 'published',
          sortBy: 'createdAt',
          sortOrder: 'desc'
        });
        setRecentPosts(response.data || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch recent posts:', err);
        setError('获取最新文章失败');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentPosts();
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
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Hi, I'm <span className="text-blue-600">Innei</span> 👋
              </h1>
              <h2 className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-6">
                A Node.JS Full Stack <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono text-sm">&lt;Developer /&gt;</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl">
                An independent developer coding with love
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

      {/* Recent Posts Preview */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              最新文章
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              分享我的技术心得和开发经验
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              // 加载状态
              [1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                    <div className="flex justify-between">
                      <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : error ? (
              // 错误状态
              <div className="col-span-full text-center py-12">
                <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  重试
                </button>
              </div>
            ) : recentPosts.length > 0 ? (
              // 有数据时显示真实文章
              recentPosts.map((post) => (
                <article key={post.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                  <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 relative overflow-hidden">
                    {post.coverImage ? (
                      <img 
                        src={post.coverImage} 
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">{post.title.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                      {post.excerpt || post.summary || '暂无摘要'}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>{formatDate(post.createdAt)}</span>
                      <Link to={`/blog/${post.slug || post.id}`} className="text-blue-600 hover:text-blue-700">
                        阅读更多
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              // 无数据状态
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 mb-4">暂无文章</p>
                <Link 
                  to="/admin/posts/new"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  写第一篇文章
                </Link>
              </div>
            )}
          </div>
          
          <div className="text-center mt-12">
            <Link
              to="/blog"
              className="inline-flex items-center px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              查看所有文章
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;