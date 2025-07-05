import React, { useState, useEffect } from 'react';
import {
  Settings,
  Server,
  Database,
  Mail,
  Shield,
  Globe,
  Zap,
  Monitor,
  HardDrive,
  Network,
  Bell,
  Lock,
  Key,
  AlertTriangle,
  CheckCircle,
  Save,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  Plus,
  Edit,
  Eye,
  EyeOff,
  FileText,
  BarChart3,
  X
} from 'lucide-react';

interface SystemConfig {
  general: {
    siteName: string;
    siteUrl: string;
    adminEmail: string;
    timezone: string;
    language: string;
    maintenanceMode: boolean;
  };
  server: {
    port: number;
    host: string;
    ssl: boolean;
    maxConnections: number;
    timeout: number;
    compression: boolean;
  };
  database: {
    type: string;
    host: string;
    port: number;
    name: string;
    username: string;
    password: string;
    maxConnections: number;
    connectionTimeout: number;
  };
  email: {
    provider: string;
    host: string;
    port: number;
    username: string;
    password: string;
    encryption: string;
    fromName: string;
    fromEmail: string;
  };
  security: {
    jwtSecret: string;
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    passwordMinLength: number;
    requireSpecialChars: boolean;
    twoFactorAuth: boolean;
  };
  performance: {
    cacheEnabled: boolean;
    cacheTimeout: number;
    compressionLevel: number;
    maxFileSize: number;
    enableCdn: boolean;
    cdnUrl: string;
  };
  monitoring: {
    enableLogging: boolean;
    logLevel: string;
    enableMetrics: boolean;
    enableAlerts: boolean;
    alertEmail: string;
  };
}

