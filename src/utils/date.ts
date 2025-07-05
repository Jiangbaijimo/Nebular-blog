// 日期时间工具函数

/**
 * 格式化日期
 * @param date 日期
 * @param format 格式字符串
 * @returns 格式化后的日期字符串
 */
export const formatDate = (
  date: Date | string | number,
  format = 'YYYY-MM-DD'
): string => {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  const formatMap: Record<string, string> = {
    YYYY: String(year),
    YY: String(year).slice(-2),
    MM: month,
    M: String(d.getMonth() + 1),
    DD: day,
    D: String(d.getDate()),
    HH: hours,
    H: String(d.getHours()),
    mm: minutes,
    m: String(d.getMinutes()),
    ss: seconds,
    s: String(d.getSeconds()),
  };
  
  return format.replace(/YYYY|YY|MM|M|DD|D|HH|H|mm|m|ss|s/g, (match) => {
    return formatMap[match] || match;
  });
};

/**
 * 格式化相对时间
 * @param date 日期
 * @param locale 语言环境
 * @returns 相对时间字符串
 */
export const formatRelativeTime = (
  date: Date | string | number,
  locale = 'zh-CN'
): string => {
  const d = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  if (diffInSeconds < 0) {
    return locale === 'zh-CN' ? '未来' : 'in the future';
  }
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1,
  };
  
  const labels = {
    'zh-CN': {
      year: '年前',
      month: '个月前',
      week: '周前',
      day: '天前',
      hour: '小时前',
      minute: '分钟前',
      second: '秒前',
      just_now: '刚刚',
    },
    'en-US': {
      year: 'year ago',
      month: 'month ago',
      week: 'week ago',
      day: 'day ago',
      hour: 'hour ago',
      minute: 'minute ago',
      second: 'second ago',
      just_now: 'just now',
    },
  };
  
  const currentLabels = labels[locale as keyof typeof labels] || labels['en-US'];
  
  if (diffInSeconds < 10) {
    return currentLabels.just_now;
  }
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / secondsInUnit);
    if (interval >= 1) {
      if (locale === 'zh-CN') {
        return `${interval}${currentLabels[unit as keyof typeof currentLabels]}`;
      } else {
        const plural = interval > 1 ? 's' : '';
        return `${interval} ${unit}${plural} ago`;
      }
    }
  }
  
  return currentLabels.just_now;
};

/**
 * 获取日期范围
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 日期数组
 */
export const getDateRange = (
  startDate: Date | string,
  endDate: Date | string
): Date[] => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dates: Date[] = [];
  
  const currentDate = new Date(start);
  while (currentDate <= end) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

/**
 * 获取月份的天数
 * @param year 年份
 * @param month 月份（0-11）
 * @returns 天数
 */
export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

/**
 * 获取月份的第一天是星期几
 * @param year 年份
 * @param month 月份（0-11）
 * @returns 星期几（0-6，0为星期日）
 */
export const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

/**
 * 获取月份的最后一天是星期几
 * @param year 年份
 * @param month 月份（0-11）
 * @returns 星期几（0-6，0为星期日）
 */
export const getLastDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDay();
};

/**
 * 判断是否为闰年
 * @param year 年份
 * @returns 是否为闰年
 */
export const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

/**
 * 判断是否为今天
 * @param date 日期
 * @returns 是否为今天
 */
export const isToday = (date: Date | string): boolean => {
  const d = new Date(date);
  const today = new Date();
  
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
};

/**
 * 判断是否为昨天
 * @param date 日期
 * @returns 是否为昨天
 */
export const isYesterday = (date: Date | string): boolean => {
  const d = new Date(date);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  );
};

/**
 * 判断是否为明天
 * @param date 日期
 * @returns 是否为明天
 */
export const isTomorrow = (date: Date | string): boolean => {
  const d = new Date(date);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return (
    d.getDate() === tomorrow.getDate() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getFullYear() === tomorrow.getFullYear()
  );
};

/**
 * 判断是否为本周
 * @param date 日期
 * @returns 是否为本周
 */
export const isThisWeek = (date: Date | string): boolean => {
  const d = new Date(date);
  const today = new Date();
  
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return d >= startOfWeek && d <= endOfWeek;
};

/**
 * 判断是否为本月
 * @param date 日期
 * @returns 是否为本月
 */
export const isThisMonth = (date: Date | string): boolean => {
  const d = new Date(date);
  const today = new Date();
  
  return (
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
};

/**
 * 判断是否为本年
 * @param date 日期
 * @returns 是否为本年
 */
export const isThisYear = (date: Date | string): boolean => {
  const d = new Date(date);
  const today = new Date();
  
  return d.getFullYear() === today.getFullYear();
};

/**
 * 获取周的开始日期
 * @param date 日期
 * @param startOfWeek 一周的开始（0为星期日，1为星期一）
 * @returns 周的开始日期
 */
export const getStartOfWeek = (
  date: Date | string,
  startOfWeek = 1
): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day < startOfWeek ? 7 : 0) + day - startOfWeek;
  
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  
  return d;
};

