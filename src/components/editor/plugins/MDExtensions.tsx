import React, { useState, useCallback } from 'react';
import { useEditor } from '../core/EditorProvider';
import { Button } from '../../ui/Button';
import { Dropdown } from '../../ui/Dropdown';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';
import { Tooltip } from '../../ui/Tooltip';
import {
  Info,
  AlertTriangle,
  Code2,
  Clock,
  Video,
  Music,
  Calculator,
  Zap,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  XCircle,
  Star,
  Heart,
  Bookmark,
  Tag,
  Calendar,
  MapPin,
  User,
  Mail,
  Phone,
  Globe,
  Github,
  Twitter,
  Linkedin,
  Youtube,
  Instagram,
  Facebook
} from 'lucide-react';

// 扩展语法类型
type ExtensionType = 
  | 'tip' 
  | 'warning' 
  | 'danger' 
  | 'info' 
  | 'success'
  | 'code-group'
  | 'timeline'
  | 'card'
  | 'badge'
  | 'button'
  | 'tabs'
  | 'collapse'
  | 'math'
  | 'mermaid'
  | 'video'
  | 'audio'
  | 'social'
  | 'contact';

// 扩展配置接口
interface ExtensionConfig {
  type: ExtensionType;
  title: string;
  icon: React.ReactNode;
  description: string;
  template: string;
  hasModal?: boolean;
  modalFields?: ModalField[];
}

// 模态框字段接口
interface ModalField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: string;
}

