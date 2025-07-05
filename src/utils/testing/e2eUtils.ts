import { Page, Browser, BrowserContext, expect as playwrightExpect } from '@playwright/test';
import { TestDataGenerator } from './testUtils';

// E2E 测试配置接口
interface E2EConfig {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  headless?: boolean;
  slowMo?: number;
  viewport?: { width: number; height: number };
  locale?: string;
  timezone?: string;
  permissions?: string[];
  geolocation?: { latitude: number; longitude: number };
  colorScheme?: 'light' | 'dark';
  reducedMotion?: 'reduce' | 'no-preference';
}

// 页面对象基类
export abstract class BasePage {
  protected page: Page;
  protected baseURL: string;
  
  constructor(page: Page, baseURL = 'http://localhost:3000') {
    this.page = page;
    this.baseURL = baseURL;
  }
  
  // 导航到页面
  abstract goto(): Promise<void>;
  
  // 等待页面加载完成
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }
  
  // 等待元素出现
  async waitForElement(selector: string, timeout = 10000): Promise<void> {
    await this.page.waitForSelector(selector, { timeout });
  }
  
  // 等待元素消失
  async waitForElementToDisappear(selector: string, timeout = 10000): Promise<void> {
    await this.page.waitForSelector(selector, { state: 'detached', timeout });
  }
  
  // 等待文本出现
  async waitForText(text: string, timeout = 10000): Promise<void> {
    await this.page.waitForFunction(
      (text) => document.body.textContent?.includes(text),
      text,
      { timeout }
    );
  }
  
  // 截图
  async screenshot(name: string, options?: any): Promise<void> {
    await this.page.screenshot({
      path: `screenshots/${name}.png`,
      fullPage: true,
      ...options,
    });
  }
  
  // 滚动到元素
  async scrollToElement(selector: string): Promise<void> {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }
  
  // 模拟键盘输入
  async typeText(selector: string, text: string, delay = 50): Promise<void> {
    await this.page.locator(selector).type(text, { delay });
  }
  
  // 清空输入框并输入新文本
  async fillText(selector: string, text: string): Promise<void> {
    await this.page.locator(selector).fill(text);
  }
  
  // 点击元素
  async click(selector: string, options?: any): Promise<void> {
    await this.page.locator(selector).click(options);
  }
  
  // 双击元素
  async doubleClick(selector: string): Promise<void> {
    await this.page.locator(selector).dblclick();
  }
  
  // 右键点击
  async rightClick(selector: string): Promise<void> {
    await this.page.locator(selector).click({ button: 'right' });
  }
  
  // 悬停
  async hover(selector: string): Promise<void> {
    await this.page.locator(selector).hover();
  }
  
  // 拖拽
  async dragAndDrop(sourceSelector: string, targetSelector: string): Promise<void> {
    await this.page.locator(sourceSelector).dragTo(this.page.locator(targetSelector));
  }
  
  // 选择下拉选项
  async selectOption(selector: string, value: string): Promise<void> {
    await this.page.locator(selector).selectOption(value);
  }
  
  // 上传文件
  async uploadFile(selector: string, filePath: string): Promise<void> {
    await this.page.locator(selector).setInputFiles(filePath);
  }
  
  // 检查元素是否可见
  async isVisible(selector: string): Promise<boolean> {
    return await this.page.locator(selector).isVisible();
  }
  
  // 检查元素是否存在
  async isPresent(selector: string): Promise<boolean> {
    return await this.page.locator(selector).count() > 0;
  }
  
  // 获取元素文本
  async getText(selector: string): Promise<string> {
    return await this.page.locator(selector).textContent() || '';
  }
  
  // 获取元素属性
  async getAttribute(selector: string, attribute: string): Promise<string | null> {
    return await this.page.locator(selector).getAttribute(attribute);
  }
  
  // 获取输入框值
  async getValue(selector: string): Promise<string> {
    return await this.page.locator(selector).inputValue();
  }
  
  // 等待导航
  async waitForNavigation(url?: string): Promise<void> {
    if (url) {
      await this.page.waitForURL(url);
    } else {
      await this.page.waitForLoadState('networkidle');
    }
  }
  
  // 刷新页面
  async refresh(): Promise<void> {
    await this.page.reload();
  }
  
  // 返回上一页
  async goBack(): Promise<void> {
    await this.page.goBack();
  }
  
  // 前进到下一页
  async goForward(): Promise<void> {
    await this.page.goForward();
  }
  
  // 获取当前 URL
  getCurrentURL(): string {
    return this.page.url();
  }
  
  // 获取页面标题
  async getTitle(): Promise<string> {
    return await this.page.title();
  }
  
  // 执行 JavaScript
  async executeScript(script: string, ...args: any[]): Promise<any> {
    return await this.page.evaluate(script, ...args);
  }
  
  // 模拟网络条件
  async setNetworkConditions(conditions: {
    offline?: boolean;
    downloadThroughput?: number;
    uploadThroughput?: number;
    latency?: number;
  }): Promise<void> {
    await this.page.route('**/*', route => {
      if (conditions.offline) {
        route.abort();
      } else {
        route.continue();
      }
    });
  }
  
  // 模拟地理位置
  async setGeolocation(latitude: number, longitude: number): Promise<void> {
    await this.page.context().setGeolocation({ latitude, longitude });
  }
  
  // 设置视口大小
  async setViewportSize(width: number, height: number): Promise<void> {
    await this.page.setViewportSize({ width, height });
  }
  
  // 模拟设备
  async emulateDevice(device: string): Promise<void> {
    // 这里需要根据 Playwright 的设备列表来实现
    // const devices = require('@playwright/test').devices;
    // await this.page.context().setViewportSize(devices[device].viewport);
  }
  
  // 添加 Cookie
  async addCookie(cookie: {
    name: string;
    value: string;
    domain?: string;
    path?: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
  }): Promise<void> {
    await this.page.context().addCookies([{
      ...cookie,
      url: this.baseURL,
    }]);
  }
  
  // 获取所有 Cookie
  async getCookies(): Promise<any[]> {
    return await this.page.context().cookies();
  }
  
  // 清除 Cookie
  async clearCookies(): Promise<void> {
    await this.page.context().clearCookies();
  }
  
  // 设置本地存储
  async setLocalStorage(key: string, value: string): Promise<void> {
    await this.page.evaluate(
      ({ key, value }) => localStorage.setItem(key, value),
      { key, value }
    );
  }
  
  // 获取本地存储
  async getLocalStorage(key: string): Promise<string | null> {
    return await this.page.evaluate(
      (key) => localStorage.getItem(key),
      key
    );
  }
  
  // 清除本地存储
  async clearLocalStorage(): Promise<void> {
    await this.page.evaluate(() => localStorage.clear());
  }
  
  // 等待 API 响应
  async waitForResponse(
    urlPattern: string | RegExp,
    timeout = 30000
  ): Promise<any> {
    const response = await this.page.waitForResponse(urlPattern, { timeout });
    return await response.json();
  }
  
  // 拦截 API 请求
  async interceptRequest(
    urlPattern: string | RegExp,
    mockResponse: any
  ): Promise<void> {
    await this.page.route(urlPattern, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse),
      });
    });
  }
  
  // 模拟网络错误
  async simulateNetworkError(urlPattern: string | RegExp): Promise<void> {
    await this.page.route(urlPattern, route => {
      route.abort('failed');
    });
  }
  
  // 模拟慢速网络
  async simulateSlowNetwork(
    urlPattern: string | RegExp,
    delay: number
  ): Promise<void> {
    await this.page.route(urlPattern, async route => {
      await new Promise(resolve => setTimeout(resolve, delay));
      route.continue();
    });
  }
}

