import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit,
  Eye,
  Code,
  Activity,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Upload,
  Download,
  Settings,
  Monitor,
  BarChart3,
  Search,
  Filter
} from 'lucide-react';

interface CloudFunction {
  id: string;
  name: string;
  description: string;
  runtime: string;
  status: 'active' | 'inactive' | 'error' | 'deploying';
  lastDeployed: string;
  invocations: number;
  avgDuration: number;
  errorRate: number;
  memoryUsage: number;
  codeSize: number;
  triggers: string[];
  environment: 'development' | 'staging' | 'production';
  version: string;
}

interface FunctionLog {
  id: string;
  functionId: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  duration?: number;
  memoryUsed?: number;
}

const CloudFunctionManagement: React.FC = () => {
  const [functions, setFunctions] = useState<CloudFunction[]>([]);
  const [logs, setLogs] = useState<FunctionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'metrics' | 'settings'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [environmentFilter, setEnvironmentFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);

  useEffect(() => {
    loadFunctions();
    loadLogs();
  }, []);

  const loadFunctions = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setFunctions([
      {
        id: '1',
        name: 'user-authentication',
        description: '用户认证和授权处理',
        runtime: 'Node.js 18',
        status: 'active',
        lastDeployed: '2024-01-20T10:30:00Z',
        invocations: 15420,
        avgDuration: 245,
        errorRate: 0.02,
        memoryUsage: 128,
        codeSize: 2.5,
        triggers: ['HTTP', 'Event'],
        environment: 'production',
        version: 'v1.2.3'
      },
      {
        id: '2',
        name: 'email-notification',
        description: '邮件通知服务',
        runtime: 'Python 3.9',
        status: 'active',
        lastDeployed: '2024-01-19T15:45:00Z',
        invocations: 8930,
        avgDuration: 180,
        errorRate: 0.01,
        memoryUsage: 256,
        codeSize: 1.8,
        triggers: ['Queue', 'Schedule'],
        environment: 'production',
        version: 'v2.1.0'
      },
      {
        id: '3',
        name: 'image-processing',
        description: '图片处理和优化',
        runtime: 'Node.js 18',
        status: 'deploying',
        lastDeployed: '2024-01-20T14:20:00Z',
        invocations: 3250,
        avgDuration: 1200,
        errorRate: 0.05,
        memoryUsage: 512,
        codeSize: 4.2,
        triggers: ['HTTP', 'Storage'],
        environment: 'staging',
        version: 'v1.0.5'
      },
      {
        id: '4',
        name: 'data-analytics',
        description: '数据分析和报告生成',
        runtime: 'Python 3.9',
        status: 'error',
        lastDeployed: '2024-01-18T09:15:00Z',
        invocations: 1200,
        avgDuration: 3500,
        errorRate: 0.15,
        memoryUsage: 1024,
        codeSize: 6.8,
        triggers: ['Schedule'],
        environment: 'development',
        version: 'v0.8.2'
      },
      {
        id: '5',
        name: 'webhook-handler',
        description: 'Webhook事件处理',
        runtime: 'Node.js 18',
        status: 'inactive',
        lastDeployed: '2024-01-15T11:00:00Z',
        invocations: 450,
        avgDuration: 95,
        errorRate: 0.03,
        memoryUsage: 128,
        codeSize: 1.2,
        triggers: ['HTTP'],
        environment: 'development',
        version: 'v1.1.0'
      }
    ]);
    
    setLoading(false);
  };

  const loadLogs = async () => {
    // 模拟日志数据
    setLogs([
      {
        id: '1',
        functionId: '1',
        timestamp: '2024-01-20T14:30:15Z',
        level: 'info',
        message: 'Function executed successfully',
        duration: 245,
        memoryUsed: 85
      },
      {
        id: '2',
        functionId: '1',
        timestamp: '2024-01-20T14:29:45Z',
        level: 'warn',
        message: 'High memory usage detected',
        duration: 280,
        memoryUsed: 120
      },
      {
        id: '3',
        functionId: '4',
        timestamp: '2024-01-20T14:25:30Z',
        level: 'error',
        message: 'Database connection timeout',
        duration: 5000,
        memoryUsed: 512
      }
    ]);
  };

  const filteredFunctions = functions.filter(func => {
    const matchesSearch = func.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         func.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || func.status === statusFilter;
    const matchesEnvironment = environmentFilter === 'all' || func.environment === environmentFilter;
    return matchesSearch && matchesStatus && matchesEnvironment;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'deploying':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'inactive':
        return <Pause className="w-4 h-4" />;
      case 'error':
        return <XCircle className="w-4 h-4" />;
      case 'deploying':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '运行中';
      case 'inactive':
        return '已停止';
      case 'error':
        return '错误';
      case 'deploying':
        return '部署中';
      default:
        return status;
    }
  };

  const getEnvironmentColor = (environment: string) => {
    switch (environment) {
      case 'production':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'staging':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'development':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getEnvironmentText = (environment: string) => {
    switch (environment) {
      case 'production':
        return '生产环境';
      case 'staging':
        return '预发布环境';
      case 'development':
        return '开发环境';
      default:
        return environment;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatMemory = (mb: number) => {
    return `${mb}MB`;
  };

  const formatSize = (mb: number) => {
    return `${mb.toFixed(1)}MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">总函数数</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{functions.length}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Cloud className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">运行中</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {functions.filter(f => f.status === 'active').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">总调用次数</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {functions.reduce((total, f) => total + f.invocations, 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">平均响应时间</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(functions.reduce((total, f) => total + f.avgDuration, 0) / functions.length)}ms
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <Zap className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Functions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索函数名称或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全部状态</option>
                <option value="active">运行中</option>
                <option value="inactive">已停止</option>
                <option value="error">错误</option>
                <option value="deploying">部署中</option>
              </select>
              <select
                value={environmentFilter}
                onChange={(e) => setEnvironmentFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全部环境</option>
                <option value="production">生产环境</option>
                <option value="staging">预发布环境</option>
                <option value="development">开发环境</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  函数名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  环境
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  运行时
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  调用次数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  平均耗时
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  错误率
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredFunctions.map((func) => (
                <tr key={func.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {func.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {func.description}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        v{func.version} • {formatDate(func.lastDeployed)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(func.status)}`}>
                      {getStatusIcon(func.status)}
                      <span className="ml-1">{getStatusText(func.status)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEnvironmentColor(func.environment)}`}>
                      {getEnvironmentText(func.environment)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {func.runtime}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatMemory(func.memoryUsage)} • {formatSize(func.codeSize)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {func.invocations.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatDuration(func.avgDuration)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-sm font-medium ${
                      func.errorRate > 0.1 ? 'text-red-600' : 
                      func.errorRate > 0.05 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {(func.errorRate * 100).toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedFunction(func.id)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-green-600 transition-colors">
                        <Code className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-yellow-600 transition-colors">
                        <Settings className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderLogs = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">函数日志</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {logs.map((log) => {
            const func = functions.find(f => f.id === log.functionId);
            return (
              <div key={log.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        log.level === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                        log.level === 'warn' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                      }`}>
                        {log.level.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {func?.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      {log.message}
                    </p>
                    {(log.duration || log.memoryUsed) && (
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        {log.duration && (
                          <span>耗时: {formatDuration(log.duration)}</span>
                        )}
                        {log.memoryUsed && (
                          <span>内存: {log.memoryUsed}MB</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">云函数管理</h1>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">云函数管理</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            管理和监控您的无服务器函数。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
            <Upload className="w-4 h-4" />
            导入函数
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            创建函数
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', name: '概览', icon: Monitor },
              { id: 'logs', name: '日志', icon: FileText },
              { id: 'metrics', name: '指标', icon: BarChart3 },
              { id: 'settings', name: '设置', icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'logs' && renderLogs()}
          {activeTab === 'metrics' && (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                指标监控
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                详细的性能指标和监控图表即将推出
              </p>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="text-center py-12">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                全局设置
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                云函数全局配置和环境设置
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Function Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">创建云函数</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    函数名称
                  </label>
                  <input
                    type="text"
                    placeholder="my-function"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    运行时
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="nodejs18">Node.js 18</option>
                    <option value="python39">Python 3.9</option>
                    <option value="go119">Go 1.19</option>
                    <option value="java11">Java 11</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  描述
                </label>
                <textarea
                  rows={3}
                  placeholder="函数功能描述"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    内存 (MB)
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="128">128</option>
                    <option value="256">256</option>
                    <option value="512">512</option>
                    <option value="1024">1024</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    超时 (秒)
                  </label>
                  <input
                    type="number"
                    defaultValue={30}
                    min={1}
                    max={900}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    环境
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="development">开发环境</option>
                    <option value="staging">预发布环境</option>
                    <option value="production">生产环境</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 justify-end pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
                >
                  取消
                </button>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  创建函数
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudFunctionManagement;