// 存储工具函数

/**
 * 存储类型
 */
export type StorageType = 'localStorage' | 'sessionStorage';

/**
 * 存储选项
 */
export interface StorageOptions {
  /** 过期时间（毫秒） */
  expires?: number;
  /** 是否加密 */
  encrypt?: boolean;
  /** 存储类型 */
  type?: StorageType;
}

/**
 * 存储项数据结构
 */
interface StorageItem<T = any> {
  value: T;
  expires?: number;
  encrypted?: boolean;
}

/**
 * 简单的加密/解密函数（仅用于演示，生产环境应使用更安全的方法）
 */
const simpleEncrypt = (text: string): string => {
  return btoa(encodeURIComponent(text));
};

const simpleDecrypt = (encrypted: string): string => {
  try {
    return decodeURIComponent(atob(encrypted));
  } catch {
    return encrypted;
  }
};

/**
 * 获取存储对象
 * @param type 存储类型
 * @returns Storage对象
 */
const getStorage = (type: StorageType): Storage => {
  return type === 'localStorage' ? localStorage : sessionStorage;
};

/**
 * 检查存储是否可用
 * @param type 存储类型
 * @returns 是否可用
 */
export const isStorageAvailable = (type: StorageType): boolean => {
  try {
    // 在Tauri环境中，localStorage可能在初始化早期不可用
    if (typeof window === 'undefined') {
      return false;
    }
    
    const storage = getStorage(type);
    
    // 检查storage对象是否存在
    if (!storage) {
      return false;
    }
    
    const testKey = '__storage_test__';
    storage.setItem(testKey, 'test');
    storage.removeItem(testKey);
    return true;
  } catch (error) {
    // 在Tauri环境中，localStorage可能暂时不可用
    console.debug(`${type} is not available:`, error);
    return false;
  }
};

/**
 * 设置存储项
 * @param key 键名
 * @param value 值
 * @param options 选项
 */
export const setStorageItem = <T>(
  key: string,
  value: T,
  options: StorageOptions = {}
): void => {
  const {
    expires,
    encrypt = false,
    type = 'localStorage',
  } = options;
  
  if (!isStorageAvailable(type)) {
    console.debug(`${type} is not available, skipping storage operation`);
    return;
  }
  
  const storage = getStorage(type);
  
  const item: StorageItem<T> = {
    value,
    encrypted: encrypt,
  };
  
  if (expires) {
    item.expires = Date.now() + expires;
  }
  
  let serialized = JSON.stringify(item);
  
  if (encrypt) {
    serialized = simpleEncrypt(serialized);
  }
  
  try {
    storage.setItem(key, serialized);
  } catch (error) {
    console.error('Failed to set storage item:', error);
  }
};

/**
 * 获取存储项
 * @param key 键名
 * @param defaultValue 默认值
 * @param type 存储类型
 * @returns 存储的值
 */
export const getStorageItem = <T>(
  key: string,
  defaultValue?: T,
  type: StorageType = 'localStorage'
): T | undefined => {
  if (!isStorageAvailable(type)) {
    // 在Tauri环境中，localStorage可能在应用启动时暂时不可用
    // 使用debug级别日志避免过多警告
    console.debug(`${type} is not available, returning default value`);
    return defaultValue;
  }
  
  const storage = getStorage(type);
  
  try {
    const serialized = storage.getItem(key);
    
    if (serialized === null) {
      return defaultValue;
    }
    
    let item: StorageItem<T>;
    
    try {
      // 尝试解析为JSON
      item = JSON.parse(serialized);
    } catch {
      // 如果解析失败，尝试解密后再解析
      try {
        const decrypted = simpleDecrypt(serialized);
        item = JSON.parse(decrypted);
      } catch {
        // 如果都失败了，返回默认值
        return defaultValue;
      }
    }
    
    // 检查是否过期
    if (item.expires && Date.now() > item.expires) {
      storage.removeItem(key);
      return defaultValue;
    }
    
    return item.value;
  } catch (error) {
    console.error('Failed to get storage item:', error);
    return defaultValue;
  }
};

/**
 * 移除存储项
 * @param key 键名
 * @param type 存储类型
 */
export const removeStorageItem = (
  key: string,
  type: StorageType = 'localStorage'
): void => {
  if (!isStorageAvailable(type)) {
    console.debug(`${type} is not available, skipping remove operation`);
    return;
  }
  
  const storage = getStorage(type);
  
  try {
    storage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove storage item:', error);
  }
};