// 主页页面对象
export class HomePage extends BasePage {
  async goto(): Promise<void> {
    await this.page.goto(this.baseURL);
    await this.waitForLoad();
  }
  
  async clickBlogLink(): Promise<void> {
    await this.click('[data-testid="blog-link"]');
  }
  
  async clickLoginLink(): Promise<void> {
    await this.click('[data-testid="login-link"]');
  }
  
  async searchBlog(query: string): Promise<void> {
    await this.fillText('[data-testid="search-input"]', query);
    await this.click('[data-testid="search-button"]');
  }
}

// 登录页面对象
export class LoginPage extends BasePage {
  async goto(): Promise<void> {
    await this.page.goto(`${this.baseURL}/login`);
    await this.waitForLoad();
  }
  
  async login(email: string, password: string): Promise<void> {
    await this.fillText('[data-testid="email-input"]', email);
    await this.fillText('[data-testid="password-input"]', password);
    await this.click('[data-testid="login-button"]');
  }
  
  async clickRegisterLink(): Promise<void> {
    await this.click('[data-testid="register-link"]');
  }
  
  async clickForgotPasswordLink(): Promise<void> {
    await this.click('[data-testid="forgot-password-link"]');
  }
  
  async getErrorMessage(): Promise<string> {
    return await this.getText('[data-testid="error-message"]');
  }
}

