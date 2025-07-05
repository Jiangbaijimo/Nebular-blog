/**
 * 关于页面组件
 * 展示个人信息、技能、经历、联系方式等
 */

import React, { useState, useEffect, useRef } from 'react';
import ResponsiveImage from '../../components/common/ResponsiveImage';
import { formatDate } from '../../utils/dateUtils';

interface Skill {
  id: string;
  name: string;
  level: number; // 0-100
  category: string;
  icon?: string;
  color?: string;
  description?: string;
}

interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  achievements: string[];
  technologies: string[];
  logo?: string;
}

interface Education {
  id: string;
  degree: string;
  school: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  major: string;
  description?: string;
  logo?: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  image?: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  featured: boolean;
  status: 'completed' | 'in-progress' | 'planned';
}

interface SocialLink {
  id: string;
  name: string;
  url: string;
  icon: string;
  color: string;
}

interface AboutProps {
  className?: string;
}

const About: React.FC<AboutProps> = ({ className = '' }) => {
  const [activeSection, setActiveSection] = useState('intro');
  const [visibleSkills, setVisibleSkills] = useState<Set<string>>(new Set());
  const skillsRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<{ [key: string]: HTMLElement }>({});

  // 模拟数据
  const personalInfo = {
    name: '张三',
    title: '全栈开发工程师',
    avatar: '/images/avatar-large.jpg',
    bio: '热爱技术，专注于现代前端开发和用户体验设计。拥有5年以上的全栈开发经验，擅长React、Node.js、TypeScript等技术栈。',
    location: '北京，中国',
    email: 'zhangsan@example.com',
    phone: '+86 138-0000-0000',
    website: 'https://zhangsan.dev',
    yearsOfExperience: 5,
    projectsCompleted: 50,
    clientsSatisfied: 30
  };

  const skills: Skill[] = [
    // 前端技能
    { id: '1', name: 'React', level: 95, category: '前端框架', icon: '⚛️', color: '#61dafb' },
    { id: '2', name: 'Vue.js', level: 85, category: '前端框架', icon: '💚', color: '#4fc08d' },
    { id: '3', name: 'TypeScript', level: 90, category: '编程语言', icon: '🔷', color: '#3178c6' },
    { id: '4', name: 'JavaScript', level: 95, category: '编程语言', icon: '🟨', color: '#f7df1e' },
    { id: '5', name: 'HTML/CSS', level: 90, category: '前端基础', icon: '🎨', color: '#e34f26' },
    { id: '6', name: 'Sass/SCSS', level: 85, category: '前端基础', icon: '💄', color: '#cc6699' },
    
    // 后端技能
    { id: '7', name: 'Node.js', level: 88, category: '后端技术', icon: '🟢', color: '#339933' },
    { id: '8', name: 'Python', level: 80, category: '编程语言', icon: '🐍', color: '#3776ab' },
    { id: '9', name: 'Express.js', level: 85, category: '后端框架', icon: '🚀', color: '#000000' },
    { id: '10', name: 'MongoDB', level: 75, category: '数据库', icon: '🍃', color: '#47a248' },
    { id: '11', name: 'PostgreSQL', level: 70, category: '数据库', icon: '🐘', color: '#336791' },
    
    // 工具和其他
    { id: '12', name: 'Git', level: 90, category: '开发工具', icon: '📝', color: '#f05032' },
    { id: '13', name: 'Docker', level: 75, category: '开发工具', icon: '🐳', color: '#2496ed' },
    { id: '14', name: 'AWS', level: 70, category: '云服务', icon: '☁️', color: '#ff9900' },
    { id: '15', name: 'Figma', level: 80, category: '设计工具', icon: '🎨', color: '#f24e1e' }
  ];

  const experiences: Experience[] = [
    {
      id: '1',
      title: '高级前端工程师',
      company: '科技有限公司',
      location: '北京',
      startDate: '2022-03-01',
      endDate: undefined,
      current: true,
      description: '负责公司核心产品的前端开发，带领团队完成多个重要项目。',
      achievements: [
        '主导重构了公司主要产品的前端架构，性能提升40%',
        '建立了完善的前端开发规范和CI/CD流程',
        '指导和培训了5名初级开发者',
        '成功交付了3个大型项目，获得客户高度认可'
      ],
      technologies: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'AWS'],
      logo: '/images/company-1.jpg'
    },
    {
      id: '2',
      title: '前端工程师',
      company: '互联网公司',
      location: '上海',
      startDate: '2020-06-01',
      endDate: '2022-02-28',
      current: false,
      description: '参与多个Web应用的开发，专注于用户体验优化。',
      achievements: [
        '开发了公司官网和多个营销页面',
        '优化了页面加载速度，提升了50%的用户体验',
        '实现了响应式设计，支持多种设备',
        '参与了移动端App的混合开发'
      ],
      technologies: ['Vue.js', 'JavaScript', 'Sass', 'Webpack', 'Express.js'],
      logo: '/images/company-2.jpg'
    },
    {
      id: '3',
      title: '初级前端工程师',
      company: '创业公司',
      location: '深圳',
      startDate: '2019-07-01',
      endDate: '2020-05-31',
      current: false,
      description: '作为团队的第一个前端工程师，从零开始搭建前端体系。',
      achievements: [
        '独立完成了公司第一个Web应用的开发',
        '建立了前端开发的基础架构',
        '学习并掌握了现代前端开发技术栈',
        '与设计师和后端工程师紧密合作'
      ],
      technologies: ['HTML', 'CSS', 'JavaScript', 'jQuery', 'Bootstrap'],
      logo: '/images/company-3.jpg'
    }
  ];

  const education: Education[] = [
    {
      id: '1',
      degree: '计算机科学与技术学士',
      school: '清华大学',
      location: '北京',
      startDate: '2015-09-01',
      endDate: '2019-06-30',
      gpa: '3.8/4.0',
      major: '计算机科学与技术',
      description: '主修计算机科学基础课程，包括数据结构、算法、操作系统、数据库等。',
      logo: '/images/university.jpg'
    }
  ];

  const projects: Project[] = [
    {
      id: '1',
      name: '个人博客系统',
      description: '基于React和Node.js开发的全栈博客系统，支持Markdown编辑、评论、标签分类等功能。',
      image: '/images/project-blog.jpg',
      technologies: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'Express.js'],
      githubUrl: 'https://github.com/username/blog',
      liveUrl: 'https://blog.example.com',
      featured: true,
      status: 'completed'
    },
    {
      id: '2',
      name: '电商管理系统',
      description: '为中小企业开发的电商管理后台，包括商品管理、订单处理、数据分析等功能。',
      image: '/images/project-ecommerce.jpg',
      technologies: ['Vue.js', 'Element UI', 'Python', 'Django', 'PostgreSQL'],
      githubUrl: 'https://github.com/username/ecommerce',
      liveUrl: 'https://ecommerce.example.com',
      featured: true,
      status: 'completed'
    },
    {
      id: '3',
      name: '任务管理应用',
      description: '团队协作的任务管理工具，支持项目管理、时间追踪、团队沟通等功能。',
      image: '/images/project-task.jpg',
      technologies: ['React Native', 'Redux', 'Firebase', 'Node.js'],
      githubUrl: 'https://github.com/username/task-manager',
      featured: false,
      status: 'in-progress'
    }
  ];

  const socialLinks: SocialLink[] = [
    {
      id: '1',
      name: 'GitHub',
      url: 'https://github.com/username',
      icon: '🐙',
      color: '#333'
    },
    {
      id: '2',
      name: 'LinkedIn',
      url: 'https://linkedin.com/in/username',
      icon: '💼',
      color: '#0077b5'
    },
    {
      id: '3',
      name: 'Twitter',
      url: 'https://twitter.com/username',
      icon: '🐦',
      color: '#1da1f2'
    },
    {
      id: '4',
      name: '微信',
      url: '#',
      icon: '💬',
      color: '#07c160'
    },
    {
      id: '5',
      name: '邮箱',
      url: `mailto:${personalInfo.email}`,
      icon: '📧',
      color: '#ea4335'
    }
  ];

  // 监听滚动，更新当前活动的部分
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['intro', 'skills', 'experience', 'education', 'projects', 'contact'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = sectionsRef.current[section];
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 技能动画效果
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const skillId = entry.target.getAttribute('data-skill-id');
            if (skillId) {
              setVisibleSkills(prev => new Set([...prev, skillId]));
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    if (skillsRef.current) {
      const skillElements = skillsRef.current.querySelectorAll('.skill-item');
      skillElements.forEach(el => observer.observe(el));
    }

    return () => observer.disconnect();
  }, []);

  // 滚动到指定部分
  const scrollToSection = (sectionId: string) => {
    const element = sectionsRef.current[sectionId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 按分类分组技能
  const skillsByCategory = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <div className={`about-page ${className}`}>
      {/* 导航菜单 */}
      <nav className="about-nav">
        <div className="nav-container">
          {[
            { id: 'intro', label: '简介' },
            { id: 'skills', label: '技能' },
            { id: 'experience', label: '经历' },
            { id: 'education', label: '教育' },
            { id: 'projects', label: '项目' },
            { id: 'contact', label: '联系' }
          ].map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => scrollToSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* 个人简介 */}
      <section 
        className="intro-section"
        ref={el => el && (sectionsRef.current.intro = el)}
      >
        <div className="intro-container">
          <div className="intro-content">
            <div className="intro-text">
              <h1 className="intro-title">
                你好，我是 <span className="highlight">{personalInfo.name}</span>
              </h1>
              <h2 className="intro-subtitle">{personalInfo.title}</h2>
              <p className="intro-bio">{personalInfo.bio}</p>
              
              <div className="intro-stats">
                <div className="stat-item">
                  <span className="stat-number">{personalInfo.yearsOfExperience}+</span>
                  <span className="stat-label">年经验</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{personalInfo.projectsCompleted}+</span>
                  <span className="stat-label">项目完成</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{personalInfo.clientsSatisfied}+</span>
                  <span className="stat-label">客户满意</span>
                </div>
              </div>
              
              <div className="intro-actions">
                <button 
                  className="btn-primary"
                  onClick={() => scrollToSection('contact')}
                >
                  联系我
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => scrollToSection('projects')}
                >
                  查看作品
                </button>
              </div>
            </div>
            
            <div className="intro-image">
              <ResponsiveImage
                src={personalInfo.avatar}
                alt={personalInfo.name}
                preset="avatar"
                className="avatar-large"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 技能部分 */}
      <section 
        className="skills-section"
        ref={el => el && (sectionsRef.current.skills = el)}
      >
        <div className="section-container">
          <h2 className="section-title">技能专长</h2>
          <p className="section-subtitle">我掌握的技术栈和工具</p>
          
          <div className="skills-container" ref={skillsRef}>
            {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
              <div key={category} className="skill-category">
                <h3 className="category-title">{category}</h3>
                <div className="skills-grid">
                  {categorySkills.map(skill => (
                    <div 
                      key={skill.id}
                      className="skill-item"
                      data-skill-id={skill.id}
                      style={{ '--skill-color': skill.color } as React.CSSProperties}
                    >
                      <div className="skill-header">
                        <span className="skill-icon">{skill.icon}</span>
                        <span className="skill-name">{skill.name}</span>
                      </div>
                      <div className="skill-progress">
                        <div 
                          className="progress-bar"
                          style={{
                            width: visibleSkills.has(skill.id) ? `${skill.level}%` : '0%',
                            backgroundColor: skill.color
                          }}
                        />
                        <span className="skill-level">{skill.level}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 工作经历 */}
      <section 
        className="experience-section"
        ref={el => el && (sectionsRef.current.experience = el)}
      >
        <div className="section-container">
          <h2 className="section-title">工作经历</h2>
          <p className="section-subtitle">我的职业发展历程</p>
          
          <div className="timeline">
            {experiences.map((exp, index) => (
              <div key={exp.id} className="timeline-item">
                <div className="timeline-marker">
                  {exp.current && <div className="current-indicator" />}
                </div>
                
                <div className="timeline-content">
                  <div className="experience-header">
                    {exp.logo && (
                      <ResponsiveImage
                        src={exp.logo}
                        alt={exp.company}
                        className="company-logo"
                      />
                    )}
                    <div className="experience-info">
                      <h3 className="job-title">{exp.title}</h3>
                      <h4 className="company-name">{exp.company}</h4>
                      <div className="job-meta">
                        <span className="location">{exp.location}</span>
                        <span className="duration">
                          {formatDate(exp.startDate)} - {exp.current ? '至今' : formatDate(exp.endDate!)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="job-description">{exp.description}</p>
                  
                  <div className="achievements">
                    <h5>主要成就：</h5>
                    <ul>
                      {exp.achievements.map((achievement, i) => (
                        <li key={i}>{achievement}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="technologies">
                    <h5>使用技术：</h5>
                    <div className="tech-tags">
                      {exp.technologies.map(tech => (
                        <span key={tech} className="tech-tag">{tech}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 教育背景 */}
      <section 
        className="education-section"
        ref={el => el && (sectionsRef.current.education = el)}
      >
        <div className="section-container">
          <h2 className="section-title">教育背景</h2>
          <p className="section-subtitle">我的学习经历</p>
          
          <div className="education-list">
            {education.map(edu => (
              <div key={edu.id} className="education-item">
                {edu.logo && (
                  <ResponsiveImage
                    src={edu.logo}
                    alt={edu.school}
                    className="school-logo"
                  />
                )}
                <div className="education-content">
                  <h3 className="degree">{edu.degree}</h3>
                  <h4 className="school">{edu.school}</h4>
                  <div className="education-meta">
                    <span className="location">{edu.location}</span>
                    <span className="duration">
                      {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                    </span>
                    {edu.gpa && <span className="gpa">GPA: {edu.gpa}</span>}
                  </div>
                  <p className="major">专业：{edu.major}</p>
                  {edu.description && (
                    <p className="education-description">{edu.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 项目作品 */}
      <section 
        className="projects-section"
        ref={el => el && (sectionsRef.current.projects = el)}
      >
        <div className="section-container">
          <h2 className="section-title">项目作品</h2>
          <p className="section-subtitle">我参与开发的一些项目</p>
          
          <div className="projects-grid">
            {projects.map(project => (
              <div key={project.id} className={`project-card ${project.featured ? 'featured' : ''}`}>
                {project.image && (
                  <div className="project-image">
                    <ResponsiveImage
                      src={project.image}
                      alt={project.name}
                      className="project-img"
                    />
                    <div className="project-overlay">
                      <div className="project-links">
                        {project.githubUrl && (
                          <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="project-link">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                          </a>
                        )}
                        {project.liveUrl && (
                          <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="project-link">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15,3 21,3 21,9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="project-content">
                  <div className="project-header">
                    <h3 className="project-name">{project.name}</h3>
                    <span className={`project-status ${project.status}`}>
                      {project.status === 'completed' && '已完成'}
                      {project.status === 'in-progress' && '进行中'}
                      {project.status === 'planned' && '计划中'}
                    </span>
                  </div>
                  
                  <p className="project-description">{project.description}</p>
                  
                  <div className="project-technologies">
                    {project.technologies.map(tech => (
                      <span key={tech} className="tech-tag">{tech}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 联系方式 */}
      <section 
        className="contact-section"
        ref={el => el && (sectionsRef.current.contact = el)}
      >
        <div className="section-container">
          <h2 className="section-title">联系我</h2>
          <p className="section-subtitle">欢迎与我交流合作</p>
          
          <div className="contact-content">
            <div className="contact-info">
              <div className="contact-item">
                <span className="contact-icon">📍</span>
                <div className="contact-details">
                  <h4>位置</h4>
                  <p>{personalInfo.location}</p>
                </div>
              </div>
              
              <div className="contact-item">
                <span className="contact-icon">📧</span>
                <div className="contact-details">
                  <h4>邮箱</h4>
                  <p>
                    <a href={`mailto:${personalInfo.email}`}>{personalInfo.email}</a>
                  </p>
                </div>
              </div>
              
              <div className="contact-item">
                <span className="contact-icon">📱</span>
                <div className="contact-details">
                  <h4>电话</h4>
                  <p>
                    <a href={`tel:${personalInfo.phone}`}>{personalInfo.phone}</a>
                  </p>
                </div>
              </div>
              
              <div className="contact-item">
                <span className="contact-icon">🌐</span>
                <div className="contact-details">
                  <h4>网站</h4>
                  <p>
                    <a href={personalInfo.website} target="_blank" rel="noopener noreferrer">
                      {personalInfo.website}
                    </a>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="social-links">
              <h3>社交媒体</h3>
              <div className="social-grid">
                {socialLinks.map(link => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                    style={{ '--social-color': link.color } as React.CSSProperties}
                  >
                    <span className="social-icon">{link.icon}</span>
                    <span className="social-name">{link.name}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
export type { 
  Skill, 
  Experience, 
  Education, 
  Project, 
  SocialLink, 
  AboutProps 
};