/**
 * 获取周的结束日期
 * @param date 日期
 * @param startOfWeek 一周的开始（0为星期日，1为星期一）
 * @returns 周的结束日期
 */
export const getEndOfWeek = (
  date: Date | string,
  startOfWeek = 1
): Date => {
  const startDate = getStartOfWeek(date, startOfWeek);
  const endDate = new Date(startDate);
  
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
  
  return endDate;
};

/**
 * 获取月的开始日期
 * @param date 日期
 * @returns 月的开始日期
 */
export const getStartOfMonth = (date: Date | string): Date => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

/**
 * 获取月的结束日期
 * @param date 日期
 * @returns 月的结束日期
 */
export const getEndOfMonth = (date: Date | string): Date => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
};

/**
 * 获取年的开始日期
 * @param date 日期
 * @returns 年的开始日期
 */
export const getStartOfYear = (date: Date | string): Date => {
  const d = new Date(date);
  return new Date(d.getFullYear(), 0, 1);
};

/**
 * 获取年的结束日期
 * @param date 日期
 * @returns 年的结束日期
 */
export const getEndOfYear = (date: Date | string): Date => {
  const d = new Date(date);
  return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
};

/**
 * 添加天数
 * @param date 日期
 * @param days 天数
 * @returns 新日期
 */
export const addDays = (date: Date | string, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/**
 * 添加月份
 * @param date 日期
 * @param months 月份数
 * @returns 新日期
 */
export const addMonths = (date: Date | string, months: number): Date => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

/**
 * 添加年份
 * @param date 日期
 * @param years 年份数
 * @returns 新日期
 */
export const addYears = (date: Date | string, years: number): Date => {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
};

/**
 * 计算两个日期之间的天数差
 * @param date1 日期1
 * @param date2 日期2
 * @returns 天数差
 */
export const diffInDays = (
  date1: Date | string,
  date2: Date | string
): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  const timeDiff = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

/**
 * 计算两个日期之间的小时差
 * @param date1 日期1
 * @param date2 日期2
 * @returns 小时差
 */
export const diffInHours = (
  date1: Date | string,
  date2: Date | string
): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  const timeDiff = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(timeDiff / (1000 * 3600));
};

/**
 * 计算两个日期之间的分钟差
 * @param date1 日期1
 * @param date2 日期2
 * @returns 分钟差
 */
export const diffInMinutes = (
  date1: Date | string,
  date2: Date | string
): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  const timeDiff = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(timeDiff / (1000 * 60));
};

/**
 * 获取时区偏移
 * @param date 日期
 * @returns 时区偏移（分钟）
 */
export const getTimezoneOffset = (date: Date | string = new Date()): number => {
  return new Date(date).getTimezoneOffset();
};

/**
 * 转换为UTC时间
 * @param date 日期
 * @returns UTC时间
 */
export const toUTC = (date: Date | string): Date => {
  const d = new Date(date);
  return new Date(d.getTime() + d.getTimezoneOffset() * 60000);
};

/**
 * 从UTC时间转换为本地时间
 * @param date UTC日期
 * @returns 本地时间
 */
export const fromUTC = (date: Date | string): Date => {
  const d = new Date(date);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000);
};

/**
 * 获取星期几的名称
 * @param date 日期
 * @param locale 语言环境
 * @param format 格式（long/short）
 * @returns 星期几的名称
 */
export const getWeekdayName = (
  date: Date | string,
  locale = 'zh-CN',
  format: 'long' | 'short' = 'long'
): string => {
  const d = new Date(date);
  
  return d.toLocaleDateString(locale, {
    weekday: format,
  });
};

/**
 * 获取月份的名称
 * @param date 日期
 * @param locale 语言环境
 * @param format 格式（long/short）
 * @returns 月份的名称
 */
export const getMonthName = (
  date: Date | string,
  locale = 'zh-CN',
  format: 'long' | 'short' = 'long'
): string => {
  const d = new Date(date);
  
  return d.toLocaleDateString(locale, {
    month: format,
  });
};

/**
 * 解析日期字符串
 * @param dateString 日期字符串
 * @param format 格式
 * @returns 日期对象
 */
export const parseDate = (
  dateString: string,
  format = 'YYYY-MM-DD'
): Date | null => {
  try {
    // 简单的日期解析，可以根据需要扩展
    if (format === 'YYYY-MM-DD') {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    
    if (format === 'DD/MM/YYYY') {
      const [day, month, year] = dateString.split('/').map(Number);
      return new Date(year, month - 1, day);
    }
    
    if (format === 'MM/DD/YYYY') {
      const [month, day, year] = dateString.split('/').map(Number);
      return new Date(year, month - 1, day);
    }
    
    // 默认使用 Date 构造函数
    return new Date(dateString);
  } catch {
    return null;
  }
};

/**
 * 验证日期字符串
 * @param dateString 日期字符串
 * @param format 格式
 * @returns 是否有效
 */
export const isValidDate = (
  dateString: string,
  format = 'YYYY-MM-DD'
): boolean => {
  const date = parseDate(dateString, format);
  return date !== null && !isNaN(date.getTime());
};