// 博客页面对象
export class BlogPage extends BasePage {
  async goto(): Promise<void> {
    await this.page.goto(`${this.baseURL}/blog`);
    await this.waitForLoad();
  }
  
  async clickPost(index: number): Promise<void> {
    await this.click(`[data-testid="blog-post-${index}"]`);
  }
  
  async filterByCategory(category: string): Promise<void> {
    await this.click(`[data-testid="category-${category}"]`);
  }
  
  async filterByTag(tag: string): Promise<void> {
    await this.click(`[data-testid="tag-${tag}"]`);
  }
  
  async loadMorePosts(): Promise<void> {
    await this.click('[data-testid="load-more-button"]');
  }
  
  async getPostCount(): Promise<number> {
    return await this.page.locator('[data-testid^="blog-post-"]').count();
  }
}

// 博客详情页面对象
export class BlogDetailPage extends BasePage {
  async goto(postId: string): Promise<void> {
    await this.page.goto(`${this.baseURL}/blog/${postId}`);
    await this.waitForLoad();
  }
  
  async likePost(): Promise<void> {
    await this.click('[data-testid="like-button"]');
  }
  
  async sharePost(): Promise<void> {
    await this.click('[data-testid="share-button"]');
  }
  
  async addComment(content: string): Promise<void> {
    await this.fillText('[data-testid="comment-input"]', content);
    await this.click('[data-testid="submit-comment-button"]');
  }
  
  async replyToComment(commentIndex: number, content: string): Promise<void> {
    await this.click(`[data-testid="reply-button-${commentIndex}"]`);
    await this.fillText(`[data-testid="reply-input-${commentIndex}"]`, content);
    await this.click(`[data-testid="submit-reply-button-${commentIndex}"]`);
  }
  
  async getCommentCount(): Promise<number> {
    return await this.page.locator('[data-testid^="comment-"]').count();
  }
}

// 管理后台页面对象
export class AdminPage extends BasePage {
  async goto(): Promise<void> {
    await this.page.goto(`${this.baseURL}/admin`);
    await this.waitForLoad();
  }
  
  async navigateToSection(section: string): Promise<void> {
    await this.click(`[data-testid="nav-${section}"]`);
  }
  
  async createNewPost(): Promise<void> {
    await this.click('[data-testid="create-post-button"]');
  }
  
  async editPost(postId: string): Promise<void> {
    await this.click(`[data-testid="edit-post-${postId}"]`);
  }
  
  async deletePost(postId: string): Promise<void> {
    await this.click(`[data-testid="delete-post-${postId}"]`);
    await this.click('[data-testid="confirm-delete-button"]');
  }
  
  async publishPost(postId: string): Promise<void> {
    await this.click(`[data-testid="publish-post-${postId}"]`);
  }
  
  async unpublishPost(postId: string): Promise<void> {
    await this.click(`[data-testid="unpublish-post-${postId}"]`);
  }
}

