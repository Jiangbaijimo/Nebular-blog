// 文件处理工具函数

/**
 * 文件大小单位
 */
const FILE_SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @param decimals 小数位数
 * @returns 格式化后的文件大小
 */
export const formatFileSize = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${FILE_SIZE_UNITS[i]}`;
};

/**
 * 解析文件大小字符串为字节数
 * @param sizeStr 文件大小字符串（如 "10MB"）
 * @returns 字节数
 */
export const parseFileSize = (sizeStr: string): number => {
  const match = sizeStr.match(/^([0-9.]+)\s*([A-Z]+)$/i);
  if (!match) return 0;
  
  const [, size, unit] = match;
  const bytes = parseFloat(size);
  const unitIndex = FILE_SIZE_UNITS.findIndex(
    u => u.toLowerCase() === unit.toLowerCase()
  );
  
  if (unitIndex === -1) return 0;
  
  return bytes * Math.pow(1024, unitIndex);
};

/**
 * 获取文件扩展名
 * @param filename 文件名
 * @returns 扩展名（不包含点）
 */
export const getFileExtension = (filename: string): string => {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
    return '';
  }
  return filename.slice(lastDotIndex + 1).toLowerCase();
};

/**
 * 获取文件名（不包含扩展名）
 * @param filename 文件名
 * @returns 文件名（不包含扩展名）
 */
export const getFileNameWithoutExtension = (filename: string): string => {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return filename;
  }
  return filename.slice(0, lastDotIndex);
};

/**
 * 获取文件类型
 * @param filename 文件名或MIME类型
 * @returns 文件类型
 */
export const getFileType = (filename: string): string => {
  // 如果是MIME类型
  if (filename.includes('/')) {
    const [type] = filename.split('/');
    return type;
  }
  
  // 根据扩展名判断
  const extension = getFileExtension(filename);
  
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', '3gp'];
  const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a'];
  const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf'];
  const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'];
  const codeExtensions = ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'less', 'json', 'xml', 'yaml', 'yml', 'md', 'py', 'java', 'c', 'cpp', 'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt'];
  
  if (imageExtensions.includes(extension)) return 'image';
  if (videoExtensions.includes(extension)) return 'video';
  if (audioExtensions.includes(extension)) return 'audio';
  if (documentExtensions.includes(extension)) return 'document';
  if (archiveExtensions.includes(extension)) return 'archive';
  if (codeExtensions.includes(extension)) return 'code';
  
  return 'other';
};

/**
 * 检查文件类型是否被支持
 * @param file 文件对象或文件名
 * @param allowedTypes 允许的类型数组
 * @returns 是否支持
 */
export const isFileTypeAllowed = (
  file: File | string,
  allowedTypes: string[]
): boolean => {
  const mimeType = typeof file === 'string' ? file : file.type;
  const filename = typeof file === 'string' ? file : file.name;
  
  // 检查MIME类型
  if (mimeType && allowedTypes.includes(mimeType)) {
    return true;
  }
  
  // 检查扩展名
  const extension = getFileExtension(filename);
  return allowedTypes.some(type => {
    if (type.startsWith('.')) {
      return type.slice(1).toLowerCase() === extension;
    }
    if (type.includes('/')) {
      return type === mimeType;
    }
    return type.toLowerCase() === extension;
  });
};

/**
 * 检查文件大小是否超出限制
 * @param file 文件对象
 * @param maxSize 最大大小（字节）
 * @returns 是否超出限制
 */
export const isFileSizeExceeded = (file: File, maxSize: number): boolean => {
  return file.size > maxSize;
};

/**
 * 读取文件为文本
 * @param file 文件对象
 * @param encoding 编码
 * @returns Promise<string>
 */
export const readFileAsText = (
  file: File,
  encoding = 'UTF-8'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      resolve(event.target?.result as string);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file, encoding);
  });
};

/**
 * 读取文件为Data URL
 * @param file 文件对象
 * @returns Promise<string>
 */
export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      resolve(event.target?.result as string);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * 读取文件为ArrayBuffer
 * @param file 文件对象
 * @returns Promise<ArrayBuffer>
 */
export const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      resolve(event.target?.result as ArrayBuffer);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * 压缩图片
 * @param file 图片文件
 * @param options 压缩选项
 * @returns Promise<File>
 */
export const compressImage = (
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    outputFormat?: string;
  } = {}
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      outputFormat = 'image/jpeg',
    } = options;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // 计算新的尺寸
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      // 设置画布尺寸
      canvas.width = width;
      canvas.height = height;
      
      // 绘制图片
      ctx?.drawImage(img, 0, 0, width, height);
      
      // 转换为Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: outputFormat,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        outputFormat,
        quality
      );
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * 生成缩略图
 * @param file 图片文件
 * @param size 缩略图尺寸
 * @returns Promise<string> Data URL
 */
export const generateThumbnail = (
  file: File,
  size = 150
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // 计算缩略图尺寸（保持宽高比）
      const { width, height } = img;
      const aspectRatio = width / height;
      
      let thumbWidth = size;
      let thumbHeight = size;
      
      if (aspectRatio > 1) {
        thumbHeight = size / aspectRatio;
      } else {
        thumbWidth = size * aspectRatio;
      }
      
      // 设置画布尺寸
      canvas.width = thumbWidth;
      canvas.height = thumbHeight;
      
      // 绘制缩略图
      ctx?.drawImage(img, 0, 0, thumbWidth, thumbHeight);
      
      // 转换为Data URL
      const dataURL = canvas.toDataURL('image/jpeg', 0.8);
      resolve(dataURL);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to generate thumbnail'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * 下载文件
 * @param data 文件数据（Blob、File或URL）
 * @param filename 文件名
 */
export const downloadFile = (
  data: Blob | File | string,
  filename: string
): void => {
  const link = document.createElement('a');
  
  if (typeof data === 'string') {
    // URL
    link.href = data;
  } else {
    // Blob或File
    link.href = URL.createObjectURL(data);
  }
  
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // 清理URL对象
  if (typeof data !== 'string') {
    URL.revokeObjectURL(link.href);
  }
};

/**
 * 下载文本文件
 * @param content 文本内容
 * @param filename 文件名
 * @param mimeType MIME类型
 */
export const downloadTextFile = (
  content: string,
  filename: string,
  mimeType = 'text/plain'
): void => {
  const blob = new Blob([content], { type: mimeType });
  downloadFile(blob, filename);
};

/**
 * 下载JSON文件
 * @param data JSON数据
 * @param filename 文件名
 */
export const downloadJsonFile = (
  data: any,
  filename: string
): void => {
  const content = JSON.stringify(data, null, 2);
  downloadTextFile(content, filename, 'application/json');
};

/**
 * 复制文件到剪贴板
 * @param file 文件对象
 * @returns Promise<void>
 */
export const copyFileToClipboard = async (file: File): Promise<void> => {
  if (!navigator.clipboard || !navigator.clipboard.write) {
    throw new Error('Clipboard API not supported');
  }
  
  const clipboardItem = new ClipboardItem({
    [file.type]: file,
  });
  
  await navigator.clipboard.write([clipboardItem]);
};

/**
 * 从剪贴板粘贴文件
 * @returns Promise<File[]>
 */
export const pasteFilesFromClipboard = async (): Promise<File[]> => {
  if (!navigator.clipboard || !navigator.clipboard.read) {
    throw new Error('Clipboard API not supported');
  }
  
  const clipboardItems = await navigator.clipboard.read();
  const files: File[] = [];
  
  for (const item of clipboardItems) {
    for (const type of item.types) {
      if (type.startsWith('image/')) {
        const blob = await item.getType(type);
        const file = new File([blob], `pasted-image.${type.split('/')[1]}`, {
          type,
          lastModified: Date.now(),
        });
        files.push(file);
      }
    }
  }
  
  return files;
};

/**
 * 验证文件
 * @param file 文件对象
 * @param rules 验证规则
 * @returns 验证结果
 */
export const validateFile = (
  file: File,
  rules: {
    allowedTypes?: string[];
    maxSize?: number;
    minSize?: number;
    maxNameLength?: number;
  }
): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  // 检查文件类型
  if (rules.allowedTypes && !isFileTypeAllowed(file, rules.allowedTypes)) {
    errors.push(`不支持的文件类型: ${file.type || getFileExtension(file.name)}`);
  }
  
  // 检查文件大小
  if (rules.maxSize && file.size > rules.maxSize) {
    errors.push(`文件大小超出限制: ${formatFileSize(file.size)} > ${formatFileSize(rules.maxSize)}`);
  }
  
  if (rules.minSize && file.size < rules.minSize) {
    errors.push(`文件大小低于最小限制: ${formatFileSize(file.size)} < ${formatFileSize(rules.minSize)}`);
  }
  
  // 检查文件名长度
  if (rules.maxNameLength && file.name.length > rules.maxNameLength) {
    errors.push(`文件名过长: ${file.name.length} > ${rules.maxNameLength}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 批量验证文件
 * @param files 文件数组
 * @param rules 验证规则
 * @returns 验证结果
 */
