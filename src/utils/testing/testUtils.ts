import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import userEvent from '@testing-library/user-event';

// 测试配置接口
interface TestConfig {
  initialEntries?: string[];
  store?: any;
  queryClient?: QueryClient;
  theme?: 'light' | 'dark';
  locale?: string;
  user?: any;
  permissions?: string[];
}

// 自定义渲染函数
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  config?: TestConfig;
}

// 创建测试用的 QueryClient
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
};

// 创建测试用的 Store
const createTestStore = (initialState?: any) => {
  return configureStore({
    reducer: {
      // 这里应该导入实际的 reducers
      // auth: authReducer,
      // blog: blogReducer,
      // ui: uiReducer,
    },
    preloadedState: initialState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }),
  });
};

// 测试包装器组件
const TestWrapper: React.FC<{
  children: ReactNode;
  config?: TestConfig;
}> = ({ children, config = {} }) => {
  const {
    initialEntries = ['/'],
    store = createTestStore(),
    queryClient = createTestQueryClient(),
    theme = 'light',
    locale = 'zh-CN',
    user = null,
    permissions = [],
  } = config;

  return (
    <BrowserRouter>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {/* 这里可以添加其他 Provider，如 ThemeProvider, I18nProvider 等 */}
          <div data-theme={theme} data-locale={locale} data-testid="test-wrapper">
            {children}
          </div>
        </QueryClientProvider>
      </Provider>
    </BrowserRouter>
  );
};

// 自定义渲染函数
export const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { user: ReturnType<typeof userEvent.setup> } => {
  const { config, ...renderOptions } = options;
  
  const user = userEvent.setup();
  
  const result = render(ui, {
    wrapper: ({ children }) => <TestWrapper config={config}>{children}</TestWrapper>,
    ...renderOptions,
  });
  
  return {
    ...result,
    user,
  };
};