// 编辑器页面对象
export class EditorPage extends BasePage {
  async goto(postId?: string): Promise<void> {
    const url = postId ? `${this.baseURL}/admin/editor/${postId}` : `${this.baseURL}/admin/editor`;
    await this.page.goto(url);
    await this.waitForLoad();
  }
  
  async setTitle(title: string): Promise<void> {
    await this.fillText('[data-testid="title-input"]', title);
  }
  
  async setContent(content: string): Promise<void> {
    // 假设使用富文本编辑器
    await this.page.locator('[data-testid="editor-content"]').fill(content);
  }
  
  async addTag(tag: string): Promise<void> {
    await this.fillText('[data-testid="tag-input"]', tag);
    await this.page.keyboard.press('Enter');
  }
  
  async selectCategory(category: string): Promise<void> {
    await this.selectOption('[data-testid="category-select"]', category);
  }
  
  async uploadFeaturedImage(imagePath: string): Promise<void> {
    await this.uploadFile('[data-testid="featured-image-input"]', imagePath);
  }
  
  async saveDraft(): Promise<void> {
    await this.click('[data-testid="save-draft-button"]');
  }
  
  async publishPost(): Promise<void> {
    await this.click('[data-testid="publish-button"]');
  }
  
  async previewPost(): Promise<void> {
    await this.click('[data-testid="preview-button"]');
  }
  
  async schedulePost(date: string, time: string): Promise<void> {
    await this.click('[data-testid="schedule-button"]');
    await this.fillText('[data-testid="schedule-date"]', date);
    await this.fillText('[data-testid="schedule-time"]', time);
    await this.click('[data-testid="confirm-schedule-button"]');
  }
}

// E2E 测试工具类
export class E2ETestUtils {
  // 设置测试环境
  static async setupTestEnvironment(
    page: Page,
    config: E2EConfig = {}
  ): Promise<void> {
    const {
      viewport = { width: 1280, height: 720 },
      locale = 'zh-CN',
      timezone = 'Asia/Shanghai',
      permissions = [],
      geolocation,
      colorScheme = 'light',
      reducedMotion = 'no-preference',
    } = config;
    
    // 设置视口
    await page.setViewportSize(viewport);
    
    // 设置语言和时区
    await page.context().setExtraHTTPHeaders({
      'Accept-Language': locale,
    });
    
    // 设置权限
    if (permissions.length > 0) {
      await page.context().grantPermissions(permissions);
    }
    
    // 设置地理位置
    if (geolocation) {
      await page.context().setGeolocation(geolocation);
    }
    
    // 设置主题和动画偏好
    await page.emulateMedia({
      colorScheme,
      reducedMotion,
    });
  }
  
  // 创建测试数据
  static async createTestData(page: Page): Promise<{
    user: any;
    posts: any[];
    categories: any[];
    tags: any[];
  }> {
    const user = TestDataGenerator.mockUser({
      email: 'test@example.com',
      password: 'password123',
    });
    
    const categories = Array.from({ length: 5 }, () => TestDataGenerator.mockCategory());
    const tags = Array.from({ length: 10 }, () => TestDataGenerator.mockTag());
    const posts = Array.from({ length: 20 }, () => TestDataGenerator.mockBlogPost({
      category: categories[Math.floor(Math.random() * categories.length)],
      tags: tags.slice(0, Math.floor(Math.random() * 5) + 1),
    }));
    
    // 通过 API 创建测试数据
    await page.request.post('/api/test/setup', {
      data: { user, posts, categories, tags },
    });
    
    return { user, posts, categories, tags };
  }
  
  // 清理测试数据
  static async cleanupTestData(page: Page): Promise<void> {
    await page.request.post('/api/test/cleanup');
  }
  
  // 模拟用户登录
  static async loginUser(
    page: Page,
    email: string,
    password: string
  ): Promise<void> {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(email, password);
    await loginPage.waitForNavigation();
  }
  
  // 模拟用户注销
  static async logoutUser(page: Page): Promise<void> {
    await page.click('[data-testid="logout-button"]');
    await page.waitForURL('/login');
  }
  
