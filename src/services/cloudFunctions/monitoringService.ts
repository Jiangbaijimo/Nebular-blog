/**
 * 云函数监控服务
 * 提供函数性能监控、日志分析、告警等功能
 */

interface FunctionMetrics {
  functionId: string;
  timestamp: string;
  invocations: number;
  errors: number;
  duration: number;
  memory: number;
  coldStarts: number;
  throttles: number;
  concurrency: number;
}

interface LogEntry {
  id: string;
  functionId: string;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  message: string;
  requestId?: string;
  duration?: number;
  memory?: number;
  metadata?: Record<string, any>;
}

interface Alert {
  id: string;
  functionId: string;
  type: 'error_rate' | 'duration' | 'memory' | 'invocations' | 'cold_starts';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  threshold: number;
  currentValue: number;
  triggeredAt: string;
  resolvedAt?: string;
  status: 'active' | 'resolved' | 'suppressed';
}

interface MonitoringRule {
  id: string;
  functionId: string;
  name: string;
  type: 'error_rate' | 'duration' | 'memory' | 'invocations' | 'cold_starts';
  condition: 'greater_than' | 'less_than' | 'equals';
  threshold: number;
  timeWindow: number; // 分钟
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  notifications: {
    email: boolean;
    webhook: boolean;
    sms: boolean;
  };
}

interface PerformanceReport {
  functionId: string;
  timeRange: {
    start: string;
    end: string;
  };
  summary: {
    totalInvocations: number;
    totalErrors: number;
    averageDuration: number;
    averageMemory: number;
    errorRate: number;
    coldStartRate: number;
  };
  trends: {
    invocations: Array<{ timestamp: string; value: number }>;
    errors: Array<{ timestamp: string; value: number }>;
    duration: Array<{ timestamp: string; value: number }>;
    memory: Array<{ timestamp: string; value: number }>;
  };
  topErrors: Array<{
    message: string;
    count: number;
    lastOccurred: string;
  }>;
  recommendations: string[];
}

class MonitoringService {
  private metrics: Map<string, FunctionMetrics[]> = new Map();
  private logs: Map<string, LogEntry[]> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private rules: Map<string, MonitoringRule> = new Map();
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;

  // 开始监控
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('开始监控云函数...');
    