// 扩展配置
const extensionConfigs: ExtensionConfig[] = [
  {
    type: 'tip',
    title: '提示框',
    icon: <Lightbulb className="w-4 h-4" />,
    description: '插入提示信息框',
    template: ':::tip 提示\n这是一个提示信息\n:::'
  },
  {
    type: 'warning',
    title: '警告框',
    icon: <AlertTriangle className="w-4 h-4" />,
    description: '插入警告信息框',
    template: ':::warning 警告\n这是一个警告信息\n:::'
  },
  {
    type: 'danger',
    title: '危险框',
    icon: <XCircle className="w-4 h-4" />,
    description: '插入危险信息框',
    template: ':::danger 危险\n这是一个危险信息\n:::'
  },
  {
    type: 'info',
    title: '信息框',
    icon: <Info className="w-4 h-4" />,
    description: '插入信息框',
    template: ':::info 信息\n这是一个信息提示\n:::'
  },
  {
    type: 'success',
    title: '成功框',
    icon: <CheckCircle className="w-4 h-4" />,
    description: '插入成功信息框',
    template: ':::success 成功\n操作成功完成\n:::'
  },
  {
    type: 'code-group',
    title: '代码组',
    icon: <Code2 className="w-4 h-4" />,
    description: '插入多语言代码组',
    template: `:::code-group

\`\`\`js [JavaScript]
console.log('Hello World');
\`\`\`

\`\`\`python [Python]
print('Hello World')
\`\`\`

\`\`\`java [Java]
System.out.println("Hello World");
\`\`\`

:::`
  },
  {
    type: 'timeline',
    title: '时间线',
    icon: <Clock className="w-4 h-4" />,
    description: '插入时间线组件',
    template: `:::timeline
- 2024-01-01: 项目启动
- 2024-02-01: 完成需求分析
- 2024-03-01: 开发阶段
- 2024-04-01: 测试阶段
- 2024-05-01: 项目上线
:::`
  },
  {
    type: 'card',
    title: '卡片',
    icon: <Bookmark className="w-4 h-4" />,
    description: '插入卡片组件',
    hasModal: true,
    template: '',
    modalFields: [
      { name: 'title', label: '标题', type: 'text', required: true },
      { name: 'description', label: '描述', type: 'textarea' },
      { name: 'link', label: '链接', type: 'text' },
      { name: 'image', label: '图片URL', type: 'text' }
    ]
  },
  {
    type: 'badge',
    title: '徽章',
    icon: <Star className="w-4 h-4" />,
    description: '插入徽章组件',
    hasModal: true,
    template: '',
    modalFields: [
      { name: 'text', label: '文本', type: 'text', required: true },
      { 
        name: 'type', 
        label: '类型', 
        type: 'select', 
        required: true,
        defaultValue: 'primary',
        options: [
          { value: 'primary', label: '主要' },
          { value: 'secondary', label: '次要' },
          { value: 'success', label: '成功' },
          { value: 'warning', label: '警告' },
          { value: 'danger', label: '危险' },
          { value: 'info', label: '信息' }
        ]
      }
    ]
  },
  {
    type: 'button',
    title: '按钮',
    icon: <Zap className="w-4 h-4" />,
    description: '插入按钮组件',
    hasModal: true,
    template: '',
    modalFields: [
      { name: 'text', label: '按钮文本', type: 'text', required: true },
      { name: 'link', label: '链接', type: 'text', required: true },
      { 
        name: 'type', 
        label: '类型', 
        type: 'select', 
        defaultValue: 'primary',
        options: [
          { value: 'primary', label: '主要' },
          { value: 'secondary', label: '次要' },
          { value: 'outline', label: '轮廓' }
        ]
      },
      { 
        name: 'size', 
        label: '大小', 
        type: 'select', 
        defaultValue: 'md',
        options: [
          { value: 'sm', label: '小' },
          { value: 'md', label: '中' },
          { value: 'lg', label: '大' }
        ]
      }
    ]
  },
  {
    type: 'tabs',
    title: '选项卡',
    icon: <Tag className="w-4 h-4" />,
    description: '插入选项卡组件',
    template: `:::tabs

== Tab 1

这是第一个选项卡的内容

== Tab 2

这是第二个选项卡的内容

== Tab 3

这是第三个选项卡的内容

:::`
  },
  {
    type: 'collapse',
    title: '折叠面板',
    icon: <AlertCircle className="w-4 h-4" />,
    description: '插入可折叠内容',
    hasModal: true,
    template: '',
    modalFields: [
      { name: 'title', label: '标题', type: 'text', required: true },
      { name: 'content', label: '内容', type: 'textarea', required: true },
      { 
        name: 'open', 
        label: '默认展开', 
        type: 'select', 
        defaultValue: 'false',
        options: [
          { value: 'true', label: '是' },
          { value: 'false', label: '否' }
        ]
      }
    ]
  },
  {
    type: 'math',
    title: '数学公式',
    icon: <Calculator className="w-4 h-4" />,
    description: '插入数学公式',
    hasModal: true,
    template: '',
    modalFields: [
      { name: 'formula', label: '公式', type: 'textarea', required: true, placeholder: 'E = mc^2' },
      { 
        name: 'display', 
        label: '显示方式', 
        type: 'select', 
        defaultValue: 'block',
        options: [
          { value: 'inline', label: '行内' },
          { value: 'block', label: '块级' }
        ]
      }
    ]
  },
  {
    type: 'video',
    title: '视频',
    icon: <Video className="w-4 h-4" />,
    description: '插入视频组件',
    hasModal: true,
    template: '',
    modalFields: [
      { name: 'src', label: '视频URL', type: 'text', required: true },
      { name: 'title', label: '标题', type: 'text' },
      { name: 'poster', label: '封面图', type: 'text' },
      { name: 'width', label: '宽度', type: 'text', defaultValue: '100%' },
      { name: 'height', label: '高度', type: 'text', defaultValue: '400px' }
    ]
  },
  {
    type: 'audio',
    title: '音频',
    icon: <Music className="w-4 h-4" />,
    description: '插入音频组件',
    hasModal: true,
    template: '',
    modalFields: [
      { name: 'src', label: '音频URL', type: 'text', required: true },
      { name: 'title', label: '标题', type: 'text' },
      { name: 'artist', label: '艺术家', type: 'text' },
      { name: 'cover', label: '封面图', type: 'text' }
    ]
  },
  {
    type: 'social',
    title: '社交链接',
    icon: <Heart className="w-4 h-4" />,
    description: '插入社交媒体链接',
    hasModal: true,
    template: '',
    modalFields: [
      { 
        name: 'platform', 
        label: '平台', 
        type: 'select', 
        required: true,
        options: [
          { value: 'github', label: 'GitHub' },
          { value: 'twitter', label: 'Twitter' },
          { value: 'linkedin', label: 'LinkedIn' },
          { value: 'youtube', label: 'YouTube' },
          { value: 'instagram', label: 'Instagram' },
          { value: 'facebook', label: 'Facebook' }
        ]
      },
      { name: 'username', label: '用户名', type: 'text', required: true },
      { name: 'url', label: '链接', type: 'text', required: true }
    ]
  },
  {
    type: 'contact',
    title: '联系信息',
    icon: <User className="w-4 h-4" />,
    description: '插入联系信息卡片',
    hasModal: true,
    template: '',
    modalFields: [
      { name: 'name', label: '姓名', type: 'text', required: true },
      { name: 'title', label: '职位', type: 'text' },
      { name: 'email', label: '邮箱', type: 'text' },
      { name: 'phone', label: '电话', type: 'text' },
      { name: 'website', label: '网站', type: 'text' },
      { name: 'location', label: '地址', type: 'text' },
      { name: 'avatar', label: '头像URL', type: 'text' }
    ]
  }
];