  // 等待加载完成
  static async waitForPageLoad(page: Page, timeout = 30000): Promise<void> {
    await page.waitForLoadState('networkidle', { timeout });
    await page.waitForFunction(
      () => document.readyState === 'complete',
      undefined,
      { timeout }
    );
  }
  
  // 等待 API 调用完成
  static async waitForApiCalls(page: Page, timeout = 10000): Promise<void> {
    await page.waitForFunction(
      () => {
        // 检查是否有正在进行的 fetch 请求
        return (window as any).__pendingRequests === 0;
      },
      undefined,
      { timeout }
    );
  }
  
  // 模拟网络延迟
  static async simulateNetworkDelay(
    page: Page,
    delay: number
  ): Promise<void> {
    await page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, delay));
      route.continue();
    });
  }
  
  // 模拟网络错误
  static async simulateNetworkError(
    page: Page,
    urlPattern: string | RegExp
  ): Promise<void> {
    await page.route(urlPattern, route => {
      route.abort('failed');
    });
  }
  
  // 检查控制台错误
  static setupConsoleErrorTracking(page: Page): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    return { errors, warnings };
  }
  
  // 检查网络请求
  static setupNetworkTracking(page: Page): {
    requests: any[];
    responses: any[];
    failures: any[];
  } {
    const requests: any[] = [];
    const responses: any[] = [];
    const failures: any[] = [];
    
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData(),
        timestamp: Date.now(),
      });
    });
    
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        headers: response.headers(),
        timestamp: Date.now(),
      });
    });
    
    page.on('requestfailed', request => {
      failures.push({
        url: request.url(),
        method: request.method(),
        failure: request.failure(),
        timestamp: Date.now(),
      });
    });
    
    return { requests, responses, failures };
  }
  
  // 性能监控
  static async measurePerformance(page: Page): Promise<{
    loadTime: number;
    domContentLoaded: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    firstInputDelay: number;
    cumulativeLayoutShift: number;
  }> {
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        // 其他 Web Vitals 需要通过 web-vitals 库获取
      };
    });
    
    return {
      ...performanceMetrics,
      largestContentfulPaint: 0, // 需要实现
      firstInputDelay: 0, // 需要实现
      cumulativeLayoutShift: 0, // 需要实现
    };
  }
  
  // 可访问性检查
  static async checkAccessibility(page: Page): Promise<{
    violations: any[];
    passes: any[];
  }> {
    // 这里需要集成 axe-core
    const results = await page.evaluate(() => {
      // return axe.run();
      return { violations: [], passes: [] };
    });
    
    return results;
  }
  
  // 视觉回归测试
  static async compareScreenshot(
    page: Page,
    name: string,
    options?: {
      threshold?: number;
      fullPage?: boolean;
      clip?: { x: number; y: number; width: number; height: number };
    }
  ): Promise<boolean> {
    const screenshot = await page.screenshot({
      fullPage: options?.fullPage ?? true,
      clip: options?.clip,
    });
    
    // 这里需要实现图片对比逻辑
    // 可以使用 pixelmatch 或其他图片对比库
    
    return true; // 临时返回
  }
  
  // 生成测试报告
  static generateTestReport(results: {
    testName: string;
    duration: number;
    status: 'passed' | 'failed' | 'skipped';
    errors?: string[];
    screenshots?: string[];
    performance?: any;
    accessibility?: any;
  }[]): string {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.status === 'passed').length;
    const failedTests = results.filter(r => r.status === 'failed').length;
    const skippedTests = results.filter(r => r.status === 'skipped').length;
    
    const report = `
# E2E 测试报告

## 测试概览
- 总测试数: ${totalTests}
- 通过: ${passedTests}
- 失败: ${failedTests}
- 跳过: ${skippedTests}
- 成功率: ${((passedTests / totalTests) * 100).toFixed(2)}%

## 测试详情
${results.map(result => `
### ${result.testName}
- 状态: ${result.status}
- 耗时: ${result.duration}ms
${result.errors?.length ? `- 错误: ${result.errors.join(', ')}` : ''}
`).join('')}
`;
    
    return report;
  }
}

