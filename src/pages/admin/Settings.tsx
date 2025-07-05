/**
 * 网站设置组件
 * 提供网站配置、主题设置、SEO配置等功能
 */

import React, { useState, useEffect } from 'react';
import ResponsiveImage from '../../components/common/ResponsiveImage';

interface SiteSettings {
  // 基本设置
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  adminEmail: string;
  timezone: string;
  language: string;
  
  // 外观设置
  theme: string;
  logo?: string;
  favicon?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  
  // SEO设置
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords: string[];
  googleAnalytics?: string;
  baiduAnalytics?: string;
  
  // 社交媒体
  socialMedia: {
    github?: string;
    twitter?: string;
    linkedin?: string;
    weibo?: string;
    wechat?: string;
  };
  
  // 评论设置
  comments: {
    enabled: boolean;
    provider: 'built-in' | 'disqus' | 'gitalk' | 'valine';
    moderation: boolean;
    guestComments: boolean;
    config?: Record<string, any>;
  };
  
  // 邮件设置
  email: {
    provider: 'smtp' | 'sendgrid' | 'mailgun';
    config: Record<string, any>;
  };
  
  // 存储设置
  storage: {
    provider: 'local' | 'qiniu' | 'aliyun' | 'aws';
    config: Record<string, any>;
  };
  
  // 安全设置
  security: {
    enableHttps: boolean;
    enableCors: boolean;
    allowedOrigins: string[];
    rateLimiting: boolean;
    maxRequestsPerMinute: number;
  };
  
  // 性能设置
  performance: {
    enableCache: boolean;
    cacheExpiry: number;
    enableCompression: boolean;
    enableCdn: boolean;
    cdnUrl?: string;
  };
}

interface SettingsProps {
  className?: string;
}

