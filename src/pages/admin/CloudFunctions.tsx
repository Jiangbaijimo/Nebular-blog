/**
 * 云函数管理页面
 * 提供云函数的创建、编辑、部署、监控等功能
 */

import React, { useState, useEffect } from 'react';
import {
  cloudFunctionManager,
  CloudFunction,
  DeploymentResult,
  InvocationResult,
  FunctionMetrics
} from '../../services/cloudFunctions/functionManager';
import {
  deploymentService,
  DeploymentConfig,
  DeploymentStatus
} from '../../services/cloudFunctions/deploymentService';
import {
  monitoringService,
  Alert,
  MonitoringRule,
  PerformanceReport
} from '../../services/cloudFunctions/monitoringService';

interface CloudFunctionsProps {}

type TabType = 'functions' | 'deployments' | 'monitoring' | 'logs';
type ViewMode = 'list' | 'grid';
type FunctionStatus = 'all' | 'active' | 'inactive' | 'deploying' | 'error';

const CloudFunctions: React.FC<CloudFunctionsProps> = () => {
  // 状态管理
  const [activeTab, setActiveTab] = useState<TabType>('functions');
  const [functions, setFunctions] = useState<CloudFunction[]>([]);
  const [deployments, setDeployments] = useState<DeploymentStatus[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [rules, setRules] = useState<MonitoringRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 函数列表状态
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [statusFilter, setStatusFilter] = useState<FunctionStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFunction, setSelectedFunction] = useState<CloudFunction | null>(null);
  
  // 编辑器状态
  const [showEditor, setShowEditor] = useState(false);
  const [editingFunction, setEditingFunction] = useState<CloudFunction | null>(null);
  const [editorCode, setEditorCode] = useState('');
  const [editorConfig, setEditorConfig] = useState<Partial<CloudFunction>>({});
  
  // 部署状态
  const [showDeployDialog, setShowDeployDialog] = useState(false);
  const [deployConfig, setDeployConfig] = useState<DeploymentConfig | null>(null);
  const [deploymentProgress, setDeploymentProgress] = useState<DeploymentStatus | null>(null);
  
  // 监控状态
  const [performanceReport, setPerformanceReport] = useState<PerformanceReport | null>(null);
  const [metricsTimeRange, setMetricsTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  
  // 测试状态
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testPayload, setTestPayload] = useState('');
  const [testResult, setTestResult] = useState<InvocationResult | null>(null);

  // 加载数据
  useEffect(() => {
    loadData();
    
    // 启动监控
    monitoringService.startMonitoring();
    
    return () => {
      monitoringService.stopMonitoring();
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [functionsData, deploymentsData, alertsData, rulesData] = await Promise.all([
        cloudFunctionManager.getFunctions(),
        deploymentService.getAllDeployments(),
        monitoringService.getAlerts(),
        monitoringService.getMonitoringRules()
      ]);
      
      setFunctions(functionsData);
      setDeployments(deploymentsData);
      setAlerts(alertsData);
      setRules(rulesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 过滤函数
  const filteredFunctions = functions.filter(func => {
    const matchesStatus = statusFilter === 'all' || func.status === statusFilter;
    const matchesSearch = func.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         func.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // 创建新函数
  const handleCreateFunction = () => {
    setEditingFunction(null);
    setEditorCode('');
    setEditorConfig({
      name: '',
      description: '',
      runtime: 'nodejs',
      version: '1.0.0',
      code: '',
      config: {
        timeout: 30,
        memory: 128,
        environment: {},
        triggers: []
      }
    });
    setShowEditor(true);
  };

  // 编辑函数
  const handleEditFunction = (func: CloudFunction) => {
    setEditingFunction(func);
    setEditorCode(func.code);
    setEditorConfig(func);
    setShowEditor(true);
  };

  // 保存函数
  const handleSaveFunction = async () => {
    try {
      if (!editorConfig.name || !editorCode) {
        alert('请填写函数名称和代码');
        return;
      }
      
      const functionData = {
        ...editorConfig,
        code: editorCode
      } as Omit<CloudFunction, 'id' | 'status' | 'metrics' | 'createdAt' | 'updatedAt'>;
      
      if (editingFunction) {
        await cloudFunctionManager.updateFunction(editingFunction.id, functionData);
      } else {
        await cloudFunctionManager.createFunction(functionData);
      }
      
      setShowEditor(false);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存失败');
    }
  };

  // 删除函数
  const handleDeleteFunction = async (func: CloudFunction) => {
    if (!confirm(`确定要删除函数 "${func.name}" 吗？`)) return;
    
    try {
      await cloudFunctionManager.deleteFunction(func.id);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    }
  };

  // 部署函数
  const handleDeployFunction = async (func: CloudFunction) => {
    setSelectedFunction(func);
    setDeployConfig(deploymentService.getDefaultConfig('development'));
    setShowDeployDialog(true);
  };

  // 执行部署
  const handleExecuteDeploy = async () => {
    if (!selectedFunction || !deployConfig) return;
    
    try {
      const { deploymentId, status } = await deploymentService.deployFunction(selectedFunction, deployConfig);
      setDeploymentProgress(status);
      setShowDeployDialog(false);
      
      // 轮询部署状态
      const pollStatus = async () => {
        const currentStatus = await deploymentService.getDeploymentStatus(deploymentId);
        if (currentStatus) {
          setDeploymentProgress(currentStatus);
          
          if (currentStatus.status === 'success' || currentStatus.status === 'failed') {
            loadData();
            setTimeout(() => setDeploymentProgress(null), 3000);
          } else {
            setTimeout(pollStatus, 2000);
          }
        }
      };
      
      setTimeout(pollStatus, 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : '部署失败');
    }
  };

  // 测试函数
  const handleTestFunction = (func: CloudFunction) => {
    setSelectedFunction(func);
    setTestPayload(JSON.stringify({ message: 'Hello, World!' }, null, 2));
    setTestResult(null);
    setShowTestDialog(true);
  };

  // 执行测试
  const handleExecuteTest = async () => {
    if (!selectedFunction) return;
    
    try {
      const payload = JSON.parse(testPayload);
      const result = await cloudFunctionManager.invokeFunction(selectedFunction.id, payload);
      setTestResult(result);
    } catch (err) {
      setTestResult({
        success: false,
        error: err instanceof Error ? err.message : '测试失败',
        duration: 0
      });
    }
  };

  // 加载性能报告
  const loadPerformanceReport = async (functionId: string) => {
    try {
      const endTime = new Date();
      const startTime = new Date();
      
      switch (metricsTimeRange) {
        case '1h':
          startTime.setHours(endTime.getHours() - 1);
          break;
        case '24h':
          startTime.setDate(endTime.getDate() - 1);
          break;
        case '7d':
          startTime.setDate(endTime.getDate() - 7);
          break;
        case '30d':
          startTime.setDate(endTime.getDate() - 30);
          break;
      }
      
      const report = await monitoringService.generatePerformanceReport(functionId, {
        start: startTime.toISOString(),
        end: endTime.toISOString()
      });
      
      setPerformanceReport(report);
    } catch (err) {
      console.error('加载性能报告失败:', err);
    }
  };

  // 格式化状态
  const getStatusColor = (status: CloudFunction['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'deploying': return 'text-blue-600 bg-blue-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: CloudFunction['status']) => {
    switch (status) {
      case 'active': return '运行中';
      case 'inactive': return '未激活';
      case 'deploying': return '部署中';
      case 'error': return '错误';
      default: return '未知';
    }
  };

  // 格式化时间
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  // 格式化大小
  const formatSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">加载中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-red-800">{error}</span>
        </div>
        <button
          onClick={loadData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">云函数管理</h1>
          <p className="text-gray-600">管理和监控云函数的部署与运行</p>
        </div>
        <button
          onClick={handleCreateFunction}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          创建函数
        </button>
      </div>

      {/* 标签页导航 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'functions', name: '函数列表', icon: '⚡' },
            { id: 'deployments', name: '部署记录', icon: '🚀' },
            { id: 'monitoring', name: '监控告警', icon: '📊' },
            { id: 'logs', name: '日志查看', icon: '📝' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* 函数列表标签页 */}
      {activeTab === 'functions' && (
        <div className="space-y-4">
          {/* 工具栏 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* 搜索 */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索函数..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              {/* 状态过滤 */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FunctionStatus)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">所有状态</option>
                <option value="active">运行中</option>
                <option value="inactive">未激活</option>
                <option value="deploying">部署中</option>
                <option value="error">错误</option>
              </select>
            </div>
            
            {/* 视图切换 */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* 函数列表 */}
          {viewMode === 'list' ? (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">函数</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">运行时</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">调用次数</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最后调用</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFunctions.map(func => (
                    <tr key={func.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{func.name}</div>
                          <div className="text-sm text-gray-500">{func.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(func.status)}`}>
                          {getStatusText(func.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {func.runtime} {func.version}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {func.metrics.invocations.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {func.metrics.lastInvoked ? formatTime(func.metrics.lastInvoked) : '从未调用'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleTestFunction(func)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          测试
                        </button>
                        <button
                          onClick={() => handleEditFunction(func)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDeployFunction(func)}
                          className="text-green-600 hover:text-green-900"
                        >
                          部署
                        </button>
                        <button
                          onClick={() => loadPerformanceReport(func.id)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          监控
                        </button>
                        <button
                          onClick={() => handleDeleteFunction(func)}
                          className="text-red-600 hover:text-red-900"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFunctions.map(func => (
                <div key={func.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{func.name}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(func.status)}`}>
                      {getStatusText(func.status)}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4">{func.description}</p>
                  
                  <div className="space-y-2 text-sm text-gray-500 mb-4">
                    <div>运行时: {func.runtime} {func.version}</div>
                    <div>调用次数: {func.metrics.invocations.toLocaleString()}</div>
                    <div>错误次数: {func.metrics.errors}</div>
                    <div>平均耗时: {func.metrics.duration}ms</div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleTestFunction(func)}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      测试
                    </button>
                    <button
                      onClick={() => handleEditFunction(func)}
                      className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDeployFunction(func)}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      部署
                    </button>
                    <button
                      onClick={() => loadPerformanceReport(func.id)}
                      className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                    >
                      监控
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 部署记录标签页 */}
      {activeTab === 'deployments' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">部署记录</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">函数ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">进度</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">开始时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">结束时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deployments.map(deployment => (
                  <tr key={deployment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{deployment.functionId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        deployment.status === 'success' ? 'text-green-600 bg-green-100' :
                        deployment.status === 'failed' ? 'text-red-600 bg-red-100' :
                        'text-blue-600 bg-blue-100'
                      }`}>
                        {deployment.status === 'success' ? '成功' :
                         deployment.status === 'failed' ? '失败' :
                         deployment.status === 'pending' ? '等待中' :
                         deployment.status === 'building' ? '构建中' :
                         deployment.status === 'uploading' ? '上传中' :
                         deployment.status === 'deploying' ? '部署中' : deployment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            deployment.status === 'success' ? 'bg-green-500' :
                            deployment.status === 'failed' ? 'bg-red-500' :
                            'bg-blue-500'
                          }`}
                          style={{ width: `${deployment.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{deployment.progress}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTime(deployment.startTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {deployment.endTime ? formatTime(deployment.endTime) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900">查看日志</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 监控告警标签页 */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          {/* 告警列表 */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">活跃告警</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {alerts.filter(alert => alert.status === 'active').map(alert => (
                <div key={alert.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        alert.severity === 'critical' ? 'bg-red-500' :
                        alert.severity === 'high' ? 'bg-orange-500' :
                        alert.severity === 'medium' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}></div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                        <p className="text-sm text-gray-500">{alert.message}</p>
                        <p className="text-xs text-gray-400">触发时间: {formatTime(alert.triggeredAt)}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => monitoringService.resolveAlert(alert.id)}
                        className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        解决
                      </button>
                      <button
                        onClick={() => monitoringService.suppressAlert(alert.id)}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        抑制
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {alerts.filter(alert => alert.status === 'active').length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500">
                  暂无活跃告警
                </div>
              )}
            </div>
          </div>

          {/* 性能报告 */}
          {performanceReport && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">性能报告</h3>
                  <select
                    value={metricsTimeRange}
                    onChange={(e) => setMetricsTimeRange(e.target.value as typeof metricsTimeRange)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="1h">最近1小时</option>
                    <option value="24h">最近24小时</option>
                    <option value="7d">最近7天</option>
                    <option value="30d">最近30天</option>
                  </select>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{performanceReport.summary.totalInvocations}</div>
                    <div className="text-sm text-gray-500">总调用次数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{performanceReport.summary.totalErrors}</div>
                    <div className="text-sm text-gray-500">错误次数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{performanceReport.summary.averageDuration}ms</div>
                    <div className="text-sm text-gray-500">平均耗时</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{performanceReport.summary.errorRate}%</div>
                    <div className="text-sm text-gray-500">错误率</div>
                  </div>
                </div>
                
                {/* 优化建议 */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">优化建议</h4>
                  <ul className="space-y-1">
                    {performanceReport.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 日志查看标签页 */}
      {activeTab === 'logs' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">函数日志</h3>
          </div>
          <div className="p-6">
            <div className="text-center text-gray-500 py-8">
              选择一个函数查看其日志
            </div>
          </div>
        </div>
      )}

      {/* 函数编辑器对话框 */}
      {showEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {editingFunction ? '编辑函数' : '创建函数'}
              </h3>
              <button
                onClick={() => setShowEditor(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 基本信息 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">函数名称</label>
                    <input
                      type="text"
                      value={editorConfig.name || ''}
                      onChange={(e) => setEditorConfig({ ...editorConfig, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                    <textarea
                      value={editorConfig.description || ''}
                      onChange={(e) => setEditorConfig({ ...editorConfig, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">运行时</label>
                      <select
                        value={editorConfig.runtime || 'nodejs'}
                        onChange={(e) => setEditorConfig({ ...editorConfig, runtime: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="nodejs">Node.js</option>
                        <option value="python">Python</option>
                        <option value="go">Go</option>
                        <option value="java">Java</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">版本</label>
                      <input
                        type="text"
                        value={editorConfig.version || ''}
                        onChange={(e) => setEditorConfig({ ...editorConfig, version: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">超时时间(秒)</label>
                      <input
                        type="number"
                        value={editorConfig.config?.timeout || 30}
                        onChange={(e) => setEditorConfig({
                          ...editorConfig,
                          config: { ...editorConfig.config, timeout: parseInt(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">内存(MB)</label>
                      <input
                        type="number"
                        value={editorConfig.config?.memory || 128}
                        onChange={(e) => setEditorConfig({
                          ...editorConfig,
                          config: { ...editorConfig.config, memory: parseInt(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
                
                {/* 代码编辑器 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">函数代码</label>
                  <textarea
                    value={editorCode}
                    onChange={(e) => setEditorCode(e.target.value)}
                    rows={20}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="请输入函数代码..."
                  />
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowEditor(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSaveFunction}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 部署配置对话框 */}
      {showDeployDialog && deployConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">部署配置</h3>
              <button
                onClick={() => setShowDeployDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">环境</label>
                  <select
                    value={deployConfig.environment}
                    onChange={(e) => setDeployConfig({
                      ...deployConfig,
                      environment: e.target.value as any
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="development">开发环境</option>
                    <option value="staging">测试环境</option>
                    <option value="production">生产环境</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">区域</label>
                  <select
                    value={deployConfig.region}
                    onChange={(e) => setDeployConfig({ ...deployConfig, region: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="us-east-1">美国东部</option>
                    <option value="us-west-2">美国西部</option>
                    <option value="ap-southeast-1">亚太东南</option>
                    <option value="eu-west-1">欧洲西部</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">超时时间(秒)</label>
                  <input
                    type="number"
                    value={deployConfig.timeout}
                    onChange={(e) => setDeployConfig({ ...deployConfig, timeout: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">内存(MB)</label>
                  <input
                    type="number"
                    value={deployConfig.memory}
                    onChange={(e) => setDeployConfig({ ...deployConfig, memory: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowDeployDialog(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleExecuteDeploy}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                开始部署
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 测试对话框 */}
      {showTestDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">测试函数</h3>
              <button
                onClick={() => setShowTestDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">测试参数 (JSON)</label>
                <textarea
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder='{ "message": "Hello, World!" }'
                />
              </div>
              
              {testResult && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">执行结果</label>
                  <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="text-sm">
                      <div className="font-medium mb-2">
                        状态: <span className={testResult.success ? 'text-green-600' : 'text-red-600'}>
                          {testResult.success ? '成功' : '失败'}
                        </span>
                      </div>
                      <div className="mb-2">耗时: {testResult.duration}ms</div>
                      {testResult.success && testResult.result && (
                        <div>
                          <div className="font-medium mb-1">返回结果:</div>
                          <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                            {JSON.stringify(testResult.result, null, 2)}
                          </pre>
                        </div>
                      )}
                      {!testResult.success && testResult.error && (
                        <div>
                          <div className="font-medium mb-1">错误信息:</div>
                          <div className="text-red-600">{testResult.error}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowTestDialog(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                关闭
              </button>
              <button
                onClick={handleExecuteTest}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                执行测试
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 部署进度提示 */}
      {deploymentProgress && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border p-4 max-w-sm">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">部署进度</h4>
            <button
              onClick={() => setDeploymentProgress(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{deploymentProgress.functionId}</span>
              <span className={`px-2 py-1 rounded text-xs ${
                deploymentProgress.status === 'success' ? 'bg-green-100 text-green-700' :
                deploymentProgress.status === 'failed' ? 'bg-red-100 text-red-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {deploymentProgress.status === 'success' ? '成功' :
                 deploymentProgress.status === 'failed' ? '失败' :
                 deploymentProgress.status === 'pending' ? '等待中' :
                 deploymentProgress.status === 'building' ? '构建中' :
                 deploymentProgress.status === 'uploading' ? '上传中' :
                 deploymentProgress.status === 'deploying' ? '部署中' : deploymentProgress.status}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  deploymentProgress.status === 'success' ? 'bg-green-500' :
                  deploymentProgress.status === 'failed' ? 'bg-red-500' :
                  'bg-blue-500'
                }`}
                style={{ width: `${deploymentProgress.progress}%` }}
              ></div>
            </div>
            
            {deploymentProgress.logs.length > 0 && (
              <div className="text-xs text-gray-500">
                {deploymentProgress.logs[deploymentProgress.logs.length - 1]}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudFunctions;
export type { CloudFunctionsProps };