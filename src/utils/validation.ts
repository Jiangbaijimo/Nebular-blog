// 验证工具函数

import { REGEX_PATTERNS } from '../constants';

/**
 * 验证规则类型
 */
export type ValidationRule = {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  url?: boolean;
  phone?: boolean;
  number?: boolean;
  integer?: boolean;
  positive?: boolean;
  negative?: boolean;
  custom?: (value: any) => boolean | string;
  message?: string;
};

/**
 * 验证结果
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 字段验证结果
 */
export interface FieldValidationResult {
  [field: string]: ValidationResult;
}

/**
 * 表单验证结果
 */
export interface FormValidationResult {
  isValid: boolean;
  errors: string[];
  fieldErrors: FieldValidationResult;
}

/**
 * 验证单个值
 * @param value 要验证的值
 * @param rules 验证规则
 * @param fieldName 字段名（用于错误消息）
 * @returns 验证结果
 */
export const validateValue = (
  value: any,
  rules: ValidationRule,
  fieldName = 'Field'
): ValidationResult => {
  const errors: string[] = [];
  
  // 必填验证
  if (rules.required && (value === undefined || value === null || value === '')) {
    errors.push(rules.message || `${fieldName}是必填项`);
    return { isValid: false, errors };
  }
  
  // 如果值为空且不是必填，则跳过其他验证
  if (value === undefined || value === null || value === '') {
    return { isValid: true, errors: [] };
  }
  
  // 字符串长度验证
  if (typeof value === 'string') {
    if (rules.minLength !== undefined && value.length < rules.minLength) {
      errors.push(rules.message || `${fieldName}长度不能少于${rules.minLength}个字符`);
    }
    
    if (rules.maxLength !== undefined && value.length > rules.maxLength) {
      errors.push(rules.message || `${fieldName}长度不能超过${rules.maxLength}个字符`);
    }
  }
  
  // 数值范围验证
  if (typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      errors.push(rules.message || `${fieldName}不能小于${rules.min}`);
    }
    
    if (rules.max !== undefined && value > rules.max) {
      errors.push(rules.message || `${fieldName}不能大于${rules.max}`);
    }
  }
  
  // 正则表达式验证
  if (rules.pattern && typeof value === 'string') {
    if (!rules.pattern.test(value)) {
      errors.push(rules.message || `${fieldName}格式不正确`);
    }
  }
  
  // 邮箱验证
  if (rules.email && typeof value === 'string') {
    if (!REGEX_PATTERNS.EMAIL.test(value)) {
      errors.push(rules.message || `${fieldName}邮箱格式不正确`);
    }
  }
  
  // URL验证
  if (rules.url && typeof value === 'string') {
    if (!REGEX_PATTERNS.URL.test(value)) {
      errors.push(rules.message || `${fieldName}URL格式不正确`);
    }
  }
  
  // 手机号验证
  if (rules.phone && typeof value === 'string') {
    if (!REGEX_PATTERNS.PHONE.test(value)) {
      errors.push(rules.message || `${fieldName}手机号格式不正确`);
    }
  }
  
  // 数字验证
  if (rules.number) {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      errors.push(rules.message || `${fieldName}必须是数字`);
    } else {
      // 整数验证
      if (rules.integer && !Number.isInteger(numValue)) {
        errors.push(rules.message || `${fieldName}必须是整数`);
      }
      
      // 正数验证
      if (rules.positive && numValue <= 0) {
        errors.push(rules.message || `${fieldName}必须是正数`);
      }
      
      // 负数验证
      if (rules.negative && numValue >= 0) {
        errors.push(rules.message || `${fieldName}必须是负数`);
      }
    }
  }
  
  // 自定义验证
  if (rules.custom) {
    const customResult = rules.custom(value);
    if (typeof customResult === 'string') {
      errors.push(customResult);
    } else if (!customResult) {
      errors.push(rules.message || `${fieldName}验证失败`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 验证表单
 * @param data 表单数据
 * @param rules 验证规则
 * @returns 验证结果
 */
export const validateForm = (
  data: Record<string, any>,
  rules: Record<string, ValidationRule>
): FormValidationResult => {
  const fieldErrors: FieldValidationResult = {};
  const allErrors: string[] = [];
  
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    const result = validateValue(value, rule, field);
    
    fieldErrors[field] = result;
    
    if (!result.isValid) {
      allErrors.push(...result.errors);
    }
  }
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    fieldErrors,
  };
};

/**
 * 常用验证函数
 */
export const validators = {
  /**
   * 验证邮箱
   * @param email 邮箱地址
   * @returns 是否有效
   */
  isEmail: (email: string): boolean => {
    return REGEX_PATTERNS.EMAIL.test(email);
  },
  
  /**
   * 验证密码强度
   * @param password 密码
   * @returns 是否有效
   */
  isStrongPassword: (password: string): boolean => {
    return REGEX_PATTERNS.PASSWORD.test(password);
  },
  
  /**
   * 验证用户名
   * @param username 用户名
   * @returns 是否有效
   */
  isValidUsername: (username: string): boolean => {
    return REGEX_PATTERNS.USERNAME.test(username);
  },
  
  /**
   * 验证URL
   * @param url URL地址
   * @returns 是否有效
   */
  isUrl: (url: string): boolean => {
    return REGEX_PATTERNS.URL.test(url);
  },
  
  /**
   * 验证手机号
   * @param phone 手机号
   * @returns 是否有效
   */
  isPhone: (phone: string): boolean => {
    return REGEX_PATTERNS.PHONE.test(phone);
  },
  
  /**
   * 验证颜色值
   * @param color 颜色值
   * @returns 是否有效
   */
  isColor: (color: string): boolean => {
    return REGEX_PATTERNS.COLOR_HEX.test(color);
  },
  
  /**
   * 验证slug
   * @param slug slug字符串
   * @returns 是否有效
   */
  isSlug: (slug: string): boolean => {
    return REGEX_PATTERNS.SLUG.test(slug);
  },
  
  /**
   * 验证是否为空
   * @param value 值
   * @returns 是否为空
   */
  isEmpty: (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  },
  
  /**
   * 验证是否为数字
   * @param value 值
   * @returns 是否为数字
   */
  isNumber: (value: any): boolean => {
    return !isNaN(Number(value)) && isFinite(Number(value));
  },
  
  /**
   * 验证是否为整数
   * @param value 值
   * @returns 是否为整数
   */
  isInteger: (value: any): boolean => {
    return Number.isInteger(Number(value));
  },
  
  /**
   * 验证是否为正数
   * @param value 值
   * @returns 是否为正数
   */
  isPositive: (value: any): boolean => {
    const num = Number(value);
    return !isNaN(num) && num > 0;
  },
  
  /**
   * 验证是否为负数
   * @param value 值
   * @returns 是否为负数
   */
  isNegative: (value: any): boolean => {
    const num = Number(value);
    return !isNaN(num) && num < 0;
  },
  
  /**
   * 验证字符串长度
   * @param value 字符串
   * @param min 最小长度
   * @param max 最大长度
   * @returns 是否有效
   */
  isLengthValid: (value: string, min?: number, max?: number): boolean => {
    const length = value.length;
    if (min !== undefined && length < min) return false;
    if (max !== undefined && length > max) return false;
    return true;
  },
  
  /**
   * 验证数值范围
   * @param value 数值
   * @param min 最小值
   * @param max 最大值
   * @returns 是否有效
   */
  isInRange: (value: number, min?: number, max?: number): boolean => {
    if (min !== undefined && value < min) return false;
    if (max !== undefined && value > max) return false;
    return true;
  },
  
  /**
   * 验证日期
   * @param value 日期值
   * @returns 是否有效
   */
  isValidDate: (value: any): boolean => {
    const date = new Date(value);
    return !isNaN(date.getTime());
  },
  
  /**
   * 验证JSON字符串
   * @param value JSON字符串
   * @returns 是否有效
   */
  isValidJson: (value: string): boolean => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  },
  
  /**
   * 验证IP地址
   * @param ip IP地址
   * @returns 是否有效
   */
  isValidIP: (ip: string): boolean => {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  },
  
  /**
   * 验证MAC地址
   * @param mac MAC地址
   * @returns 是否有效
   */
  isValidMAC: (mac: string): boolean => {
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return macRegex.test(mac);
  },
  
  /**
   * 验证信用卡号
   * @param cardNumber 信用卡号
   * @returns 是否有效
   */
  isValidCreditCard: (cardNumber: string): boolean => {
    // 移除空格和连字符
    const cleaned = cardNumber.replace(/[\s-]/g, '');
    
    // 检查是否只包含数字
    if (!/^\d+$/.test(cleaned)) return false;
    
    // 检查长度
    if (cleaned.length < 13 || cleaned.length > 19) return false;
    
    // Luhn算法验证
    let sum = 0;
    let isEven = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  },
  
  /**
   * 验证身份证号（中国）
   * @param idCard 身份证号
   * @returns 是否有效
   */
  isValidChineseIDCard: (idCard: string): boolean => {
    const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
    
    if (!idCardRegex.test(idCard)) return false;
    
    // 验证校验码
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
    
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      sum += parseInt(idCard[i]) * weights[i];
    }
    
    const checkCode = checkCodes[sum % 11];
    return checkCode === idCard[17].toUpperCase();
  },
};