// 生成模板函数
const generateTemplate = (config: ExtensionConfig, data: Record<string, string>): string => {
  switch (config.type) {
    case 'card':
      return `:::card{title="${data.title}"${data.link ? ` link="${data.link}"` : ''}${data.image ? ` image="${data.image}"` : ''}}
${data.description || ''}
:::`;
    
    case 'badge':
      return `:::badge{type="${data.type}"}
${data.text}
:::`;
    
    case 'button':
      return `:::button{link="${data.link}" type="${data.type}" size="${data.size}"}
${data.text}
:::`;
    
    case 'collapse':
      return `:::collapse{title="${data.title}" open="${data.open}"}
${data.content}
:::`;
    
    case 'math':
      if (data.display === 'inline') {
        return `$${data.formula}$`;
      } else {
        return `$$\n${data.formula}\n$$`;
      }
    
    case 'video':
      return `:::video{src="${data.src}"${data.title ? ` title="${data.title}"` : ''}${data.poster ? ` poster="${data.poster}"` : ''} width="${data.width}" height="${data.height}"}
:::`;
    
    case 'audio':
      return `:::audio{src="${data.src}"${data.title ? ` title="${data.title}"` : ''}${data.artist ? ` artist="${data.artist}"` : ''}${data.cover ? ` cover="${data.cover}"` : ''}}
:::`;
    
    case 'social':
      return `:::social{platform="${data.platform}" username="${data.username}" url="${data.url}"}
:::`;
    
    case 'contact':
      const attrs = Object.entries(data)
        .filter(([_, value]) => value)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
      return `:::contact{${attrs}}
:::`;
    
    default:
      return config.template;
  }
};

// MD扩展组件属性
interface MDExtensionsProps {
  className?: string;
  variant?: 'dropdown' | 'toolbar';
  showLabels?: boolean;
}