/**
 * 清空存储
 * @param type 存储类型
 */
export const clearStorage = (type: StorageType = 'localStorage'): void => {
  if (!isStorageAvailable(type)) {
    console.warn(`${type} is not available`);
    return;
  }
  
  const storage = getStorage(type);
  
  try {
    storage.clear();
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
};

/**
 * 获取存储大小
 * @param type 存储类型
 * @returns 存储大小（字节）
 */
export const getStorageSize = (type: StorageType = 'localStorage'): number => {
  if (!isStorageAvailable(type)) {
    return 0;
  }
  
  const storage = getStorage(type);
  let size = 0;
  
  try {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key) {
        const value = storage.getItem(key);
        if (value) {
          size += key.length + value.length;
        }
      }
    }
  } catch (error) {
    console.error('Failed to calculate storage size:', error);
  }
  
  return size;
};

/**
 * 获取所有存储键
 * @param type 存储类型
 * @returns 键名数组
 */
export const getStorageKeys = (type: StorageType = 'localStorage'): string[] => {
  if (!isStorageAvailable(type)) {
    return [];
  }
  
  const storage = getStorage(type);
  const keys: string[] = [];
  
  try {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key) {
        keys.push(key);
      }
    }
  } catch (error) {
    console.error('Failed to get storage keys:', error);
  }
  
  return keys;
};

/**
 * 检查存储项是否存在
 * @param key 键名
 * @param type 存储类型
 * @returns 是否存在
 */
export const hasStorageItem = (
  key: string,
  type: StorageType = 'localStorage'
): boolean => {
  if (!isStorageAvailable(type)) {
    return false;
  }
  
  const storage = getStorage(type);
  
  try {
    return storage.getItem(key) !== null;
  } catch (error) {
    console.error('Failed to check storage item:', error);
    return false;
  }
};

/**
 * 清理过期的存储项
 * @param type 存储类型
 * @returns 清理的项数
 */
export const cleanExpiredItems = (type: StorageType = 'localStorage'): number => {
  if (!isStorageAvailable(type)) {
    return 0;
  }
  
  const storage = getStorage(type);
  const keys = getStorageKeys(type);
  let cleanedCount = 0;
  
  for (const key of keys) {
    try {
      const serialized = storage.getItem(key);
      if (serialized) {
        let item: StorageItem;
        
        try {
          item = JSON.parse(serialized);
        } catch {
          // 尝试解密
          try {
            const decrypted = simpleDecrypt(serialized);
            item = JSON.parse(decrypted);
          } catch {
            continue;
          }
        }
        
        if (item.expires && Date.now() > item.expires) {
          storage.removeItem(key);
          cleanedCount++;
        }
      }
    } catch (error) {
      console.error(`Failed to check expiration for key ${key}:`, error);
    }
  }
  
  return cleanedCount;
};

/**
 * 导出存储数据
 * @param type 存储类型
 * @param keys 要导出的键名（可选，不传则导出所有）
 * @returns 存储数据
 */
export const exportStorageData = (
  type: StorageType = 'localStorage',
  keys?: string[]
): Record<string, any> => {
  if (!isStorageAvailable(type)) {
    return {};
  }
  
  const storage = getStorage(type);
  const data: Record<string, any> = {};
  const targetKeys = keys || getStorageKeys(type);
  
  for (const key of targetKeys) {
    try {
      const value = storage.getItem(key);
      if (value !== null) {
        data[key] = value;
      }
    } catch (error) {
      console.error(`Failed to export key ${key}:`, error);
    }
  }
  
  return data;
};

/**
 * 导入存储数据
 * @param data 存储数据
 * @param type 存储类型
 * @param overwrite 是否覆盖现有数据
 */
export const importStorageData = (
  data: Record<string, any>,
  type: StorageType = 'localStorage',
  overwrite = false
): void => {
  if (!isStorageAvailable(type)) {
    console.warn(`${type} is not available`);
    return;
  }
  
  const storage = getStorage(type);
  
  for (const [key, value] of Object.entries(data)) {
    try {
      if (!overwrite && storage.getItem(key) !== null) {
        continue;
      }
      
      storage.setItem(key, value);
    } catch (error) {
      console.error(`Failed to import key ${key}:`, error);
    }
  }
};

