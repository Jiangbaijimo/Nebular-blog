/**
 * 后台管理系统仪表板
 * 展示网站统计数据、快速操作、最新动态等
 */

import React, { useState, useEffect } from 'react';
import ResponsiveImage from '../../components/common/ResponsiveImage';
import { formatDate, formatRelativeTime } from '../../utils/dateUtils';

interface DashboardStats {
  totalPosts: number;
  totalViews: number;
  totalComments: number;
  totalLikes: number;
  todayViews: number;
  todayComments: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
}

interface RecentActivity {
  id: string;
  type: 'post' | 'comment' | 'like' | 'view' | 'system';
  title: string;
  description: string;
  timestamp: string;
  user?: {
    name: string;
    avatar?: string;
  };
  metadata?: Record<string, any>;
}

interface PopularPost {
  id: string;
  title: string;
  slug: string;
  views: number;
  comments: number;
  likes: number;
  publishedAt: string;
  thumbnail?: string;
  category: string;
}

interface SystemStatus {
  server: 'online' | 'offline' | 'maintenance';
  database: 'online' | 'offline' | 'slow';
  cdn: 'online' | 'offline' | 'slow';
  storage: 'online' | 'offline' | 'full';
  lastBackup: string;
  uptime: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  action: () => void;
}

interface DashboardProps {
  className?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ className = '' }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [popularPosts, setPopularPosts] = useState<PopularPost[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | 'week' | 'month' | 'year'>('week');

  // 模拟数据加载
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟统计数据
      setStats({
        totalPosts: 156,
        totalViews: 45230,
        totalComments: 892,
        totalLikes: 2341,
        todayViews: 234,
        todayComments: 12,
        weeklyGrowth: 15.6,
        monthlyGrowth: 23.4
      });
      
      // 模拟最近活动
      setRecentActivities([
        {
          id: '1',
          type: 'comment',
          title: '新评论',
          description: '用户张三在文章《React最佳实践》中发表了评论',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          user: { name: '张三', avatar: '/images/user-1.jpg' }
        },
        {
          id: '2',
          type: 'post',
          title: '文章发布',
          description: '新文章《TypeScript进阶指南》已发布',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          type: 'like',
          title: '文章点赞',
          description: '文章《Vue3组合式API详解》获得了10个新点赞',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          type: 'system',
          title: '系统备份',
          description: '数据库自动备份已完成',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '5',
          type: 'view',
          title: '访问量突破',
          description: '今日访问量已突破200次',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        }
      ]);
      
      // 模拟热门文章
      setPopularPosts([
        {
          id: '1',
          title: 'React最佳实践指南',
          slug: 'react-best-practices',
          views: 1234,
          comments: 45,
          likes: 89,
          publishedAt: '2024-01-15T10:00:00Z',
          thumbnail: '/images/post-1.jpg',
          category: '前端开发'
        },
        {
          id: '2',
          title: 'TypeScript进阶技巧',
          slug: 'typescript-advanced-tips',
          views: 987,
          comments: 32,
          likes: 67,
          publishedAt: '2024-01-12T14:30:00Z',
          thumbnail: '/images/post-2.jpg',
          category: '编程语言'
        },
        {
          id: '3',
          title: 'Vue3组合式API详解',
          slug: 'vue3-composition-api',
          views: 856,
          comments: 28,
          likes: 54,
          publishedAt: '2024-01-10T09:15:00Z',
          thumbnail: '/images/post-3.jpg',
          category: '前端框架'
        },
        {
          id: '4',
          title: 'Node.js性能优化',
          slug: 'nodejs-performance-optimization',
          views: 743,
          comments: 19,
          likes: 41,
          publishedAt: '2024-01-08T16:45:00Z',
          thumbnail: '/images/post-4.jpg',
          category: '后端开发'
        },
        {
          id: '5',
          title: 'CSS Grid布局完全指南',
          slug: 'css-grid-complete-guide',
          views: 692,
          comments: 15,
          likes: 38,
          publishedAt: '2024-01-05T11:20:00Z',
          thumbnail: '/images/post-5.jpg',
          category: 'CSS'
        }
      ]);
      
      // 模拟系统状态
      setSystemStatus({
        server: 'online',
        database: 'online',
        cdn: 'online',
        storage: 'online',
        lastBackup: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        uptime: '15天 8小时 32分钟'
      });
      
      setLoading(false);
    };
    
    loadDashboardData();
  }, [selectedTimeRange]);

  // 快速操作
  const quickActions: QuickAction[] = [
    {
      id: 'new-post',
      title: '写新文章',
      description: '创建一篇新的博客文章',
      icon: '✏️',
      color: '#3b82f6',
      action: () => {
        // 跳转到文章编辑页面
        console.log('跳转到新文章页面');
      }
    },
    {
      id: 'manage-comments',
      title: '管理评论',
      description: '查看和管理用户评论',
      icon: '💬',
      color: '#10b981',
      action: () => {
        console.log('跳转到评论管理页面');
      }
    },
    {
      id: 'upload-media',
      title: '上传媒体',
      description: '上传图片和其他媒体文件',
      icon: '📁',
      color: '#f59e0b',
      action: () => {
        console.log('打开媒体上传');
      }
    },
    {
      id: 'site-settings',
      title: '网站设置',
      description: '配置网站基本信息',
      icon: '⚙️',
      color: '#8b5cf6',
      action: () => {
        console.log('跳转到设置页面');
      }
    }
  ];

  // 获取活动类型图标
  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'post': return '📝';
      case 'comment': return '💬';
      case 'like': return '❤️';
      case 'view': return '👁️';
      case 'system': return '🔧';
      default: return '📋';
    }
  };

  // 获取系统状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#10b981';
      case 'offline': return '#ef4444';
      case 'maintenance': return '#f59e0b';
      case 'slow': return '#f59e0b';
      case 'full': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // 获取系统状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return '正常';
      case 'offline': return '离线';
      case 'maintenance': return '维护中';
      case 'slow': return '缓慢';
      case 'full': return '存储满';
      default: return '未知';
    }
  };

  if (loading) {
    return (
      <div className={`dashboard-loading ${className}`}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载仪表板数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard ${className}`}>
      {/* 页面头部 */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="page-title">仪表板</h1>
          <p className="page-subtitle">欢迎回来！这里是您的网站概览。</p>
        </div>
        
        <div className="header-actions">
          <div className="time-range-selector">
            {[
              { value: 'today', label: '今天' },
              { value: 'week', label: '本周' },
              { value: 'month', label: '本月' },
              { value: 'year', label: '今年' }
            ].map(option => (
              <button
                key={option.value}
                className={`range-button ${selectedTimeRange === option.value ? 'active' : ''}`}
                onClick={() => setSelectedTimeRange(option.value as any)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3 className="stat-number">{stats?.totalPosts}</h3>
            <p className="stat-label">总文章数</p>
            <span className="stat-change positive">+{stats?.weeklyGrowth}%</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">👁️</div>
          <div className="stat-content">
            <h3 className="stat-number">{stats?.totalViews.toLocaleString()}</h3>
            <p className="stat-label">总访问量</p>
            <span className="stat-change positive">+{stats?.monthlyGrowth}%</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <h3 className="stat-number">{stats?.totalComments}</h3>
            <p className="stat-label">总评论数</p>
            <span className="stat-change neutral">今日 +{stats?.todayComments}</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">❤️</div>
          <div className="stat-content">
            <h3 className="stat-number">{stats?.totalLikes}</h3>
            <p className="stat-label">总点赞数</p>
            <span className="stat-change positive">+12.3%</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* 左侧内容 */}
        <div className="dashboard-main">
          {/* 快速操作 */}
          <div className="dashboard-section">
            <h2 className="section-title">快速操作</h2>
            <div className="quick-actions">
              {quickActions.map(action => (
                <button
                  key={action.id}
                  className="quick-action"
                  onClick={action.action}
                  style={{ '--action-color': action.color } as React.CSSProperties}
                >
                  <div className="action-icon">{action.icon}</div>
                  <div className="action-content">
                    <h3 className="action-title">{action.title}</h3>
                    <p className="action-description">{action.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 热门文章 */}
          <div className="dashboard-section">
            <h2 className="section-title">热门文章</h2>
            <div className="popular-posts">
              {popularPosts.map((post, index) => (
                <div key={post.id} className="popular-post">
                  <div className="post-rank">{index + 1}</div>
                  
                  {post.thumbnail && (
                    <div className="post-thumbnail">
                      <ResponsiveImage
                        src={post.thumbnail}
                        alt={post.title}
                        className="thumbnail-img"
                      />
                    </div>
                  )}
                  
                  <div className="post-content">
                    <h3 className="post-title">{post.title}</h3>
                    <div className="post-meta">
                      <span className="post-category">{post.category}</span>
                      <span className="post-date">{formatDate(post.publishedAt)}</span>
                    </div>
                    
                    <div className="post-stats">
                      <span className="stat-item">
                        <span className="stat-icon">👁️</span>
                        {post.views}
                      </span>
                      <span className="stat-item">
                        <span className="stat-icon">💬</span>
                        {post.comments}
                      </span>
                      <span className="stat-item">
                        <span className="stat-icon">❤️</span>
                        {post.likes}
                      </span>
                    </div>
                  </div>
                  
                  <div className="post-actions">
                    <button className="action-button" title="编辑">
                      ✏️
                    </button>
                    <button className="action-button" title="查看">
                      👁️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧边栏 */}
        <div className="dashboard-sidebar">
          {/* 系统状态 */}
          <div className="dashboard-section">
            <h2 className="section-title">系统状态</h2>
            <div className="system-status">
              {systemStatus && (
                <>
                  <div className="status-item">
                    <span className="status-label">服务器</span>
                    <span 
                      className="status-indicator"
                      style={{ backgroundColor: getStatusColor(systemStatus.server) }}
                    >
                      {getStatusText(systemStatus.server)}
                    </span>
                  </div>
                  
                  <div className="status-item">
                    <span className="status-label">数据库</span>
                    <span 
                      className="status-indicator"
                      style={{ backgroundColor: getStatusColor(systemStatus.database) }}
                    >
                      {getStatusText(systemStatus.database)}
                    </span>
                  </div>
                  
                  <div className="status-item">
                    <span className="status-label">CDN</span>
                    <span 
                      className="status-indicator"
                      style={{ backgroundColor: getStatusColor(systemStatus.cdn) }}
                    >
                      {getStatusText(systemStatus.cdn)}
                    </span>
                  </div>
                  
                  <div className="status-item">
                    <span className="status-label">存储</span>
                    <span 
                      className="status-indicator"
                      style={{ backgroundColor: getStatusColor(systemStatus.storage) }}
                    >
                      {getStatusText(systemStatus.storage)}
                    </span>
                  </div>
                  
                  <div className="status-info">
                    <div className="info-item">
                      <span className="info-label">运行时间</span>
                      <span className="info-value">{systemStatus.uptime}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">最后备份</span>
                      <span className="info-value">{formatRelativeTime(systemStatus.lastBackup)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 最近活动 */}
          <div className="dashboard-section">
            <h2 className="section-title">最近活动</h2>
            <div className="recent-activities">
              {recentActivities.map(activity => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-icon">
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="activity-content">
                    <h4 className="activity-title">{activity.title}</h4>
                    <p className="activity-description">{activity.description}</p>
                    <span className="activity-time">
                      {formatRelativeTime(activity.timestamp)}
                    </span>
                  </div>
                  
                  {activity.user && (
                    <div className="activity-user">
                      {activity.user.avatar ? (
                        <ResponsiveImage
                          src={activity.user.avatar}
                          alt={activity.user.name}
                          className="user-avatar"
                        />
                      ) : (
                        <div className="user-avatar-placeholder">
                          {activity.user.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
export type {
  DashboardStats,
  RecentActivity,
  PopularPost,
  SystemStatus,
  QuickAction,
  DashboardProps
};