// MD扩展组件
export const MDExtensions: React.FC<MDExtensionsProps> = ({
  className = '',
  variant = 'dropdown',
  showLabels = false
}) => {
  const { insertText } = useEditor();
  const [showModal, setShowModal] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<ExtensionConfig | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  // 插入扩展语法
  const insertExtension = useCallback((config: ExtensionConfig) => {
    if (config.hasModal && config.modalFields) {
      // 显示模态框收集数据
      setCurrentConfig(config);
      setFormData(
        config.modalFields.reduce((acc, field) => {
          acc[field.name] = field.defaultValue || '';
          return acc;
        }, {} as Record<string, string>)
      );
      setShowModal(true);
    } else {
      // 直接插入模板
      insertText(config.template);
    }
  }, [insertText]);

  // 处理模态框确认
  const handleModalConfirm = () => {
    if (currentConfig) {
      const template = generateTemplate(currentConfig, formData);
      insertText(template);
      setShowModal(false);
      setCurrentConfig(null);
      setFormData({});
    }
  };

  // 处理表单数据变化
  const handleFormChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 渲染工具栏模式
  const renderToolbar = () => (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      {extensionConfigs.map((config) => (
        <Tooltip key={config.type} content={config.description}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertExtension(config)}
            className="p-2 flex items-center gap-1"
          >
            {config.icon}
            {showLabels && <span className="text-xs">{config.title}</span>}
          </Button>
        </Tooltip>
      ))}
    </div>
  );

  // 渲染下拉菜单模式
  const renderDropdown = () => {
    // 按类型分组
    const groups = {
      '提示框': extensionConfigs.filter(c => ['tip', 'warning', 'danger', 'info', 'success'].includes(c.type)),
      '内容组件': extensionConfigs.filter(c => ['code-group', 'timeline', 'tabs', 'collapse'].includes(c.type)),
      '交互组件': extensionConfigs.filter(c => ['card', 'badge', 'button'].includes(c.type)),
      '媒体组件': extensionConfigs.filter(c => ['video', 'audio', 'math'].includes(c.type)),
      '社交组件': extensionConfigs.filter(c => ['social', 'contact'].includes(c.type))
    };

    const dropdownItems = Object.entries(groups).flatMap(([groupName, configs]) => [
      { label: groupName, disabled: true, separator: true },
      ...configs.map(config => ({
        label: config.title,
        icon: config.icon,
        onClick: () => insertExtension(config),
        description: config.description
      }))
    ]);

    return (
      <Dropdown
        trigger={
          <Button variant="ghost" size="sm" className={`p-2 ${className}`}>
            <Zap className="w-4 h-4" />
            {showLabels && <span className="ml-1">扩展</span>}
          </Button>
        }
        items={dropdownItems}
        maxHeight={400}
      />
    );
  };

  return (
    <>
      {variant === 'toolbar' ? renderToolbar() : renderDropdown()}

      {/* 扩展配置模态框 */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={currentConfig ? `插入${currentConfig.title}` : ''}
        size="md"
      >
        {currentConfig && currentConfig.modalFields && (
          <div className="space-y-4">
            {currentConfig.modalFields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {field.type === 'text' && (
                  <Input
                    placeholder={field.placeholder}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleFormChange(field.name, e.target.value)}
                    required={field.required}
                  />
                )}
                
                {field.type === 'textarea' && (
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    rows={3}
                    placeholder={field.placeholder}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleFormChange(field.name, e.target.value)}
                    required={field.required}
                  />
                )}
                
                {field.type === 'select' && field.options && (
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    value={formData[field.name] || field.defaultValue || ''}
                    onChange={(e) => handleFormChange(field.name, e.target.value)}
                    required={field.required}
                  >
                    {field.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
                
                {field.type === 'number' && (
                  <Input
                    type="number"
                    placeholder={field.placeholder}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleFormChange(field.name, e.target.value)}
                    required={field.required}
                  />
                )}
              </div>
            ))}
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                取消
              </Button>
              <Button 
                onClick={handleModalConfirm}
                disabled={currentConfig.modalFields.some(field => 
                  field.required && !formData[field.name]
                )}
              >
                插入
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

// 快捷插入组件
export const QuickInsert: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { insertText } = useEditor();

  const quickItems = [
    {
      label: '提示',
      icon: <Lightbulb className="w-4 h-4" />,
      template: ':::tip\n提示内容\n:::'
    },
    {
      label: '警告',
      icon: <AlertTriangle className="w-4 h-4" />,
      template: ':::warning\n警告内容\n:::'
    },
    {
      label: '代码组',
      icon: <Code2 className="w-4 h-4" />,
      template: ':::code-group\n\n```js\nconsole.log("Hello");\n```\n\n:::'
    },
    {
      label: '时间线',
      icon: <Clock className="w-4 h-4" />,
      template: ':::timeline\n- 2024-01-01: 事件1\n- 2024-02-01: 事件2\n:::'
    }
  ];

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {quickItems.map((item) => (
        <Tooltip key={item.label} content={`插入${item.label}`}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertText(item.template)}
            className="p-2"
          >
            {item.icon}
          </Button>
        </Tooltip>
      ))}
    </div>
  );
};

export default MDExtensions;