const Settings: React.FC<SettingsProps> = ({ className = '' }) => {
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: '',
    siteDescription: '',
    siteUrl: '',
    adminEmail: '',
    timezone: 'Asia/Shanghai',
    language: 'zh-CN',
    theme: 'default',
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
    fontFamily: 'system-ui',
    seoKeywords: [],
    socialMedia: {},
    comments: {
      enabled: true,
      provider: 'built-in',
      moderation: true,
      guestComments: false
    },
    email: {
      provider: 'smtp',
      config: {}
    },
    storage: {
      provider: 'local',
      config: {}
    },
    security: {
      enableHttps: true,
      enableCors: true,
      allowedOrigins: [],
      rateLimiting: true,
      maxRequestsPerMinute: 100
    },
    performance: {
      enableCache: true,
      cacheExpiry: 3600,
      enableCompression: true,
      enableCdn: false
    }
  });
  
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [keywordInput, setKeywordInput] = useState('');
  const [originInput, setOriginInput] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingStorage, setTestingStorage] = useState(false);

  // 可用主题
  const themes = [
    { id: 'default', name: '默认主题', preview: '/images/theme-default.jpg' },
    { id: 'dark', name: '深色主题', preview: '/images/theme-dark.jpg' },
    { id: 'minimal', name: '简约主题', preview: '/images/theme-minimal.jpg' },
    { id: 'magazine', name: '杂志主题', preview: '/images/theme-magazine.jpg' }
  ];

  // 可用字体
  const fonts = [
    { id: 'system-ui', name: '系统字体' },
    { id: 'Inter', name: 'Inter' },
    { id: 'Roboto', name: 'Roboto' },
    { id: 'Source Sans Pro', name: 'Source Sans Pro' },
    { id: 'Noto Sans SC', name: 'Noto Sans SC' }
  ];

  // 时区选项
  const timezones = [
    { id: 'Asia/Shanghai', name: '北京时间 (UTC+8)' },
    { id: 'America/New_York', name: '纽约时间 (UTC-5)' },
    { id: 'Europe/London', name: '伦敦时间 (UTC+0)' },
    { id: 'Asia/Tokyo', name: '东京时间 (UTC+9)' }
  ];

  // 语言选项
  const languages = [
    { id: 'zh-CN', name: '简体中文' },
    { id: 'en-US', name: 'English' },
    { id: 'ja-JP', name: '日本語' },
    { id: 'ko-KR', name: '한국어' }
  ];

  // 加载设置
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟加载的设置数据
      const mockSettings: SiteSettings = {
        siteName: '我的博客',
        siteDescription: '分享技术与生活的个人博客',
        siteUrl: 'https://myblog.com',
        adminEmail: 'admin@myblog.com',
        timezone: 'Asia/Shanghai',
        language: 'zh-CN',
        theme: 'default',
        logo: '/images/logo.png',
        favicon: '/images/favicon.ico',
        primaryColor: '#3b82f6',
        secondaryColor: '#64748b',
        fontFamily: 'system-ui',
        seoTitle: '我的博客 - 技术分享与生活记录',
        seoDescription: '这是一个专注于技术分享和生活记录的个人博客',
        seoKeywords: ['博客', '技术', '编程', '生活'],
        googleAnalytics: 'GA-XXXXXXXXX',
        socialMedia: {
          github: 'https://github.com/username',
          twitter: 'https://twitter.com/username',
          linkedin: 'https://linkedin.com/in/username'
        },
        comments: {
          enabled: true,
          provider: 'built-in',
          moderation: true,
          guestComments: false
        },
        email: {
          provider: 'smtp',
          config: {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            user: 'your-email@gmail.com',
            pass: ''
          }
        },
        storage: {
          provider: 'local',
          config: {}
        },
        security: {
          enableHttps: true,
          enableCors: true,
          allowedOrigins: ['https://myblog.com'],
          rateLimiting: true,
          maxRequestsPerMinute: 100
        },
        performance: {
          enableCache: true,
          cacheExpiry: 3600,
          enableCompression: true,
          enableCdn: false
        }
      };
      
      setSettings(mockSettings);
    } catch (error) {
      console.error('加载设置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 保存设置
  const saveSettings = async () => {
    setSaving(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('保存设置:', settings);
      alert('设置保存成功！');
    } catch (error) {
      console.error('保存设置失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // 测试邮件配置
  const testEmailConfig = async () => {
    setTestingEmail(true);
    try {
      // 模拟测试邮件发送
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('测试邮件发送成功！');
    } catch (error) {
      console.error('邮件测试失败:', error);
      alert('邮件测试失败，请检查配置');
    } finally {
      setTestingEmail(false);
    }
  };

  // 测试存储配置
  const testStorageConfig = async () => {
    setTestingStorage(true);
    try {
      // 模拟测试存储连接
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('存储连接测试成功！');
    } catch (error) {
      console.error('存储测试失败:', error);
      alert('存储测试失败，请检查配置');
    } finally {
      setTestingStorage(false);
    }
  };

  // 添加SEO关键词
  const addKeyword = () => {
    const keyword = keywordInput.trim();
    if (keyword && !settings.seoKeywords.includes(keyword)) {
      setSettings(prev => ({
        ...prev,
        seoKeywords: [...prev.seoKeywords, keyword]
      }));
      setKeywordInput('');
    }
  };

  // 删除SEO关键词
  const removeKeyword = (keywordToRemove: string) => {
    setSettings(prev => ({
      ...prev,
      seoKeywords: prev.seoKeywords.filter(keyword => keyword !== keywordToRemove)
    }));
  };

  // 添加允许的来源
  const addOrigin = () => {
    const origin = originInput.trim();
    if (origin && !settings.security.allowedOrigins.includes(origin)) {
      setSettings(prev => ({
        ...prev,
        security: {
          ...prev.security,
          allowedOrigins: [...prev.security.allowedOrigins, origin]
        }
      }));
      setOriginInput('');
    }
  };

  // 删除允许的来源
  const removeOrigin = (originToRemove: string) => {
    setSettings(prev => ({
      ...prev,
      security: {
        ...prev.security,
        allowedOrigins: prev.security.allowedOrigins.filter(origin => origin !== originToRemove)
      }
    }));
  };

  if (loading) {
    return (
      <div className={`settings-loading ${className}`}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载设置...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`settings ${className}`}>
      {/* 头部 */}
      <div className="settings-header">
        <h1>网站设置</h1>
        <button 
          className="btn-primary"
          onClick={saveSettings}
          disabled={saving}
        >
          {saving ? '保存中...' : '保存设置'}
        </button>
      </div>

      {/* 标签页导航 */}
      <div className="settings-tabs">
        <button 
          className={`tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
          onClick={() => setActiveTab('basic')}
        >
          基本设置
        </button>
        
        <button 
          className={`tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
          onClick={() => setActiveTab('appearance')}
        >
          外观设置
        </button>
        
        <button 
          className={`tab-btn ${activeTab === 'seo' ? 'active' : ''}`}
          onClick={() => setActiveTab('seo')}
        >
          SEO设置
        </button>
        
        <button 
          className={`tab-btn ${activeTab === 'social' ? 'active' : ''}`}
          onClick={() => setActiveTab('social')}
        >
          社交媒体
        </button>
        
        <button 
          className={`tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          评论设置
        </button>
        
        <button 
          className={`tab-btn ${activeTab === 'email' ? 'active' : ''}`}
          onClick={() => setActiveTab('email')}
        >
          邮件设置
        </button>
        
        <button 
          className={`tab-btn ${activeTab === 'storage' ? 'active' : ''}`}
          onClick={() => setActiveTab('storage')}
        >
          存储设置
        </button>
        
        <button 
          className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          安全设置
        </button>
        
        <button 
          className={`tab-btn ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          性能设置
        </button>
      </div>

      {/* 设置内容 */}
      <div className="settings-content">
        {/* 基本设置 */}
        {activeTab === 'basic' && (
          <div className="settings-section">
            <h2>基本设置</h2>
            
            <div className="form-group">
              <label>网站名称</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings(prev => ({ ...prev, siteName: e.target.value }))}
                placeholder="输入网站名称"
              />
            </div>
            
            <div className="form-group">
              <label>网站描述</label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) => setSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                placeholder="输入网站描述"
                rows={3}
              />
            </div>
            
            <div className="form-group">
              <label>网站URL</label>
              <input
                type="url"
                value={settings.siteUrl}
                onChange={(e) => setSettings(prev => ({ ...prev, siteUrl: e.target.value }))}
                placeholder="https://example.com"
              />
            </div>
            
            <div className="form-group">
              <label>管理员邮箱</label>
              <input
                type="email"
                value={settings.adminEmail}
                onChange={(e) => setSettings(prev => ({ ...prev, adminEmail: e.target.value }))}
                placeholder="admin@example.com"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>时区</label>
                <select 
                  value={settings.timezone}
                  onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
                >
                  {timezones.map(tz => (
                    <option key={tz.id} value={tz.id}>{tz.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>语言</label>
                <select 
                  value={settings.language}
                  onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                >
                  {languages.map(lang => (
                    <option key={lang.id} value={lang.id}>{lang.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 外观设置 */}
        {activeTab === 'appearance' && (
          <div className="settings-section">
            <h2>外观设置</h2>
            
            {/* 主题选择 */}
            <div className="form-group">
              <label>主题</label>
              <div className="theme-grid">
                {themes.map(theme => (
                  <div 
                    key={theme.id}
                    className={`theme-item ${settings.theme === theme.id ? 'selected' : ''}`}
                    onClick={() => setSettings(prev => ({ ...prev, theme: theme.id }))}
                  >
                    <div className="theme-preview">
                      <ResponsiveImage
                        src={theme.preview}
                        alt={theme.name}
                        className="theme-image"
                      />
                    </div>
                    <div className="theme-name">{theme.name}</div>
                    {settings.theme === theme.id && (
                      <div className="theme-selected">✓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Logo和Favicon */}
            <div className="form-row">
              <div className="form-group">
                <label>Logo</label>
                <div className="file-upload">
                  {settings.logo ? (
                    <div className="uploaded-file">
                      <ResponsiveImage
                        src={settings.logo}
                        alt="Logo"
                        className="logo-preview"
                      />
                      <button 
                        className="remove-file"
                        onClick={() => setSettings(prev => ({ ...prev, logo: undefined }))}
                      >
                        删除
                      </button>
                    </div>
                  ) : (
                    <button className="upload-btn">
                      上传Logo
                    </button>
                  )}
                </div>
              </div>
              
              <div className="form-group">
                <label>Favicon</label>
                <div className="file-upload">
                  {settings.favicon ? (
                    <div className="uploaded-file">
                      <img src={settings.favicon} alt="Favicon" className="favicon-preview" />
                      <button 
                        className="remove-file"
                        onClick={() => setSettings(prev => ({ ...prev, favicon: undefined }))}
                      >
                        删除
                      </button>
                    </div>
                  ) : (
                    <button className="upload-btn">
                      上传Favicon
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* 颜色设置 */}
            <div className="form-row">
              <div className="form-group">
                <label>主色调</label>
                <div className="color-input">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                  />
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>辅助色</label>
                <div className="color-input">
                  <input
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                  />
                  <input
                    type="text"
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    placeholder="#64748b"
                  />
                </div>
              </div>
            </div>
            
            {/* 字体设置 */}
            <div className="form-group">
              <label>字体</label>
              <select 
                value={settings.fontFamily}
                onChange={(e) => setSettings(prev => ({ ...prev, fontFamily: e.target.value }))}
              >
                {fonts.map(font => (
                  <option key={font.id} value={font.id}>{font.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* SEO设置 */}
        {activeTab === 'seo' && (
          <div className="settings-section">
            <h2>SEO设置</h2>
            
            <div className="form-group">
              <label>SEO标题</label>
              <input
                type="text"
                value={settings.seoTitle || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, seoTitle: e.target.value }))}
                placeholder="留空使用网站名称"
              />
            </div>
            
            <div className="form-group">
              <label>SEO描述</label>
              <textarea
                value={settings.seoDescription || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, seoDescription: e.target.value }))}
                placeholder="留空使用网站描述"
                rows={3}
              />
            </div>
            
            <div className="form-group">
              <label>关键词</label>
              <div className="keyword-input-container">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  placeholder="输入关键词后按回车"
                />
                <button onClick={addKeyword}>添加</button>
              </div>
              <div className="keywords-list">
                {settings.seoKeywords.map(keyword => (
                  <span key={keyword} className="keyword">
                    {keyword}
                    <button onClick={() => removeKeyword(keyword)}>×</button>
                  </span>
                ))}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Google Analytics ID</label>
                <input
                  type="text"
                  value={settings.googleAnalytics || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, googleAnalytics: e.target.value }))}
                  placeholder="GA-XXXXXXXXX"
                />
              </div>
              
              <div className="form-group">
                <label>百度统计ID</label>
                <input
                  type="text"
                  value={settings.baiduAnalytics || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, baiduAnalytics: e.target.value }))}
                  placeholder="百度统计代码"
                />
              </div>
            </div>
          </div>
        )}

        {/* 社交媒体 */}
        {activeTab === 'social' && (
          <div className="settings-section">
            <h2>社交媒体</h2>
            
            <div className="form-group">
              <label>GitHub</label>
              <input
                type="url"
                value={settings.socialMedia.github || ''}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  socialMedia: { ...prev.socialMedia, github: e.target.value }
                }))}
                placeholder="https://github.com/username"
              />
            </div>
            
            <div className="form-group">
              <label>Twitter</label>
              <input
                type="url"
                value={settings.socialMedia.twitter || ''}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  socialMedia: { ...prev.socialMedia, twitter: e.target.value }
                }))}
                placeholder="https://twitter.com/username"
              />
            </div>
            
            <div className="form-group">
              <label>LinkedIn</label>
              <input
                type="url"
                value={settings.socialMedia.linkedin || ''}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  socialMedia: { ...prev.socialMedia, linkedin: e.target.value }
                }))}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
            
            <div className="form-group">
              <label>微博</label>
              <input
                type="url"
                value={settings.socialMedia.weibo || ''}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  socialMedia: { ...prev.socialMedia, weibo: e.target.value }
                }))}
                placeholder="https://weibo.com/username"
              />
            </div>
            
            <div className="form-group">
              <label>微信</label>
              <input
                type="text"
                value={settings.socialMedia.wechat || ''}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  socialMedia: { ...prev.socialMedia, wechat: e.target.value }
                }))}
                placeholder="微信号或二维码图片URL"
              />
            </div>
          </div>
        )}

        {/* 评论设置 */}
        {activeTab === 'comments' && (
          <div className="settings-section">
            <h2>评论设置</h2>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.comments.enabled}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    comments: { ...prev.comments, enabled: e.target.checked }
                  }))}
                />
                启用评论功能
              </label>
            </div>
            
            {settings.comments.enabled && (
              <>
                <div className="form-group">
                  <label>评论服务商</label>
                  <select 
                    value={settings.comments.provider}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      comments: { ...prev.comments, provider: e.target.value as any }
                    }))}
                  >
                    <option value="built-in">内置评论</option>
                    <option value="disqus">Disqus</option>
                    <option value="gitalk">Gitalk</option>
                    <option value="valine">Valine</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={settings.comments.moderation}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        comments: { ...prev.comments, moderation: e.target.checked }
                      }))}
                    />
                    评论需要审核
                  </label>
                </div>
                
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={settings.comments.guestComments}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        comments: { ...prev.comments, guestComments: e.target.checked }
                      }))}
                    />
                    允许游客评论
                  </label>
                </div>
              </>
            )}
          </div>
        )}

        {/* 邮件设置 */}
        {activeTab === 'email' && (
          <div className="settings-section">
            <h2>邮件设置</h2>
            
            <div className="form-group">
              <label>邮件服务商</label>
              <select 
                value={settings.email.provider}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  email: { ...prev.email, provider: e.target.value as any }
                }))}
              >
                <option value="smtp">SMTP</option>
                <option value="sendgrid">SendGrid</option>
                <option value="mailgun">Mailgun</option>
              </select>
            </div>
            
            {settings.email.provider === 'smtp' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>SMTP主机</label>
                    <input
                      type="text"
                      value={settings.email.config.host || ''}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        email: {
                          ...prev.email,
                          config: { ...prev.email.config, host: e.target.value }
                        }
                      }))}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>端口</label>
                    <input
                      type="number"
                      value={settings.email.config.port || ''}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        email: {
                          ...prev.email,
                          config: { ...prev.email.config, port: parseInt(e.target.value) }
                        }
                      }))}
                      placeholder="587"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={settings.email.config.secure || false}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        email: {
                          ...prev.email,
                          config: { ...prev.email.config, secure: e.target.checked }
                        }
                      }))}
                    />
                    使用SSL/TLS
                  </label>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>用户名</label>
                    <input
                      type="text"
                      value={settings.email.config.user || ''}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        email: {
                          ...prev.email,
                          config: { ...prev.email.config, user: e.target.value }
                        }
                      }))}
                      placeholder="your-email@gmail.com"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>密码</label>
                    <input
                      type="password"
                      value={settings.email.config.pass || ''}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        email: {
                          ...prev.email,
                          config: { ...prev.email.config, pass: e.target.value }
                        }
                      }))}
                      placeholder="应用密码"
                    />
                  </div>
                </div>
              </>
            )}
            
            <div className="form-actions">
              <button 
                className="btn-secondary"
                onClick={testEmailConfig}
                disabled={testingEmail}
              >
                {testingEmail ? '测试中...' : '测试邮件配置'}
              </button>
            </div>
          </div>
        )}

        {/* 存储设置 */}
        {activeTab === 'storage' && (
          <div className="settings-section">
            <h2>存储设置</h2>
            
            <div className="form-group">
              <label>存储服务商</label>
              <select 
                value={settings.storage.provider}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  storage: { ...prev.storage, provider: e.target.value as any }
                }))}
              >
                <option value="local">本地存储</option>
                <option value="qiniu">七牛云</option>
                <option value="aliyun">阿里云OSS</option>
                <option value="aws">AWS S3</option>
              </select>
            </div>
            
            {settings.storage.provider !== 'local' && (
              <div className="storage-config">
                <p>请配置相应的存储服务参数</p>
                {/* 这里可以根据不同的存储服务商显示不同的配置项 */}
              </div>
            )}
            
            <div className="form-actions">
              <button 
                className="btn-secondary"
                onClick={testStorageConfig}
                disabled={testingStorage}
              >
                {testingStorage ? '测试中...' : '测试存储连接'}
              </button>
            </div>
          </div>
        )}

        {/* 安全设置 */}
        {activeTab === 'security' && (
          <div className="settings-section">
            <h2>安全设置</h2>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.security.enableHttps}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    security: { ...prev.security, enableHttps: e.target.checked }
                  }))}
                />
                强制使用HTTPS
              </label>
            </div>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.security.enableCors}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    security: { ...prev.security, enableCors: e.target.checked }
                  }))}
                />
                启用CORS
              </label>
            </div>
            
            {settings.security.enableCors && (
              <div className="form-group">
                <label>允许的来源</label>
                <div className="origin-input-container">
                  <input
                    type="text"
                    value={originInput}
                    onChange={(e) => setOriginInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOrigin())}
                    placeholder="输入域名后按回车"
                  />
                  <button onClick={addOrigin}>添加</button>
                </div>
                <div className="origins-list">
                  {settings.security.allowedOrigins.map(origin => (
                    <span key={origin} className="origin">
                      {origin}
                      <button onClick={() => removeOrigin(origin)}>×</button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.security.rateLimiting}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    security: { ...prev.security, rateLimiting: e.target.checked }
                  }))}
                />
                启用请求频率限制
              </label>
            </div>
            
            {settings.security.rateLimiting && (
              <div className="form-group">
                <label>每分钟最大请求数</label>
                <input
                  type="number"
                  value={settings.security.maxRequestsPerMinute}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    security: { ...prev.security, maxRequestsPerMinute: parseInt(e.target.value) }
                  }))}
                  min="1"
                  max="1000"
                />
              </div>
            )}
          </div>
        )}

        {/* 性能设置 */}
        {activeTab === 'performance' && (
          <div className="settings-section">
            <h2>性能设置</h2>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.performance.enableCache}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    performance: { ...prev.performance, enableCache: e.target.checked }
                  }))}
                />
                启用缓存
              </label>
            </div>
            
            {settings.performance.enableCache && (
              <div className="form-group">
                <label>缓存过期时间（秒）</label>
                <input
                  type="number"
                  value={settings.performance.cacheExpiry}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    performance: { ...prev.performance, cacheExpiry: parseInt(e.target.value) }
                  }))}
                  min="60"
                  max="86400"
                />
              </div>
            )}
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.performance.enableCompression}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    performance: { ...prev.performance, enableCompression: e.target.checked }
                  }))}
                />
                启用Gzip压缩
              </label>
            </div>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.performance.enableCdn}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    performance: { ...prev.performance, enableCdn: e.target.checked }
                  }))}
                />
                启用CDN
              </label>
            </div>
            
            {settings.performance.enableCdn && (
              <div className="form-group">
                <label>CDN URL</label>
                <input
                  type="url"
                  value={settings.performance.cdnUrl || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    performance: { ...prev.performance, cdnUrl: e.target.value }
                  }))}
                  placeholder="https://cdn.example.com"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
export type {
  SiteSettings,
  SettingsProps
};