    // 每分钟收集一次指标
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.checkAlerts();
    }, 60000);
    
    // 初始化模拟数据
    this.initializeMockData();
  }

  // 停止监控
  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    
    console.log('停止监控云函数');
  }

  // 收集指标
  private async collectMetrics(): Promise<void> {
    try {
      // 模拟收集指标数据
      const functionIds = ['func-1', 'func-2', 'func-3'];
      
      for (const functionId of functionIds) {
        const metrics: FunctionMetrics = {
          functionId,
          timestamp: new Date().toISOString(),
          invocations: Math.floor(Math.random() * 100),
          errors: Math.floor(Math.random() * 5),
          duration: Math.floor(Math.random() * 2000 + 500),
          memory: Math.floor(Math.random() * 200 + 100),
          coldStarts: Math.floor(Math.random() * 10),
          throttles: Math.floor(Math.random() * 2),
          concurrency: Math.floor(Math.random() * 50)
        };
        
        if (!this.metrics.has(functionId)) {
          this.metrics.set(functionId, []);
        }
        
        const functionMetrics = this.metrics.get(functionId)!;
        functionMetrics.push(metrics);
        
        // 保留最近24小时的数据
        const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
        this.metrics.set(
          functionId,
          functionMetrics.filter(m => new Date(m.timestamp) > cutoffTime)
        );
      }
    } catch (error) {
      console.error('收集指标失败:', error);
    }
  }

  // 检查告警
  private async checkAlerts(): Promise<void> {
    try {
      for (const [ruleId, rule] of this.rules.entries()) {
        if (!rule.enabled) continue;
        
        const recentMetrics = this.getRecentMetrics(rule.functionId, rule.timeWindow);
        if (recentMetrics.length === 0) continue;
        
        const currentValue = this.calculateMetricValue(recentMetrics, rule.type);
        const shouldTrigger = this.evaluateCondition(currentValue, rule.condition, rule.threshold);
        
        const existingAlert = Array.from(this.alerts.values())
          .find(a => a.functionId === rule.functionId && a.type === rule.type && a.status === 'active');
        
        if (shouldTrigger && !existingAlert) {
          // 触发新告警
          const alert: Alert = {
            id: `alert-${Date.now()}`,
            functionId: rule.functionId,
            type: rule.type,
            severity: rule.severity,
            title: `${rule.name} 告警`,
            message: this.generateAlertMessage(rule, currentValue),
            threshold: rule.threshold,
            currentValue,
            triggeredAt: new Date().toISOString(),
            status: 'active'
          };
          
          this.alerts.set(alert.id, alert);
          console.log('触发告警:', alert.title);
          
          // 发送通知
          this.sendNotification(alert, rule);
        } else if (!shouldTrigger && existingAlert) {
          // 解决告警
          existingAlert.status = 'resolved';
          existingAlert.resolvedAt = new Date().toISOString();
          console.log('告警已解决:', existingAlert.title);
        }
      }
    } catch (error) {
      console.error('检查告警失败:', error);
    }
  }

  // 获取最近的指标
  private getRecentMetrics(functionId: string, timeWindowMinutes: number): FunctionMetrics[] {
    const functionMetrics = this.metrics.get(functionId) || [];
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    
    return functionMetrics.filter(m => new Date(m.timestamp) > cutoffTime);
  }

  // 计算指标值
  private calculateMetricValue(metrics: FunctionMetrics[], type: string): number {
    if (metrics.length === 0) return 0;
    
    switch (type) {
      case 'error_rate':
        const totalInvocations = metrics.reduce((sum, m) => sum + m.invocations, 0);
        const totalErrors = metrics.reduce((sum, m) => sum + m.errors, 0);
        return totalInvocations > 0 ? (totalErrors / totalInvocations) * 100 : 0;
      
      case 'duration':
        return metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
      
      case 'memory':
        return metrics.reduce((sum, m) => sum + m.memory, 0) / metrics.length;
      
      case 'invocations':
        return metrics.reduce((sum, m) => sum + m.invocations, 0);
      
      case 'cold_starts':
        return metrics.reduce((sum, m) => sum + m.coldStarts, 0);
      
      default:
        return 0;
    }
  }

  // 评估条件
  private evaluateCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case 'greater_than':
        return value > threshold;
      case 'less_than':
        return value < threshold;
      case 'equals':
        return Math.abs(value - threshold) < 0.01;
      default:
        return false;
    }
  }

  // 生成告警消息
  private generateAlertMessage(rule: MonitoringRule, currentValue: number): string {
    const unit = this.getMetricUnit(rule.type);
    return `函数 ${rule.functionId} 的 ${rule.type} 当前值为 ${currentValue.toFixed(2)}${unit}，超过阈值 ${rule.threshold}${unit}`;
  }

  // 获取指标单位
  private getMetricUnit(type: string): string {
    switch (type) {
      case 'error_rate':
        return '%';
      case 'duration':
        return 'ms';
      case 'memory':
        return 'MB';
      case 'invocations':
      case 'cold_starts':
        return '';
      default:
        return '';
    }
  }

  // 发送通知
  private async sendNotification(alert: Alert, rule: MonitoringRule): Promise<void> {
    try {
      if (rule.notifications.email) {
        console.log('发送邮件通知:', alert.title);
        // 实际邮件发送逻辑
      }
      
      if (rule.notifications.webhook) {
        console.log('发送Webhook通知:', alert.title);
        // 实际Webhook发送逻辑
      }
      
      if (rule.notifications.sms) {
        console.log('发送短信通知:', alert.title);
        // 实际短信发送逻辑
      }
    } catch (error) {
      console.error('发送通知失败:', error);
    }
  }

  // 获取函数指标
  async getFunctionMetrics(
    functionId: string,
    timeRange: { start: string; end: string }
  ): Promise<FunctionMetrics[]> {
    const functionMetrics = this.metrics.get(functionId) || [];
    const startTime = new Date(timeRange.start);
    const endTime = new Date(timeRange.end);
    
    return functionMetrics.filter(m => {
      const timestamp = new Date(m.timestamp);
      return timestamp >= startTime && timestamp <= endTime;
    });
  }

  // 获取函数日志
  async getFunctionLogs(
    functionId: string,
    options: {
      level?: LogEntry['level'];
      limit?: number;
      startTime?: string;
      endTime?: string;
      search?: string;
    } = {}
  ): Promise<LogEntry[]> {
    let logs = this.logs.get(functionId) || [];
    
    // 按级别过滤
    if (options.level) {
      logs = logs.filter(log => log.level === options.level);
    }
    
    // 按时间范围过滤
    if (options.startTime) {
      const startTime = new Date(options.startTime);
      logs = logs.filter(log => new Date(log.timestamp) >= startTime);
    }
    
    if (options.endTime) {
      const endTime = new Date(options.endTime);
      logs = logs.filter(log => new Date(log.timestamp) <= endTime);
    }
    
    // 按关键词搜索
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      logs = logs.filter(log => 
        log.message.toLowerCase().includes(searchLower)
      );
    }
    
    // 限制数量
    if (options.limit) {
      logs = logs.slice(0, options.limit);
    }
    
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // 添加日志
  async addLog(log: Omit<LogEntry, 'id'>): Promise<void> {
    const logEntry: LogEntry = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    if (!this.logs.has(log.functionId)) {
      this.logs.set(log.functionId, []);
    }
    
    const functionLogs = this.logs.get(log.functionId)!;
    functionLogs.push(logEntry);
    
    // 保留最近1000条日志
    if (functionLogs.length > 1000) {
      this.logs.set(log.functionId, functionLogs.slice(-1000));
    }
  }

  // 获取告警
  async getAlerts(functionId?: string): Promise<Alert[]> {
    let alerts = Array.from(this.alerts.values());
    
    if (functionId) {
      alerts = alerts.filter(alert => alert.functionId === functionId);
    }
    
    return alerts.sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());
  }

  // 解决告警
  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (alert && alert.status === 'active') {
      alert.status = 'resolved';
      alert.resolvedAt = new Date().toISOString();
      console.log('手动解决告警:', alert.title);
    }
  }

  // 抑制告警
  async suppressAlert(alertId: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (alert && alert.status === 'active') {
      alert.status = 'suppressed';
      console.log('抑制告警:', alert.title);
    }
  }

  // 获取监控规则
  async getMonitoringRules(functionId?: string): Promise<MonitoringRule[]> {
    let rules = Array.from(this.rules.values());
    
    if (functionId) {
      rules = rules.filter(rule => rule.functionId === functionId);
    }
    
    return rules;
  }

  // 创建监控规则
  async createMonitoringRule(rule: Omit<MonitoringRule, 'id'>): Promise<MonitoringRule> {
    const newRule: MonitoringRule = {
      ...rule,
      id: `rule-${Date.now()}`
    };
    
    this.rules.set(newRule.id, newRule);
    console.log('创建监控规则:', newRule.name);
    
    return newRule;
  }

  // 更新监控规则
  async updateMonitoringRule(ruleId: string, updates: Partial<MonitoringRule>): Promise<MonitoringRule> {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error('监控规则不存在');
    }
    
    const updatedRule = { ...rule, ...updates, id: ruleId };
    this.rules.set(ruleId, updatedRule);
    
    console.log('更新监控规则:', updatedRule.name);
    return updatedRule;
  }

  // 删除监控规则
  async deleteMonitoringRule(ruleId: string): Promise<void> {
    const rule = this.rules.get(ruleId);
    if (rule) {
      this.rules.delete(ruleId);
      console.log('删除监控规则:', rule.name);
    }
  }

  // 生成性能报告
  async generatePerformanceReport(
    functionId: string,
    timeRange: { start: string; end: string }
  ): Promise<PerformanceReport> {
    const metrics = await this.getFunctionMetrics(functionId, timeRange);
    const logs = await this.getFunctionLogs(functionId, {
      startTime: timeRange.start,
      endTime: timeRange.end,
      level: 'ERROR'
    });
    
    // 计算汇总数据
    const totalInvocations = metrics.reduce((sum, m) => sum + m.invocations, 0);
    const totalErrors = metrics.reduce((sum, m) => sum + m.errors, 0);
    const averageDuration = metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length : 0;
    const averageMemory = metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.memory, 0) / metrics.length : 0;
    const totalColdStarts = metrics.reduce((sum, m) => sum + m.coldStarts, 0);
    
    // 生成趋势数据
    const trends = {
      invocations: metrics.map(m => ({ timestamp: m.timestamp, value: m.invocations })),
      errors: metrics.map(m => ({ timestamp: m.timestamp, value: m.errors })),
      duration: metrics.map(m => ({ timestamp: m.timestamp, value: m.duration })),
      memory: metrics.map(m => ({ timestamp: m.timestamp, value: m.memory }))
    };
    
    // 统计错误
    const errorCounts = new Map<string, number>();
    const errorLastOccurred = new Map<string, string>();
    
    logs.forEach(log => {
      const count = errorCounts.get(log.message) || 0;
      errorCounts.set(log.message, count + 1);
      
      const lastOccurred = errorLastOccurred.get(log.message);
      if (!lastOccurred || new Date(log.timestamp) > new Date(lastOccurred)) {
        errorLastOccurred.set(log.message, log.timestamp);
      }
    });
    
    const topErrors = Array.from(errorCounts.entries())
      .map(([message, count]) => ({
        message,
        count,
        lastOccurred: errorLastOccurred.get(message)!
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // 生成建议
    const recommendations = this.generateRecommendations({
      totalInvocations,
      totalErrors,
      averageDuration,
      averageMemory,
      errorRate: totalInvocations > 0 ? (totalErrors / totalInvocations) * 100 : 0,
      coldStartRate: totalInvocations > 0 ? (totalColdStarts / totalInvocations) * 100 : 0
    });
    
    return {
      functionId,
      timeRange,
      summary: {
        totalInvocations,
        totalErrors,
        averageDuration: Math.round(averageDuration),
        averageMemory: Math.round(averageMemory),
        errorRate: totalInvocations > 0 ? Math.round((totalErrors / totalInvocations) * 100 * 100) / 100 : 0,
        coldStartRate: totalInvocations > 0 ? Math.round((totalColdStarts / totalInvocations) * 100 * 100) / 100 : 0
      },
      trends,
      topErrors,
      recommendations
    };
  }

  // 生成优化建议
  private generateRecommendations(summary: PerformanceReport['summary']): string[] {
    const recommendations: string[] = [];
    
    if (summary.errorRate > 5) {
      recommendations.push('错误率较高，建议检查函数代码和错误处理逻辑');
    }
    
    if (summary.averageDuration > 5000) {
      recommendations.push('平均执行时间较长，建议优化算法或增加内存配置');
    }
    
    if (summary.coldStartRate > 20) {
      recommendations.push('冷启动率较高，建议使用预留并发或保持函数温热');
    }
    
    if (summary.averageMemory > 80) {
      recommendations.push('内存使用率较高，建议优化内存使用或增加内存配置');
    }
    
    if (summary.totalInvocations < 10) {
      recommendations.push('调用次数较少，可以考虑与其他函数合并以提高效率');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('函数性能表现良好，继续保持');
    }
    
    return recommendations;
  }

  // 初始化模拟数据
  private initializeMockData(): void {
    // 创建默认监控规则
    const defaultRules: Omit<MonitoringRule, 'id'>[] = [
      {
        functionId: 'func-1',
        name: '错误率告警',
        type: 'error_rate',
        condition: 'greater_than',
        threshold: 5,
        timeWindow: 5,
        severity: 'high',
        enabled: true,
        notifications: { email: true, webhook: false, sms: false }
      },
      {
        functionId: 'func-1',
        name: '执行时间告警',
        type: 'duration',
        condition: 'greater_than',
        threshold: 3000,
        timeWindow: 10,
        severity: 'medium',
        enabled: true,
        notifications: { email: true, webhook: true, sms: false }
      }
    ];
    
    defaultRules.forEach(rule => {
      this.createMonitoringRule(rule);
    });
    
    // 生成模拟日志
    this.generateMockLogs();
  }

  // 生成模拟日志
  private generateMockLogs(): void {
    const functionIds = ['func-1', 'func-2', 'func-3'];
    const levels: LogEntry['level'][] = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const messages = {
      DEBUG: ['函数开始执行', '参数验证通过', '调用外部API', '处理业务逻辑'],
      INFO: ['函数执行成功', '返回结果', '处理完成', '缓存更新'],
      WARN: ['参数格式警告', '性能警告', '内存使用警告', '超时警告'],
      ERROR: ['参数验证失败', '数据库连接失败', 'API调用失败', '业务逻辑错误']
    };
    
    functionIds.forEach(functionId => {
      const logs: LogEntry[] = [];
      
      for (let i = 0; i < 100; i++) {
        const level = levels[Math.floor(Math.random() * levels.length)];
        const messageList = messages[level];
        const message = messageList[Math.floor(Math.random() * messageList.length)];
        
        logs.push({
          id: `log-${functionId}-${i}`,
          functionId,
          timestamp: new Date(Date.now() - i * 60000).toISOString(),
          level,
          message,
          requestId: `req-${Math.random().toString(36).substr(2, 9)}`,
          duration: Math.floor(Math.random() * 2000 + 100),
          memory: Math.floor(Math.random() * 200 + 50)
        });
      }
      
      this.logs.set(functionId, logs);
    });
  }
}

// 导出单例实例
export const monitoringService = new MonitoringService();

export type {
  FunctionMetrics,
  LogEntry,
  Alert,
  MonitoringRule,
  PerformanceReport
};

export { MonitoringService };