export const validateFiles = (
  files: File[],
  rules: {
    allowedTypes?: string[];
    maxSize?: number;
    minSize?: number;
    maxNameLength?: number;
    maxCount?: number;
    totalMaxSize?: number;
  }
): {
  isValid: boolean;
  errors: string[];
  fileResults: Array<{ file: File; isValid: boolean; errors: string[] }>;
} => {
  const errors: string[] = [];
  const fileResults: Array<{ file: File; isValid: boolean; errors: string[] }> = [];
  
  // 检查文件数量
  if (rules.maxCount && files.length > rules.maxCount) {
    errors.push(`文件数量超出限制: ${files.length} > ${rules.maxCount}`);
  }
  
  // 检查总文件大小
  if (rules.totalMaxSize) {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > rules.totalMaxSize) {
      errors.push(`总文件大小超出限制: ${formatFileSize(totalSize)} > ${formatFileSize(rules.totalMaxSize)}`);
    }
  }
  
  // 验证每个文件
  for (const file of files) {
    const result = validateFile(file, rules);
    fileResults.push({
      file,
      isValid: result.isValid,
      errors: result.errors,
    });
    
    if (!result.isValid) {
      errors.push(...result.errors.map(error => `${file.name}: ${error}`));
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    fileResults,
  };
};

/**
 * 创建文件选择器
 * @param options 选择器选项
 * @returns Promise<File[]>
 */
export const createFileSelector = (options: {
  accept?: string;
  multiple?: boolean;
  directory?: boolean;
} = {}): Promise<File[]> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    
    if (options.accept) {
      input.accept = options.accept;
    }
    
    if (options.multiple) {
      input.multiple = true;
    }
    
    if (options.directory) {
      input.webkitdirectory = true;
    }
    
    input.onchange = (event) => {
      const target = event.target as HTMLInputElement;
      const files = Array.from(target.files || []);
      resolve(files);
      document.body.removeChild(input);
    };
    
    input.oncancel = () => {
      reject(new Error('File selection cancelled'));
      document.body.removeChild(input);
    };
    
    document.body.appendChild(input);
    input.click();
  });
};