// 测试工具类
export class TestUtils {
  // 等待元素出现
  static async waitForElement(
    getElement: () => HTMLElement | null,
    timeout = 5000
  ): Promise<HTMLElement> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const check = () => {
        const element = getElement();
        if (element) {
          resolve(element);
          return;
        }
        
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Element not found within ${timeout}ms`));
          return;
        }
        
        setTimeout(check, 100);
      };
      
      check();
    });
  }
  
  // 等待条件满足
  static async waitForCondition(
    condition: () => boolean,
    timeout = 5000
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const check = () => {
        if (condition()) {
          resolve();
          return;
        }
        
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Condition not met within ${timeout}ms`));
          return;
        }
        
        setTimeout(check, 100);
      };
      
      check();
    });
  }
  
  // 模拟网络延迟
  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // 模拟文件上传
  static createMockFile(
    name: string,
    size: number,
    type: string,
    content?: string
  ): File {
    const file = new File([content || 'mock content'], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  }
  
  // 模拟图片文件
  static createMockImageFile(
    name = 'test.jpg',
    width = 100,
    height = 100
  ): File {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    return new Promise<File>((resolve) => {
      canvas.toBlob((blob) => {
        const file = new File([blob!], name, { type: 'image/jpeg' });
        resolve(file);
      }, 'image/jpeg');
    }) as any;
  }
  
  // 模拟拖拽事件
  static createDragEvent(
    type: string,
    files: File[] = []
  ): DragEvent {
    const event = new DragEvent(type, {
      bubbles: true,
      cancelable: true,
    });
    
    Object.defineProperty(event, 'dataTransfer', {
      value: {
        files,
        items: files.map(file => ({ kind: 'file', type: file.type, getAsFile: () => file })),
        types: ['Files'],
      },
    });
    
    return event;
  }
  
  // 模拟剪贴板事件
  static createClipboardEvent(
    type: string,
    data: { [format: string]: string } = {}
  ): ClipboardEvent {
    const event = new ClipboardEvent(type, {
      bubbles: true,
      cancelable: true,
    });
    
    Object.defineProperty(event, 'clipboardData', {
      value: {
        getData: (format: string) => data[format] || '',
        setData: (format: string, value: string) => {
          data[format] = value;
        },
        types: Object.keys(data),
      },
    });
    
    return event;
  }
  
  // 模拟键盘事件
  static createKeyboardEvent(
    type: string,
    key: string,
    options: {
      ctrlKey?: boolean;
      shiftKey?: boolean;
      altKey?: boolean;
      metaKey?: boolean;
    } = {}
  ): KeyboardEvent {
    return new KeyboardEvent(type, {
      key,
      bubbles: true,
      cancelable: true,
      ...options,
    });
  }
  
  // 模拟鼠标事件
  static createMouseEvent(
    type: string,
    options: {
      clientX?: number;
      clientY?: number;
      button?: number;
      buttons?: number;
    } = {}
  ): MouseEvent {
    return new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      ...options,
    });
  }
  
  // 模拟触摸事件
  static createTouchEvent(
    type: string,
    touches: Array<{
      clientX: number;
      clientY: number;
      identifier?: number;
    }> = []
  ): TouchEvent {
    const touchList = touches.map((touch, index) => ({
      ...touch,
      identifier: touch.identifier ?? index,
      target: document.body,
      radiusX: 1,
      radiusY: 1,
      rotationAngle: 0,
      force: 1,
    }));
    
    return new TouchEvent(type, {
      bubbles: true,
      cancelable: true,
      touches: touchList as any,
      targetTouches: touchList as any,
      changedTouches: touchList as any,
    });
  }
  
  // 模拟滚动事件
  static createScrollEvent(
    target: Element,
    scrollTop: number,
    scrollLeft = 0
  ): void {
    Object.defineProperty(target, 'scrollTop', {
      value: scrollTop,
      writable: true,
    });
    Object.defineProperty(target, 'scrollLeft', {
      value: scrollLeft,
      writable: true,
    });
    
    target.dispatchEvent(new Event('scroll', { bubbles: true }));
  }
  
  // 模拟窗口大小变化
  static resizeWindow(width: number, height: number): void {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
    
    window.dispatchEvent(new Event('resize'));
  }
  
  // 模拟网络状态变化
  static setOnlineStatus(online: boolean): void {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: online,
    });
    
    window.dispatchEvent(new Event(online ? 'online' : 'offline'));
  }
  
  // 模拟地理位置
  static mockGeolocation(
    latitude: number,
    longitude: number,
    accuracy = 10
  ): void {
    const mockGeolocation = {
      getCurrentPosition: jest.fn().mockImplementation((success) => {
        success({
          coords: {
            latitude,
            longitude,
            accuracy,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        });
      }),
      watchPosition: jest.fn(),
      clearWatch: jest.fn(),
    };
    
    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
    });
  }
  
  // 模拟本地存储
  static mockLocalStorage(): {
    getItem: jest.Mock;
    setItem: jest.Mock;
    removeItem: jest.Mock;
    clear: jest.Mock;
  } {
    const store: { [key: string]: string } = {};
    
    const mockStorage = {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
    };
    
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      configurable: true,
    });
    
    return mockStorage;
  }
  
  // 模拟 IndexedDB
  static mockIndexedDB(): void {
    // 这里可以使用 fake-indexeddb 库
    // import FDBFactory from 'fake-indexeddb/lib/FDBFactory';
    // import FDBKeyRange from 'fake-indexeddb/lib/FDBKeyRange';
    
    // Object.defineProperty(window, 'indexedDB', {
    //   value: new FDBFactory(),
    //   configurable: true,
    // });
    
    // Object.defineProperty(window, 'IDBKeyRange', {
    //   value: FDBKeyRange,
    //   configurable: true,
    // });
  }
  
  // 模拟 Intersection Observer
  static mockIntersectionObserver(): {
    observe: jest.Mock;
    unobserve: jest.Mock;
    disconnect: jest.Mock;
  } {
    const mockIntersectionObserver = {
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    };
    
    Object.defineProperty(window, 'IntersectionObserver', {
      value: jest.fn().mockImplementation(() => mockIntersectionObserver),
      configurable: true,
    });
    
    return mockIntersectionObserver;
  }
  
  // 模拟 ResizeObserver
  static mockResizeObserver(): {
    observe: jest.Mock;
    unobserve: jest.Mock;
    disconnect: jest.Mock;
  } {
    const mockResizeObserver = {
      observe: jest.fn(),
      unobserve: jest.Mock(),
      disconnect: jest.fn(),
    };
    
    Object.defineProperty(window, 'ResizeObserver', {
      value: jest.fn().mockImplementation(() => mockResizeObserver),
      configurable: true,
    });
    
    return mockResizeObserver;
  }
  
  // 模拟 MutationObserver
  static mockMutationObserver(): {
    observe: jest.Mock;
    disconnect: jest.Mock;
    takeRecords: jest.Mock;
  } {
    const mockMutationObserver = {
      observe: jest.fn(),
      disconnect: jest.fn(),
      takeRecords: jest.fn().mockReturnValue([]),
    };
    
    Object.defineProperty(window, 'MutationObserver', {
      value: jest.fn().mockImplementation(() => mockMutationObserver),
      configurable: true,
    });
    
    return mockMutationObserver;
  }
  
  // 模拟 Web Workers
  static mockWebWorker(): {
    postMessage: jest.Mock;
    terminate: jest.Mock;
    addEventListener: jest.Mock;
    removeEventListener: jest.Mock;
  } {
    const mockWorker = {
      postMessage: jest.fn(),
      terminate: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    
    Object.defineProperty(window, 'Worker', {
      value: jest.fn().mockImplementation(() => mockWorker),
      configurable: true,
    });
    
    return mockWorker;
  }
  
  // 模拟 Fetch API
  static mockFetch(
    responses: Array<{
      url?: string | RegExp;
      method?: string;
      status?: number;
      data?: any;
      delay?: number;
    }>
  ): jest.Mock {
    const mockFetch = jest.fn().mockImplementation(async (url: string, options: any = {}) => {
      const method = options.method || 'GET';
      
      // 找到匹配的响应配置
      const response = responses.find(r => {
        const urlMatch = !r.url || 
          (typeof r.url === 'string' ? url.includes(r.url) : r.url.test(url));
        const methodMatch = !r.method || r.method === method;
        return urlMatch && methodMatch;
      });
      
      if (!response) {
        throw new Error(`No mock response found for ${method} ${url}`);
      }
      
      // 模拟延迟
      if (response.delay) {
        await TestUtils.delay(response.delay);
      }
      
      const mockResponse = {
        ok: (response.status || 200) < 400,
        status: response.status || 200,
        statusText: response.status === 404 ? 'Not Found' : 'OK',
        json: async () => response.data,
        text: async () => JSON.stringify(response.data),
        blob: async () => new Blob([JSON.stringify(response.data)]),
        arrayBuffer: async () => new ArrayBuffer(0),
        headers: new Headers(),
        url,
        redirected: false,
        type: 'basic' as ResponseType,
        clone: () => mockResponse,
      };
      
      return mockResponse;
    });
    
    Object.defineProperty(window, 'fetch', {
      value: mockFetch,
      configurable: true,
    });
    
    return mockFetch;
  }
  
  // 清理所有模拟
  static cleanup(): void {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  }
}

