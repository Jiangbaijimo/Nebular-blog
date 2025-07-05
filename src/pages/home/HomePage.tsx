import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Edit3, Users, Zap } from 'lucide-react';

const HomePage: React.FC = () => {
  const features = [
    {
      icon: <BookOpen className="w-8 h-8 text-blue-600" />,
      title: '优雅的阅读体验',
      description: '精心设计的排版和主题，为您提供最佳的阅读体验'
    },
    {
      icon: <Edit3 className="w-8 h-8 text-green-600" />,
      title: '强大的编辑器',
      description: '支持Markdown语法，实时预览，让写作变得更加高效'
    },
    {
      icon: <Zap className="w-8 h-8 text-yellow-600" />,
      title: '本地优先',
      description: '基于Tauri构建，数据本地存储，快速响应，保护隐私'
    },
    {
      icon: <Users className="w-8 h-8 text-purple-600" />,
      title: '社区驱动',
      description: '开源项目，持续更新，与开发者社区共同成长'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <section className="relative px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            高性能
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              博客系统
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            基于Tauri构建的本地优先博客系统，为您提供快速、安全、优雅的写作和阅读体验
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/blog"
              className="inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              开始阅读
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/editor"
              className="inline-flex items-center px-8 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
            >
              开始写作
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            为什么选择我们？
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            准备开始您的写作之旅？
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            立即体验高性能博客系统，享受流畅的写作和阅读体验
          </p>
          <Link
            to="/auth/register"
            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
          >
            立即开始
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;