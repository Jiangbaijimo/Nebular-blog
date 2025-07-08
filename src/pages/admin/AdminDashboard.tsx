import React, { useState, useEffect } from 'react';
import {
  Users,
  FileText,
  Eye,
  TrendingUp,
  Calendar,
  Activity,
  BarChart3,
  PieChart,
  RefreshCw
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  totalViews: number;
  monthlyGrowth: number;
}

interface RecentActivity {
  id: string;
  type: 'post' | 'user' | 'comment';
  title: string;
  time: string;
  user: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPosts: 0,
    totalViews: 0,
    monthlyGrowth: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 模拟数据加载
  const loadDashboardData = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setStats({
      totalUsers: 1234,
      totalPosts: 89,
      totalViews: 45678,
      monthlyGrowth: 12.5
    });

    setRecentActivity([
      {
        id: '1',
        type: 'post',
        title: '新文章《Tauri开发指南》已发布',
        time: '2小时前',
        user: '张三'
      },
      {
        id: '2',
        type: 'user',
        title: '新用户注册',
        time: '3小时前',
        user: '李四'
      },
      {
        id: '3',
        type: 'comment',
        title: '收到新评论',
        time: '5小时前',
        user: '王五'
      },
      {
        id: '4',
        type: 'post',
        title: '文章《React最佳实践》已更新',
        time: '1天前',
        user: '赵六'
      }
    ]);

    setLoading(false);
  };

  // 手动刷新数据
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadDashboardData();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const statCards = [
    {
      title: '总用户数',
      value: stats.totalUsers.toLocaleString(),
      icon: <Users className="w-8 h-8 text-blue-600" />,
      change: '+12%',
      changeType: 'positive' as const,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: '总文章数',
      value: stats.totalPosts.toString(),
      icon: <FileText className="w-8 h-8 text-green-600" />,
      change: '+8%',
      changeType: 'positive' as const,
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: '总浏览量',
      value: stats.totalViews.toLocaleString(),
      icon: <Eye className="w-8 h-8 text-purple-600" />,
      change: '+15%',
      changeType: 'positive' as const,
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: '月增长率',
      value: `${stats.monthlyGrowth}%`,
      icon: <TrendingUp className="w-8 h-8 text-orange-600" />,
      change: '+2.3%',
      changeType: 'positive' as const,
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'user':
        return <Users className="w-4 h-4 text-green-600" />;
      case 'comment':
        return <Activity className="w-4 h-4 text-purple-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">仪表板</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">仪表板</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            欢迎回来！这里是您的博客系统概览。
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? '刷新中...' : '刷新数据'}</span>
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>{new Date().toLocaleDateString('zh-CN')}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {card.value}
                </p>
                <div className="flex items-center mt-2">
                  <span className={`text-sm font-medium ${
                    card.changeType === 'positive' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {card.change}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                    vs 上月
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Placeholder */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              访问量趋势
            </h2>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-400" />
              <select className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option>最近7天</option>
                <option>最近30天</option>
                <option>最近90天</option>
              </select>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-center">
              <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">图表组件待集成</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            最近活动
          </h2>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {activity.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.user}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
            查看全部活动
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          快速操作
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900 dark:text-white">创建新文章</span>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Users className="w-5 h-5 text-green-600" />
            <span className="font-medium text-gray-900 dark:text-white">管理用户</span>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Activity className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-gray-900 dark:text-white">查看分析</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;