// 测试数据生成器
export class TestDataGenerator {
  // 生成随机字符串
  static randomString(length = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  // 生成随机数字
  static randomNumber(min = 0, max = 100): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  // 生成随机邮箱
  static randomEmail(): string {
    return `${this.randomString(8)}@${this.randomString(5)}.com`;
  }
  
  // 生成随机日期
  static randomDate(start?: Date, end?: Date): Date {
    const startTime = start ? start.getTime() : Date.now() - 365 * 24 * 60 * 60 * 1000;
    const endTime = end ? end.getTime() : Date.now();
    return new Date(startTime + Math.random() * (endTime - startTime));
  }
  
  // 生成模拟用户数据
  static mockUser(overrides: any = {}) {
    return {
      id: this.randomString(8),
      username: this.randomString(8),
      email: this.randomEmail(),
      avatar: `https://picsum.photos/100/100?random=${this.randomNumber()}`,
      createdAt: this.randomDate(),
      isActive: Math.random() > 0.5,
      ...overrides,
    };
  }
  
  // 生成模拟博客数据
  static mockBlogPost(overrides: any = {}) {
    return {
      id: this.randomString(8),
      title: `Test Blog Post ${this.randomString(5)}`,
      content: `This is a test blog post content. ${this.randomString(100)}`,
      excerpt: `This is a test excerpt. ${this.randomString(50)}`,
      author: this.mockUser(),
      tags: Array.from({ length: this.randomNumber(1, 5) }, () => this.randomString(6)),
      category: this.randomString(8),
      publishedAt: this.randomDate(),
      updatedAt: this.randomDate(),
      isPublished: Math.random() > 0.3,
      viewCount: this.randomNumber(0, 1000),
      likeCount: this.randomNumber(0, 100),
      commentCount: this.randomNumber(0, 50),
      ...overrides,
    };
  }
  
  // 生成模拟评论数据
  static mockComment(overrides: any = {}) {
    return {
      id: this.randomString(8),
      content: `This is a test comment. ${this.randomString(50)}`,
      author: this.mockUser(),
      postId: this.randomString(8),
      parentId: Math.random() > 0.7 ? this.randomString(8) : null,
      createdAt: this.randomDate(),
      updatedAt: this.randomDate(),
      isApproved: Math.random() > 0.2,
      likeCount: this.randomNumber(0, 20),
      ...overrides,
    };
  }
  
  // 生成模拟分类数据
  static mockCategory(overrides: any = {}) {
    return {
      id: this.randomString(8),
      name: `Category ${this.randomString(6)}`,
      slug: this.randomString(8).toLowerCase(),
      description: `This is a test category. ${this.randomString(30)}`,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      postCount: this.randomNumber(0, 50),
      isActive: Math.random() > 0.1,
      ...overrides,
    };
  }
  
  // 生成模拟标签数据
  static mockTag(overrides: any = {}) {
    return {
      id: this.randomString(8),
      name: this.randomString(6),
      slug: this.randomString(8).toLowerCase(),
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      postCount: this.randomNumber(0, 30),
      ...overrides,
    };
  }
  
  // 生成模拟媒体文件数据
  static mockMediaFile(overrides: any = {}) {
    const types = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/pdf'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    return {
      id: this.randomString(8),
      filename: `${this.randomString(8)}.${type.split('/')[1]}`,
      originalName: `original-${this.randomString(8)}.${type.split('/')[1]}`,
      mimeType: type,
      size: this.randomNumber(1024, 1024 * 1024 * 10), // 1KB to 10MB
      url: `https://picsum.photos/800/600?random=${this.randomNumber()}`,
      thumbnailUrl: `https://picsum.photos/200/150?random=${this.randomNumber()}`,
      uploadedAt: this.randomDate(),
      uploadedBy: this.mockUser(),
      alt: `Alt text for ${this.randomString(10)}`,
      caption: `Caption for ${this.randomString(15)}`,
      ...overrides,
    };
  }
}