// E2E 测试断言
export class E2EAssertions {
  // 断言页面标题
  static async expectTitle(page: Page, title: string | RegExp): Promise<void> {
    await playwrightExpect(page).toHaveTitle(title);
  }
  
  // 断言页面 URL
  static async expectURL(page: Page, url: string | RegExp): Promise<void> {
    await playwrightExpect(page).toHaveURL(url);
  }
  
  // 断言元素可见
  static async expectVisible(page: Page, selector: string): Promise<void> {
    await playwrightExpect(page.locator(selector)).toBeVisible();
  }
  
  // 断言元素隐藏
  static async expectHidden(page: Page, selector: string): Promise<void> {
    await playwrightExpect(page.locator(selector)).toBeHidden();
  }
  
  // 断言元素文本
  static async expectText(page: Page, selector: string, text: string | RegExp): Promise<void> {
    await playwrightExpect(page.locator(selector)).toHaveText(text);
  }
  
  // 断言元素包含文本
  static async expectContainsText(page: Page, selector: string, text: string): Promise<void> {
    await playwrightExpect(page.locator(selector)).toContainText(text);
  }
  
  // 断言元素数量
  static async expectCount(page: Page, selector: string, count: number): Promise<void> {
    await playwrightExpect(page.locator(selector)).toHaveCount(count);
  }
  
  // 断言元素属性
  static async expectAttribute(
    page: Page,
    selector: string,
    attribute: string,
    value: string | RegExp
  ): Promise<void> {
    await playwrightExpect(page.locator(selector)).toHaveAttribute(attribute, value);
  }
  
  // 断言输入框值
  static async expectValue(page: Page, selector: string, value: string | RegExp): Promise<void> {
    await playwrightExpect(page.locator(selector)).toHaveValue(value);
  }
  
  // 断言元素被选中
  static async expectChecked(page: Page, selector: string): Promise<void> {
    await playwrightExpect(page.locator(selector)).toBeChecked();
  }
  
  // 断言元素未被选中
  static async expectUnchecked(page: Page, selector: string): Promise<void> {
    await playwrightExpect(page.locator(selector)).not.toBeChecked();
  }
  
  // 断言元素被禁用
  static async expectDisabled(page: Page, selector: string): Promise<void> {
    await playwrightExpect(page.locator(selector)).toBeDisabled();
  }
  
  // 断言元素被启用
  static async expectEnabled(page: Page, selector: string): Promise<void> {
    await playwrightExpect(page.locator(selector)).toBeEnabled();
  }
  
  // 断言元素获得焦点
  static async expectFocused(page: Page, selector: string): Promise<void> {
    await playwrightExpect(page.locator(selector)).toBeFocused();
  }
  
  // 断言响应状态
  static async expectResponseStatus(
    page: Page,
    urlPattern: string | RegExp,
    status: number
  ): Promise<void> {
    const response = await page.waitForResponse(urlPattern);
    playwrightExpect(response.status()).toBe(status);
  }
  
  // 断言控制台无错误
  static expectNoConsoleErrors(errors: string[]): void {
    playwrightExpect(errors).toHaveLength(0);
  }
  
  // 断言性能指标
  static expectPerformance(metrics: any, thresholds: {
    loadTime?: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
    firstInputDelay?: number;
    cumulativeLayoutShift?: number;
  }): void {
    if (thresholds.loadTime) {
      playwrightExpect(metrics.loadTime).toBeLessThan(thresholds.loadTime);
    }
    if (thresholds.firstContentfulPaint) {
      playwrightExpect(metrics.firstContentfulPaint).toBeLessThan(thresholds.firstContentfulPaint);
    }
    // 其他性能指标断言...
  }
}

// 导出页面对象和工具
export {
  HomePage,
  LoginPage,
  BlogPage,
  BlogDetailPage,
  AdminPage,
  EditorPage,
};