// 导出常用验证函数
export const validateEmail = (email: string): boolean => {
  return validators.isEmail(email);
};

export const validatePassword = (password: string): boolean => {
  return validators.isStrongPassword(password);
};

export const validateUsername = (username: string): boolean => {
  return validators.isValidUsername(username);
};

/**
 * 创建验证器类
 */
export class Validator {
  private rules: Record<string, ValidationRule> = {};
  
  /**
   * 添加验证规则
   * @param field 字段名
   * @param rule 验证规则
   * @returns 验证器实例
   */
  addRule(field: string, rule: ValidationRule): this {
    this.rules[field] = rule;
    return this;
  }
  
  /**
   * 批量添加验证规则
   * @param rules 验证规则
   * @returns 验证器实例
   */
  addRules(rules: Record<string, ValidationRule>): this {
    Object.assign(this.rules, rules);
    return this;
  }
  
  /**
   * 移除验证规则
   * @param field 字段名
   * @returns 验证器实例
   */
  removeRule(field: string): this {
    delete this.rules[field];
    return this;
  }
  
  /**
   * 清空所有验证规则
   * @returns 验证器实例
   */
  clearRules(): this {
    this.rules = {};
    return this;
  }
  
  /**
   * 验证数据
   * @param data 要验证的数据
   * @returns 验证结果
   */
  validate(data: Record<string, any>): FormValidationResult {
    return validateForm(data, this.rules);
  }
  