// 断言助手
export class TestAssertions {
  // 断言元素可见
  static expectVisible(element: HTMLElement): void {
    expect(element).toBeInTheDocument();
    expect(element).toBeVisible();
  }
  
  // 断言元素隐藏
  static expectHidden(element: HTMLElement | null): void {
    if (element) {
      expect(element).not.toBeVisible();
    } else {
      expect(element).not.toBeInTheDocument();
    }
  }
  
  // 断言元素包含文本
  static expectText(element: HTMLElement, text: string | RegExp): void {
    expect(element).toHaveTextContent(text);
  }
  
  // 断言元素有特定类名
  static expectClass(element: HTMLElement, className: string): void {
    expect(element).toHaveClass(className);
  }
  
  // 断言元素有特定属性
  static expectAttribute(element: HTMLElement, attribute: string, value?: string): void {
    if (value !== undefined) {
      expect(element).toHaveAttribute(attribute, value);
    } else {
      expect(element).toHaveAttribute(attribute);
    }
  }
  
  // 断言表单字段值
  static expectFieldValue(element: HTMLInputElement | HTMLTextAreaElement, value: string): void {
    expect(element).toHaveValue(value);
  }
  
  // 断言元素被禁用
  static expectDisabled(element: HTMLElement): void {
    expect(element).toBeDisabled();
  }
  
  // 断言元素被启用
  static expectEnabled(element: HTMLElement): void {
    expect(element).toBeEnabled();
  }
  
  // 断言元素被选中
  static expectChecked(element: HTMLInputElement): void {
    expect(element).toBeChecked();
  }
  
  // 断言元素未被选中
  static expectUnchecked(element: HTMLInputElement): void {
    expect(element).not.toBeChecked();
  }
  
  // 断言元素获得焦点
  static expectFocused(element: HTMLElement): void {
    expect(element).toHaveFocus();
  }
  
  // 断言 API 调用
  static expectApiCall(
    mockFetch: jest.Mock,
    url: string | RegExp,
    method = 'GET',
    callIndex = 0
  ): void {
    expect(mockFetch).toHaveBeenCalled();
    const call = mockFetch.mock.calls[callIndex];
    expect(call[0]).toMatch(url);
    if (call[1]) {
      expect(call[1].method || 'GET').toBe(method);
    }
  }
  
  // 断言错误消息
  static expectErrorMessage(container: HTMLElement, message: string | RegExp): void {
    const errorElement = container.querySelector('[role="alert"], .error, .error-message');
    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveTextContent(message);
  }
  
  // 断言成功消息
  static expectSuccessMessage(container: HTMLElement, message: string | RegExp): void {
    const successElement = container.querySelector('.success, .success-message, [data-testid="success"]');
    expect(successElement).toBeInTheDocument();
    expect(successElement).toHaveTextContent(message);
  }
  
  // 断言加载状态
  static expectLoading(container: HTMLElement): void {
    const loadingElement = container.querySelector('.loading, .spinner, [data-testid="loading"]');
    expect(loadingElement).toBeInTheDocument();
  }
  
  // 断言非加载状态
  static expectNotLoading(container: HTMLElement): void {
    const loadingElement = container.querySelector('.loading, .spinner, [data-testid="loading"]');
    expect(loadingElement).not.toBeInTheDocument();
  }
}

// 重新导出常用的测试工具
export { screen, waitFor, fireEvent, act } from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// 默认导出自定义渲染函数
export default customRender;