const SystemSettings: React.FC = () => {
  const [config, setConfig] = useState<SystemConfig>({
    general: {
      siteName: '高性能博客系统',
      siteUrl: 'https://blog.example.com',
      adminEmail: 'admin@example.com',
      timezone: 'Asia/Shanghai',
      language: 'zh-CN',
      maintenanceMode: false
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      ssl: true,
      maxConnections: 1000,
      timeout: 30000,
      compression: true
    },
    database: {
      type: 'PostgreSQL',
      host: 'localhost',
      port: 5432,
      name: 'blog_db',
      username: 'blog_user',
      password: '********',
      maxConnections: 20,
      connectionTimeout: 5000
    },
    email: {
      provider: 'SMTP',
      host: 'smtp.gmail.com',
      port: 587,
      username: 'noreply@example.com',
      password: '********',
      encryption: 'TLS',
      fromName: '博客系统',
      fromEmail: 'noreply@example.com'
    },
    security: {
      jwtSecret: '********',
      sessionTimeout: 3600,
      maxLoginAttempts: 5,
      lockoutDuration: 900,
      passwordMinLength: 8,
      requireSpecialChars: true,
      twoFactorAuth: false
    },
    performance: {
      cacheEnabled: true,
      cacheTimeout: 3600,
      compressionLevel: 6,
      maxFileSize: 10,
      enableCdn: false,
      cdnUrl: ''
    },
    monitoring: {
      enableLogging: true,
      logLevel: 'info',
      enableMetrics: true,
      enableAlerts: true,
      alertEmail: 'admin@example.com'
    }
  });

  const [activeTab, setActiveTab] = useState<string>('general');
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    // 模拟加载配置
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  const handleConfigChange = (section: keyof SystemConfig, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setLoading(true);
    // 模拟保存配置
    await new Promise(resolve => setTimeout(resolve, 2000));
    setHasChanges(false);
    setLoading(false);
    // 显示成功消息
  };

  const handleReset = () => {
    loadConfig();
    setHasChanges(false);
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const tabs = [
    { id: 'general', name: '常规设置', icon: Settings },
    { id: 'server', name: '服务器', icon: Server },
    { id: 'database', name: '数据库', icon: Database },
    { id: 'email', name: '邮件', icon: Mail },
    { id: 'security', name: '安全', icon: Shield },
    { id: 'performance', name: '性能', icon: Zap },
    { id: 'monitoring', name: '监控', icon: Monitor }
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            网站名称
          </label>
          <input
            type="text"
            value={config.general.siteName}
            onChange={(e) => handleConfigChange('general', 'siteName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            网站URL
          </label>
          <input
            type="url"
            value={config.general.siteUrl}
            onChange={(e) => handleConfigChange('general', 'siteUrl', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            管理员邮箱
          </label>
          <input
            type="email"
            value={config.general.adminEmail}
            onChange={(e) => handleConfigChange('general', 'adminEmail', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            时区
          </label>
          <select
            value={config.general.timezone}
            onChange={(e) => handleConfigChange('general', 'timezone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Asia/Shanghai">Asia/Shanghai</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">America/New_York</option>
            <option value="Europe/London">Europe/London</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            语言
          </label>
          <select
            value={config.general.language}
            onChange={(e) => handleConfigChange('general', 'language', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="zh-CN">简体中文</option>
            <option value="en-US">English</option>
            <option value="ja-JP">日本語</option>
          </select>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="maintenanceMode"
            checked={config.general.maintenanceMode}
            onChange={(e) => handleConfigChange('general', 'maintenanceMode', e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label htmlFor="maintenanceMode" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            维护模式
          </label>
        </div>
      </div>
    </div>
  );

  const renderServerSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            端口
          </label>
          <input
            type="number"
            value={config.server.port}
            onChange={(e) => handleConfigChange('server', 'port', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            主机地址
          </label>
          <input
            type="text"
            value={config.server.host}
            onChange={(e) => handleConfigChange('server', 'host', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            最大连接数
          </label>
          <input
            type="number"
            value={config.server.maxConnections}
            onChange={(e) => handleConfigChange('server', 'maxConnections', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            超时时间 (ms)
          </label>
          <input
            type="number"
            value={config.server.timeout}
            onChange={(e) => handleConfigChange('server', 'timeout', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="ssl"
            checked={config.server.ssl}
            onChange={(e) => handleConfigChange('server', 'ssl', e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label htmlFor="ssl" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            启用SSL
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="compression"
            checked={config.server.compression}
            onChange={(e) => handleConfigChange('server', 'compression', e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label htmlFor="compression" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            启用压缩
          </label>
        </div>
      </div>
    </div>
  );

  const renderDatabaseSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            数据库类型
          </label>
          <select
            value={config.database.type}
            onChange={(e) => handleConfigChange('database', 'type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="PostgreSQL">PostgreSQL</option>
            <option value="MySQL">MySQL</option>
            <option value="SQLite">SQLite</option>
            <option value="MongoDB">MongoDB</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            主机地址
          </label>
          <input
            type="text"
            value={config.database.host}
            onChange={(e) => handleConfigChange('database', 'host', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            端口
          </label>
          <input
            type="number"
            value={config.database.port}
            onChange={(e) => handleConfigChange('database', 'port', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            数据库名
          </label>
          <input
            type="text"
            value={config.database.name}
            onChange={(e) => handleConfigChange('database', 'name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            用户名
          </label>
          <input
            type="text"
            value={config.database.username}
            onChange={(e) => handleConfigChange('database', 'username', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            密码
          </label>
          <div className="relative">
            <input
              type={showPasswords.dbPassword ? 'text' : 'password'}
              value={config.database.password}
              onChange={(e) => handleConfigChange('database', 'password', e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('dbPassword')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showPasswords.dbPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmailSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            邮件服务商
          </label>
          <select
            value={config.email.provider}
            onChange={(e) => handleConfigChange('email', 'provider', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="SMTP">SMTP</option>
            <option value="SendGrid">SendGrid</option>
            <option value="Mailgun">Mailgun</option>
            <option value="AWS SES">AWS SES</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            SMTP主机
          </label>
          <input
            type="text"
            value={config.email.host}
            onChange={(e) => handleConfigChange('email', 'host', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            端口
          </label>
          <input
            type="number"
            value={config.email.port}
            onChange={(e) => handleConfigChange('email', 'port', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            加密方式
          </label>
          <select
            value={config.email.encryption}
            onChange={(e) => handleConfigChange('email', 'encryption', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="TLS">TLS</option>
            <option value="SSL">SSL</option>
            <option value="None">无</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            用户名
          </label>
          <input
            type="text"
            value={config.email.username}
            onChange={(e) => handleConfigChange('email', 'username', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            密码
          </label>
          <div className="relative">
            <input
              type={showPasswords.emailPassword ? 'text' : 'password'}
              value={config.email.password}
              onChange={(e) => handleConfigChange('email', 'password', e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('emailPassword')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showPasswords.emailPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            发件人名称
          </label>
          <input
            type="text"
            value={config.email.fromName}
            onChange={(e) => handleConfigChange('email', 'fromName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            发件人邮箱
          </label>
          <input
            type="email"
            value={config.email.fromEmail}
            onChange={(e) => handleConfigChange('email', 'fromEmail', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            JWT密钥
          </label>
          <div className="relative">
            <input
              type={showPasswords.jwtSecret ? 'text' : 'password'}
              value={config.security.jwtSecret}
              onChange={(e) => handleConfigChange('security', 'jwtSecret', e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('jwtSecret')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showPasswords.jwtSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            会话超时 (秒)
          </label>
          <input
            type="number"
            value={config.security.sessionTimeout}
            onChange={(e) => handleConfigChange('security', 'sessionTimeout', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            最大登录尝试次数
          </label>
          <input
            type="number"
            value={config.security.maxLoginAttempts}
            onChange={(e) => handleConfigChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            锁定时长 (秒)
          </label>
          <input
            type="number"
            value={config.security.lockoutDuration}
            onChange={(e) => handleConfigChange('security', 'lockoutDuration', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            密码最小长度
          </label>
          <input
            type="number"
            value={config.security.passwordMinLength}
            onChange={(e) => handleConfigChange('security', 'passwordMinLength', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="requireSpecialChars"
              checked={config.security.requireSpecialChars}
              onChange={(e) => handleConfigChange('security', 'requireSpecialChars', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="requireSpecialChars" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              要求特殊字符
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="twoFactorAuth"
              checked={config.security.twoFactorAuth}
              onChange={(e) => handleConfigChange('security', 'twoFactorAuth', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="twoFactorAuth" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              启用双因子认证
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPerformanceSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            缓存超时 (秒)
          </label>
          <input
            type="number"
            value={config.performance.cacheTimeout}
            onChange={(e) => handleConfigChange('performance', 'cacheTimeout', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            压缩级别 (1-9)
          </label>
          <input
            type="number"
            min="1"
            max="9"
            value={config.performance.compressionLevel}
            onChange={(e) => handleConfigChange('performance', 'compressionLevel', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            最大文件大小 (MB)
          </label>
          <input
            type="number"
            value={config.performance.maxFileSize}
            onChange={(e) => handleConfigChange('performance', 'maxFileSize', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            CDN URL
          </label>
          <input
            type="url"
            value={config.performance.cdnUrl}
            onChange={(e) => handleConfigChange('performance', 'cdnUrl', e.target.value)}
            disabled={!config.performance.enableCdn}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
        </div>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="cacheEnabled"
              checked={config.performance.cacheEnabled}
              onChange={(e) => handleConfigChange('performance', 'cacheEnabled', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="cacheEnabled" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              启用缓存
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enableCdn"
              checked={config.performance.enableCdn}
              onChange={(e) => handleConfigChange('performance', 'enableCdn', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="enableCdn" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              启用CDN
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMonitoringSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            日志级别
          </label>
          <select
            value={config.monitoring.logLevel}
            onChange={(e) => handleConfigChange('monitoring', 'logLevel', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            告警邮箱
          </label>
          <input
            type="email"
            value={config.monitoring.alertEmail}
            onChange={(e) => handleConfigChange('monitoring', 'alertEmail', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enableLogging"
              checked={config.monitoring.enableLogging}
              onChange={(e) => handleConfigChange('monitoring', 'enableLogging', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="enableLogging" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              启用日志记录
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enableMetrics"
              checked={config.monitoring.enableMetrics}
              onChange={(e) => handleConfigChange('monitoring', 'enableMetrics', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="enableMetrics" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              启用性能指标
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enableAlerts"
              checked={config.monitoring.enableAlerts}
              onChange={(e) => handleConfigChange('monitoring', 'enableAlerts', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="enableAlerts" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              启用告警通知
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'server':
        return renderServerSettings();
      case 'database':
        return renderDatabaseSettings();
      case 'email':
        return renderEmailSettings();
      case 'security':
        return renderSecuritySettings();
      case 'performance':
        return renderPerformanceSettings();
      case 'monitoring':
        return renderMonitoringSettings();
      default:
        return renderGeneralSettings();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">系统设置</h1>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(8)].map((_, i) => (
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">系统设置</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            配置系统的各项参数和功能。
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">有未保存的更改</span>
            </div>
          )}
          <button
            onClick={handleReset}
            disabled={!hasChanges || loading}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            重置
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            保存设置
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
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

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;