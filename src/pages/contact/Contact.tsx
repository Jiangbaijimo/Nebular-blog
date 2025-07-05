/**
 * 联系页面组件
 * 提供联系表单、联系信息、地图等
 */

import React, { useState, useRef, useEffect } from 'react';
import { validateEmail, validatePhone } from '../../utils/validation';
import { formatDate } from '../../utils/dateUtils';

interface ContactForm {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  company?: string;
  budget?: string;
  timeline?: string;
  projectType?: string;
}

interface ContactInfo {
  type: 'email' | 'phone' | 'address' | 'social';
  label: string;
  value: string;
  link?: string;
  icon: string;
  description?: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface ContactProps {
  className?: string;
}

const Contact: React.FC<ContactProps> = ({ className = '' }) => {
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    company: '',
    budget: '',
    timeline: '',
    projectType: ''
  });
  
  const [errors, setErrors] = useState<Partial<ContactForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState('contact');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // 联系信息
  const contactInfo: ContactInfo[] = [
    {
      type: 'email',
      label: '邮箱',
      value: 'zhangsan@example.com',
      link: 'mailto:zhangsan@example.com',
      icon: '📧',
      description: '工作日24小时内回复'
    },
    {
      type: 'phone',
      label: '电话',
      value: '+86 138-0000-0000',
      link: 'tel:+8613800000000',
      icon: '📱',
      description: '工作时间：9:00-18:00'
    },
    {
      type: 'address',
      label: '地址',
      value: '北京市朝阳区xxx街道xxx号',
      icon: '📍',
      description: '欢迎预约面谈'
    },
    {
      type: 'social',
      label: '微信',
      value: 'zhangsan_dev',
      icon: '💬',
      description: '扫码添加微信'
    }
  ];

  // 常见问题
  const faqs: FAQ[] = [
    {
      id: '1',
      question: '项目开发周期一般多长？',
      answer: '项目周期取决于复杂度和需求范围。简单的网站通常需要2-4周，复杂的Web应用可能需要2-6个月。我会在项目开始前提供详细的时间规划。',
      category: '项目管理'
    },
    {
      id: '2',
      question: '如何收费？支持哪些付款方式？',
      answer: '收费方式灵活，可以按项目总价、按阶段付款或按小时计费。支持银行转账、支付宝、微信支付等多种付款方式。具体费用会根据项目需求进行评估。',
      category: '费用相关'
    },
    {
      id: '3',
      question: '提供哪些技术栈的开发服务？',
      answer: '主要专注于现代Web技术栈，包括React、Vue.js、Node.js、TypeScript等。同时也提供UI/UX设计、数据库设计、云服务部署等全栈服务。',
      category: '技术相关'
    },
    {
      id: '4',
      question: '项目完成后是否提供维护服务？',
      answer: '是的，我提供项目上线后的维护服务，包括bug修复、功能更新、性能优化等。维护期内会提供技术支持和必要的培训。',
      category: '售后服务'
    },
    {
      id: '5',
      question: '可以远程合作吗？',
      answer: '完全支持远程合作。我有丰富的远程工作经验，使用现代协作工具确保项目进度和沟通效率。定期会议和进度汇报让合作更加透明。',
      category: '合作方式'
    },
    {
      id: '6',
      question: '如何保证项目质量？',
      answer: '采用敏捷开发方法，定期交付可测试的版本。使用代码审查、自动化测试、持续集成等最佳实践确保代码质量。项目过程中会持续收集反馈并优化。',
      category: '质量保证'
    }
  ];

  // 项目类型选项
  const projectTypes = [
    { value: 'website', label: '企业网站' },
    { value: 'webapp', label: 'Web应用' },
    { value: 'ecommerce', label: '电商平台' },
    { value: 'blog', label: '博客系统' },
    { value: 'portfolio', label: '作品集网站' },
    { value: 'dashboard', label: '管理后台' },
    { value: 'api', label: 'API开发' },
    { value: 'mobile', label: '移动应用' },
    { value: 'other', label: '其他' }
  ];

  // 预算范围选项
  const budgetRanges = [
    { value: '5k-10k', label: '5千-1万' },
    { value: '10k-30k', label: '1万-3万' },
    { value: '30k-50k', label: '3万-5万' },
    { value: '50k-100k', label: '5万-10万' },
    { value: '100k+', label: '10万以上' },
    { value: 'discuss', label: '面议' }
  ];

  // 时间周期选项
  const timelineOptions = [
    { value: 'urgent', label: '紧急（1-2周）' },
    { value: 'normal', label: '正常（1-2个月）' },
    { value: 'flexible', label: '灵活（3个月以上）' },
    { value: 'discuss', label: '待商议' }
  ];

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Partial<ContactForm> = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入姓名';
    }

    if (!formData.email.trim()) {
      newErrors.email = '请输入邮箱';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = '请输入有效的手机号码';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = '请输入主题';
    }

    if (!formData.message.trim()) {
      newErrors.message = '请输入留言内容';
    } else if (formData.message.length < 10) {
      newErrors.message = '留言内容至少需要10个字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理表单输入
  const handleInputChange = (field: keyof ContactForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 这里应该调用实际的API
      console.log('提交表单数据:', formData);
      
      setSubmitStatus('success');
      
      // 重置表单
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        company: '',
        budget: '',
        timeline: '',
        projectType: ''
      });
      
    } catch (error) {
      console.error('提交失败:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 切换FAQ展开状态
  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  // 按分类分组FAQ
  const faqsByCategory = faqs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  return (
    <div className={`contact-page ${className}`}>
      {/* 页面头部 */}
      <div className="contact-header">
        <div className="header-container">
          <h1 className="page-title">联系我</h1>
          <p className="page-subtitle">
            有项目想法或合作意向？欢迎随时联系我，让我们一起创造优秀的产品。
          </p>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="contact-tabs">
        <div className="tabs-container">
          {[
            { id: 'contact', label: '联系表单' },
            { id: 'info', label: '联系信息' },
            { id: 'faq', label: '常见问题' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="contact-content">
        {/* 联系表单 */}
        {activeTab === 'contact' && (
          <div className="contact-form-section">
            <div className="form-container">
              <div className="form-header">
                <h2>发送消息</h2>
                <p>填写下面的表单，我会尽快回复您。</p>
              </div>

              <form ref={formRef} onSubmit={handleSubmit} className="contact-form">
                <div className="form-grid">
                  {/* 基本信息 */}
                  <div className="form-group">
                    <label htmlFor="name" className="form-label">
                      姓名 <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`form-input ${errors.name ? 'error' : ''}`}
                      placeholder="请输入您的姓名"
                    />
                    {errors.name && <span className="error-message">{errors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      邮箱 <span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`form-input ${errors.email ? 'error' : ''}`}
                      placeholder="请输入您的邮箱"
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone" className="form-label">手机号</label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`form-input ${errors.phone ? 'error' : ''}`}
                      placeholder="请输入您的手机号（可选）"
                    />
                    {errors.phone && <span className="error-message">{errors.phone}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="company" className="form-label">公司/组织</label>
                    <input
                      type="text"
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      className="form-input"
                      placeholder="请输入您的公司或组织（可选）"
                    />
                  </div>
                </div>

                {/* 项目信息 */}
                <div className="form-section">
                  <h3 className="section-title">项目信息</h3>
                  
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="projectType" className="form-label">项目类型</label>
                      <select
                        id="projectType"
                        value={formData.projectType}
                        onChange={(e) => handleInputChange('projectType', e.target.value)}
                        className="form-select"
                      >
                        <option value="">请选择项目类型</option>
                        {projectTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="budget" className="form-label">预算范围</label>
                      <select
                        id="budget"
                        value={formData.budget}
                        onChange={(e) => handleInputChange('budget', e.target.value)}
                        className="form-select"
                      >
                        <option value="">请选择预算范围</option>
                        {budgetRanges.map(range => (
                          <option key={range.value} value={range.value}>
                            {range.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="timeline" className="form-label">时间周期</label>
                      <select
                        id="timeline"
                        value={formData.timeline}
                        onChange={(e) => handleInputChange('timeline', e.target.value)}
                        className="form-select"
                      >
                        <option value="">请选择时间周期</option>
                        {timelineOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 主题和留言 */}
                <div className="form-group">
                  <label htmlFor="subject" className="form-label">
                    主题 <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    className={`form-input ${errors.subject ? 'error' : ''}`}
                    placeholder="请输入邮件主题"
                  />
                  {errors.subject && <span className="error-message">{errors.subject}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="message" className="form-label">
                    留言内容 <span className="required">*</span>
                  </label>
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    className={`form-textarea ${errors.message ? 'error' : ''}`}
                    placeholder="请详细描述您的需求、项目背景、期望等信息..."
                    rows={6}
                  />
                  {errors.message && <span className="error-message">{errors.message}</span>}
                  <div className="character-count">
                    {formData.message.length} / 1000
                  </div>
                </div>

                {/* 提交按钮 */}
                <div className="form-actions">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`submit-button ${isSubmitting ? 'loading' : ''}`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="loading-spinner"></span>
                        发送中...
                      </>
                    ) : (
                      '发送消息'
                    )}
                  </button>
                </div>

                {/* 提交状态 */}
                {submitStatus === 'success' && (
                  <div className="status-message success">
                    <span className="status-icon">✅</span>
                    消息发送成功！我会尽快回复您。
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="status-message error">
                    <span className="status-icon">❌</span>
                    发送失败，请稍后重试或直接发送邮件联系我。
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* 联系信息 */}
        {activeTab === 'info' && (
          <div className="contact-info-section">
            <div className="info-container">
              <div className="info-header">
                <h2>联系信息</h2>
                <p>多种方式联系我，选择最适合您的方式。</p>
              </div>

              <div className="contact-cards">
                {contactInfo.map((info, index) => (
                  <div key={index} className="contact-card">
                    <div className="card-icon">
                      <span>{info.icon}</span>
                    </div>
                    <div className="card-content">
                      <h3 className="card-title">{info.label}</h3>
                      <div className="card-value">
                        {info.link ? (
                          <a href={info.link} className="contact-link">
                            {info.value}
                          </a>
                        ) : (
                          <span>{info.value}</span>
                        )}
                      </div>
                      {info.description && (
                        <p className="card-description">{info.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* 工作时间 */}
              <div className="work-hours">
                <h3>工作时间</h3>
                <div className="hours-grid">
                  <div className="hours-item">
                    <span className="day">周一 - 周五</span>
                    <span className="time">9:00 - 18:00</span>
                  </div>
                  <div className="hours-item">
                    <span className="day">周六</span>
                    <span className="time">10:00 - 16:00</span>
                  </div>
                  <div className="hours-item">
                    <span className="day">周日</span>
                    <span className="time">休息</span>
                  </div>
                </div>
                <p className="hours-note">
                  紧急项目可以安排加班，具体时间可以协商。
                </p>
              </div>

              {/* 响应时间 */}
              <div className="response-times">
                <h3>响应时间</h3>
                <div className="response-grid">
                  <div className="response-item">
                    <span className="method">邮箱</span>
                    <span className="time">24小时内</span>
                  </div>
                  <div className="response-item">
                    <span className="method">电话</span>
                    <span className="time">工作时间内即时</span>
                  </div>
                  <div className="response-item">
                    <span className="method">微信</span>
                    <span className="time">12小时内</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 常见问题 */}
        {activeTab === 'faq' && (
          <div className="faq-section">
            <div className="faq-container">
              <div className="faq-header">
                <h2>常见问题</h2>
                <p>这里整理了一些客户经常询问的问题，希望能帮助您更好地了解我的服务。</p>
              </div>

              <div className="faq-content">
                {Object.entries(faqsByCategory).map(([category, categoryFAQs]) => (
                  <div key={category} className="faq-category">
                    <h3 className="category-title">{category}</h3>
                    <div className="faq-list">
                      {categoryFAQs.map(faq => (
                        <div key={faq.id} className="faq-item">
                          <button
                            className={`faq-question ${expandedFAQ === faq.id ? 'expanded' : ''}`}
                            onClick={() => toggleFAQ(faq.id)}
                          >
                            <span className="question-text">{faq.question}</span>
                            <span className="expand-icon">
                              {expandedFAQ === faq.id ? '−' : '+'}
                            </span>
                          </button>
                          {expandedFAQ === faq.id && (
                            <div className="faq-answer">
                              <p>{faq.answer}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* 更多问题 */}
              <div className="more-questions">
                <h3>还有其他问题？</h3>
                <p>如果您的问题没有在上面找到答案，欢迎直接联系我。</p>
                <button 
                  className="contact-button"
                  onClick={() => setActiveTab('contact')}
                >
                  发送消息
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Contact;
export type { 
  ContactForm, 
  ContactInfo, 
  FAQ, 
  ContactProps 
};