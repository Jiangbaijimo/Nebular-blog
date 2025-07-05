// 工具函数模块导出

// 通用工具函数
export * from './common';

// 日期时间工具函数
export * from './date';

// 文件处理工具函数
export * from './file';

// 存储工具函数
export * from './storage';

// 验证工具函数
export * from './validation';

// 重新导出主要工具对象
export {
  delay,
  debounce,
  throttle,
  deepClone,
  deepMerge,
  generateId,
  generateUUID,
  get,
  set,
  unset,
  has,
  unique,
  groupBy,
  sortBy,
  paginate,
  capitalize,
  camelCase,
  kebabCase,
  snakeCase,
  truncate,
  stripHtml,
  escapeHtml,
  unescapeHtml,
  isEmpty,
  isValidUrl,
  isValidEmail,
  isMobile,
  isTouchDevice,
  getDeviceType,
  getBrowserInfo,
} from './common';

export {
  formatDate,
  formatRelativeTime,
  getDateRange,
  getDaysInMonth,
  getFirstDayOfMonth,
  getLastDayOfMonth,
  isLeapYear,
  isToday,
  isYesterday,
  isTomorrow,
  isThisWeek,
  isThisMonth,
  isThisYear,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  getStartOfYear,
  getEndOfYear,
  addDays,
  addMonths,
  addYears,
  diffInDays,
  diffInHours,
  diffInMinutes,
  getTimezoneOffset,
  toUTC,
  fromUTC,
  getWeekdayName,
  getMonthName,
  parseDate,
  isValidDate,
} from './date';

export {
  formatFileSize,
  parseFileSize,
  getFileExtension,
  getFileNameWithoutExtension,
  getFileType,
  isFileTypeAllowed,
  isFileSizeExceeded,
  readFileAsText,
  readFileAsDataURL,
  readFileAsArrayBuffer,
  compressImage,
  generateThumbnail,
  downloadFile,
  downloadTextFile,
  downloadJsonFile,
  copyFileToClipboard,
  pasteFilesFromClipboard,
  validateFile,
  validateFiles,
  createFileSelector,
} from './file';

export {
  isStorageAvailable,
  setStorageItem,
  getStorageItem,
  removeStorageItem,
  clearStorage,
  getStorageSize,
  getStorageKeys,
  hasStorageItem,
  cleanExpiredItems,
  exportStorageData,
  importStorageData,
  StorageManager,
  localStorage,
  sessionStorage,
  watchStorage,
  storageQuota,
} from './storage';

export {
  validateValue,
  validateForm,
  validators,
  Validator,
  createValidator,
  validationPresets,
} from './validation';

// 类型导出
export type {
  StorageType,
  StorageOptions,
} from './storage';

export type {
  ValidationRule,
  ValidationResult,
  FieldValidationResult,
  FormValidationResult,
} from './validation';