  /**
   * 验证单个字段
   * @param field 字段名
   * @param value 字段值
   * @returns 验证结果
   */
  validateField(field: string, value: any): ValidationResult {
    const rule = this.rules[field];
    if (!rule) {
      return { isValid: true, errors: [] };
    }
    
    return validateValue(value, rule, field);
  }
  
  /**
   * 检查是否有验证规则
   * @param field 字段名
   * @returns 是否有规则
   */
  hasRule(field: string): boolean {
    return field in this.rules;
  }
  
  /**
   * 获取验证规则
   * @param field 字段名
   * @returns 验证规则
   */
  getRule(field: string): ValidationRule | undefined {
    return this.rules[field];
  }
  
  /**
   * 获取所有验证规则
   * @returns 所有验证规则
   */
  getRules(): Record<string, ValidationRule> {
    return { ...this.rules };
  }
}

/**
 * 创建验证器实例
 * @param rules 初始验证规则
 * @returns 验证器实例
 */
export const createValidator = (rules?: Record<string, ValidationRule>): Validator => {
  const validator = new Validator();
  if (rules) {
    validator.addRules(rules);
  }
  return validator;
};

/**
 * 常用验证规则预设
 */
export const validationPresets = {
  // 用户相关
  username: {
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: REGEX_PATTERNS.USERNAME,
    message: '用户名必须是3-20位字母、数字或下划线',
  },
  
  email: {
    required: true,
    email: true,
    message: '请输入有效的邮箱地址',
  },
  
  password: {
    required: true,
    minLength: 8,
    pattern: REGEX_PATTERNS.PASSWORD,
    message: '密码必须包含大小写字母和数字，至少8位',
  },
  
  phone: {
    required: true,
    phone: true,
    message: '请输入有效的手机号码',
  },
  
  // 博客相关
  title: {
    required: true,
    minLength: 1,
    maxLength: 100,
    message: '标题长度必须在1-100个字符之间',
  },
  
  slug: {
    required: true,
    pattern: REGEX_PATTERNS.SLUG,
    message: 'URL别名只能包含小写字母、数字和连字符',
  },
  
  content: {
    required: true,
    minLength: 10,
    message: '内容不能少于10个字符',
  },
  
  url: {
    url: true,
    message: '请输入有效的URL地址',
  },
  
  // 数值相关
  positiveInteger: {
    required: true,
    number: true,
    integer: true,
    positive: true,
    message: '请输入正整数',
  },
  
  percentage: {
    number: true,
    min: 0,
    max: 100,
    message: '请输入0-100之间的数值',
  },
};