/**
 * 创建存储管理器类
 */
export class StorageManager {
  private type: StorageType;
  private prefix: string;
  
  constructor(type: StorageType = 'localStorage', prefix = '') {
    this.type = type;
    this.prefix = prefix;
  }
  
  private getKey(key: string): string {
    return this.prefix ? `${this.prefix}_${key}` : key;
  }
  
  set<T>(key: string, value: T, options?: StorageOptions): void {
    setStorageItem(this.getKey(key), value, {
      ...options,
      type: this.type,
    });
  }
  
  get<T>(key: string, defaultValue?: T): T | undefined {
    return getStorageItem(this.getKey(key), defaultValue, this.type);
  }
  
  remove(key: string): void {
    removeStorageItem(this.getKey(key), this.type);
  }
  
  has(key: string): boolean {
    return hasStorageItem(this.getKey(key), this.type);
  }
  
  clear(): void {
    if (this.prefix) {
      // 只清理带前缀的项
      const keys = getStorageKeys(this.type);
      const prefixedKeys = keys.filter(k => k.startsWith(`${this.prefix}_`));
      
      for (const key of prefixedKeys) {
        removeStorageItem(key, this.type);
      }
    } else {
      clearStorage(this.type);
    }
  }
  
  getSize(): number {
    if (this.prefix) {
      const storage = getStorage(this.type);
      const keys = getStorageKeys(this.type);
      const prefixedKeys = keys.filter(k => k.startsWith(`${this.prefix}_`));
      
      let size = 0;
      for (const key of prefixedKeys) {
        const value = storage.getItem(key);
        if (value) {
          size += key.length + value.length;
        }
      }
      return size;
    }
    
    return getStorageSize(this.type);
  }
  
  getKeys(): string[] {
    const keys = getStorageKeys(this.type);
    
    if (this.prefix) {
      return keys
        .filter(k => k.startsWith(`${this.prefix}_`))
        .map(k => k.slice(this.prefix.length + 1));
    }
    
    return keys;
  }
  
  cleanExpired(): number {
    return cleanExpiredItems(this.type);
  }
  
  export(keys?: string[]): Record<string, any> {
    const targetKeys = keys?.map(k => this.getKey(k));
    return exportStorageData(this.type, targetKeys);
  }
  
  import(data: Record<string, any>, overwrite = false): void {
    const prefixedData: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      prefixedData[this.getKey(key)] = value;
    }
    
    importStorageData(prefixedData, this.type, overwrite);
  }
}

/**
 * 创建默认的存储管理器实例
 */
export const localStorage = new StorageManager('localStorage');
export const sessionStorage = new StorageManager('sessionStorage');

/**
 * 监听存储变化
 * @param callback 回调函数
 * @param key 监听的键名（可选）
 * @returns 取消监听的函数
 */
export const watchStorage = (
  callback: (event: StorageEvent) => void,
  key?: string
): (() => void) => {
  const handler = (event: StorageEvent) => {
    if (!key || event.key === key) {
      callback(event);
    }
  };
  
  window.addEventListener('storage', handler);
  
  return () => {
    window.removeEventListener('storage', handler);
  };
};

/**
 * 存储配额管理
 */
export const storageQuota = {
  /**
   * 获取存储配额信息
   * @returns Promise<StorageEstimate>
   */
  async getQuota(): Promise<StorageEstimate | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        return await navigator.storage.estimate();
      } catch (error) {
        console.error('Failed to get storage quota:', error);
      }
    }
    return null;
  },
  
  /**
   * 检查是否有足够的存储空间
   * @param requiredBytes 需要的字节数
   * @returns Promise<boolean>
   */
  async hasEnoughSpace(requiredBytes: number): Promise<boolean> {
    const quota = await this.getQuota();
    
    if (!quota || !quota.quota || !quota.usage) {
      return true; // 无法确定时假设有足够空间
    }
    
    const availableBytes = quota.quota - quota.usage;
    return availableBytes >= requiredBytes;
  },
  
  /**
   * 获取存储使用率
   * @returns Promise<number> 使用率（0-1）
   */
  async getUsageRatio(): Promise<number> {
    const quota = await this.getQuota();
    
    if (!quota || !quota.quota || !quota.usage) {
      return 0;
    }
    
    return quota.usage / quota.quota;
  },
};