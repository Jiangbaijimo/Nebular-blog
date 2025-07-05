// RBAC权限控制服务
import tokenManager from './tokenManager';
import type {
  Role,
  Permission,
  RolePermission,
  UserRole,
  PermissionCheck,
  RBACConfig,
} from '../../types/auth';

/**
 * RBAC权限控制服务类
 */
class RBACService {
  private static instance: RBACService;
  private roles: Map<string, Role> = new Map();
  private permissions: Map<string, Permission> = new Map();
  private rolePermissions: Map<string, Set<string>> = new Map();
  private userRoles: Map<string, Set<string>> = new Map();
  private permissionCache: Map<string, boolean> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

  private constructor() {
    this.initializeDefaultRolesAndPermissions();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): RBACService {
    if (!RBACService.instance) {
      RBACService.instance = new RBACService();
    }
    return RBACService.instance;
  }

  /**
   * 初始化默认角色和权限
   */
  private initializeDefaultRolesAndPermissions(): void {
    // 定义权限
    const permissions: Permission[] = [
      // 博客权限
      { id: 'blog:read', name: '查看博客', description: '查看博客文章', category: 'blog' },
      { id: 'blog:write', name: '编写博客', description: '创建和编辑博客文章', category: 'blog' },
      { id: 'blog:delete', name: '删除博客', description: '删除博客文章', category: 'blog' },
      { id: 'blog:publish', name: '发布博客', description: '发布博客文章', category: 'blog' },
      { id: 'blog:manage', name: '管理博客', description: '管理所有博客文章', category: 'blog' },
      
      // 媒体权限
      { id: 'media:read', name: '查看媒体', description: '查看媒体文件', category: 'media' },
      { id: 'media:upload', name: '上传媒体', description: '上传媒体文件', category: 'media' },
      { id: 'media:delete', name: '删除媒体', description: '删除媒体文件', category: 'media' },
      { id: 'media:manage', name: '管理媒体', description: '管理所有媒体文件', category: 'media' },
      
      // 用户权限
      { id: 'user:read', name: '查看用户', description: '查看用户信息', category: 'user' },
      { id: 'user:write', name: '编辑用户', description: '编辑用户信息', category: 'user' },
      { id: 'user:delete', name: '删除用户', description: '删除用户账户', category: 'user' },
      { id: 'user:manage', name: '管理用户', description: '管理所有用户', category: 'user' },
      
      // 系统权限
      { id: 'system:read', name: '查看系统', description: '查看系统信息', category: 'system' },
      { id: 'system:write', name: '配置系统', description: '修改系统配置', category: 'system' },
      { id: 'system:manage', name: '管理系统', description: '完全管理系统', category: 'system' },
      
      // 云函数权限
      { id: 'function:read', name: '查看云函数', description: '查看云函数', category: 'function' },
      { id: 'function:write', name: '编写云函数', description: '创建和编辑云函数', category: 'function' },
      { id: 'function:execute', name: '执行云函数', description: '执行云函数', category: 'function' },
      { id: 'function:deploy', name: '部署云函数', description: '部署云函数', category: 'function' },
      { id: 'function:manage', name: '管理云函数', description: '管理所有云函数', category: 'function' },
    ];

    // 定义角色
    const roles: Role[] = [
      {
        id: 'guest',
        name: '访客',
        description: '未登录用户，只能查看公开内容',
        level: 0,
        isSystem: true,
      },
      {
        id: 'user',
        name: '普通用户',
        description: '已注册用户，可以查看和评论',
        level: 1,
        isSystem: true,
      },
      {
        id: 'author',
        name: '作者',
        description: '可以创建和管理自己的博客文章',
        level: 2,
        isSystem: true,
      },
      {
        id: 'editor',
        name: '编辑',
        description: '可以编辑和管理博客内容',
        level: 3,
        isSystem: true,
      },
      {
        id: 'admin',
        name: '管理员',
        description: '可以管理用户和系统设置',
        level: 4,
        isSystem: true,
      },
      {
        id: 'super_admin',
        name: '超级管理员',
        description: '拥有所有权限',
        level: 5,
        isSystem: true,
      },
    ];

    // 角色权限映射
    const rolePermissionMappings: Array<{ roleId: string; permissions: string[] }> = [
      {
        roleId: 'guest',
        permissions: ['blog:read', 'media:read'],
      },
      {
        roleId: 'user',
        permissions: ['blog:read', 'media:read', 'user:read'],
      },
      {
        roleId: 'author',
        permissions: [
          'blog:read', 'blog:write', 'blog:publish',
          'media:read', 'media:upload',
          'user:read', 'user:write',
        ],
      },
      {
        roleId: 'editor',
        permissions: [
          'blog:read', 'blog:write', 'blog:delete', 'blog:publish', 'blog:manage',
          'media:read', 'media:upload', 'media:delete', 'media:manage',
          'user:read', 'user:write',
        ],
      },
      {
        roleId: 'admin',
        permissions: [
          'blog:read', 'blog:write', 'blog:delete', 'blog:publish', 'blog:manage',
          'media:read', 'media:upload', 'media:delete', 'media:manage',
          'user:read', 'user:write', 'user:delete', 'user:manage',
          'system:read', 'system:write',
          'function:read', 'function:write', 'function:execute', 'function:deploy',
        ],
      },
      {
        roleId: 'super_admin',
        permissions: permissions.map(p => p.id), // 所有权限
      },
    ];

    // 初始化权限
    permissions.forEach(permission => {
      this.permissions.set(permission.id, permission);
    });

    // 初始化角色
    roles.forEach(role => {
      this.roles.set(role.id, role);
    });

    // 初始化角色权限映射
    rolePermissionMappings.forEach(mapping => {
      this.rolePermissions.set(mapping.roleId, new Set(mapping.permissions));
    });

    console.log('RBAC system initialized with default roles and permissions');
  }

  /**
   * 检查用户是否有指定权限
   */
  async hasPermission(
    permission: string,
    userId?: string,
    resource?: string
  ): Promise<boolean> {
    try {
      // 生成缓存键
      const cacheKey = `${userId || 'current'}:${permission}:${resource || 'global'}`;
      
      // 检查缓存
      if (this.isCacheValid(cacheKey)) {
        return this.permissionCache.get(cacheKey) || false;
      }

      // 获取用户角色
      const userRoles = await this.getUserRoles(userId);
      
      if (userRoles.length === 0) {
        // 未登录用户默认为guest角色
        userRoles.push('guest');
      }

      // 检查权限
      let hasPermission = false;
      
      for (const roleId of userRoles) {
        if (this.roleHasPermission(roleId, permission)) {
          hasPermission = true;
          break;
        }
      }

      // 缓存结果
      this.setCacheValue(cacheKey, hasPermission);
      
      return hasPermission;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * 检查用户是否有指定角色
   */
  async hasRole(roleId: string, userId?: string): Promise<boolean> {
    try {
      const userRoles = await this.getUserRoles(userId);
      return userRoles.includes(roleId);
    } catch (error) {
      console.error('Error checking role:', error);
      return false;
    }
  }

  /**
   * 检查用户是否有任一指定权限
   */
  async hasAnyPermission(
    permissions: string[],
    userId?: string,
    resource?: string
  ): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.hasPermission(permission, userId, resource)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 检查用户是否有所有指定权限
   */
  async hasAllPermissions(
    permissions: string[],
    userId?: string,
    resource?: string
  ): Promise<boolean> {
    for (const permission of permissions) {
      if (!(await this.hasPermission(permission, userId, resource))) {
        return false;
      }
    }
    return true;
  }

  /**
   * 获取用户角色
   */
  private async getUserRoles(userId?: string): Promise<string[]> {
    if (!userId) {
      // 从Token中获取当前用户角色
      const tokenInfo = await tokenManager.getTokenInfo();
      if (tokenInfo && tokenInfo.roles) {
        return tokenInfo.roles;
      }
      return [];
    }

    // 从缓存或API获取指定用户角色
    const cachedRoles = this.userRoles.get(userId);
    if (cachedRoles) {
      return Array.from(cachedRoles);
    }

    // 从API获取用户角色
    try {
      const response = await fetch(`/api/users/${userId}/roles`, {
        headers: {
          'Authorization': `Bearer ${await tokenManager.getAccessToken()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const roles = data.roles || [];
        
        // 缓存用户角色
        this.userRoles.set(userId, new Set(roles));
        
        return roles;
      }
    } catch (error) {
      console.error('Error fetching user roles:', error);
    }

    return [];
  }

  /**
   * 检查角色是否有指定权限
   */
  private roleHasPermission(roleId: string, permission: string): boolean {
    const rolePermissions = this.rolePermissions.get(roleId);
    return rolePermissions ? rolePermissions.has(permission) : false;
  }

  /**
   * 获取角色的所有权限
   */
  getRolePermissions(roleId: string): string[] {
    const permissions = this.rolePermissions.get(roleId);
    return permissions ? Array.from(permissions) : [];
  }

  /**
   * 获取用户的所有权限
   */
  async getUserPermissions(userId?: string): Promise<string[]> {
    const userRoles = await this.getUserRoles(userId);
    const permissions = new Set<string>();

    userRoles.forEach(roleId => {
      const rolePermissions = this.rolePermissions.get(roleId);
      if (rolePermissions) {
        rolePermissions.forEach(permission => permissions.add(permission));
      }
    });

    return Array.from(permissions);
  }

  /**
   * 获取所有角色
   */
  getAllRoles(): Role[] {
    return Array.from(this.roles.values());
  }

  /**
   * 获取所有权限
   */
  getAllPermissions(): Permission[] {
    return Array.from(this.permissions.values());
  }

  /**
   * 获取角色信息
   */
  getRole(roleId: string): Role | undefined {
    return this.roles.get(roleId);
  }

  /**
   * 获取权限信息
   */
  getPermission(permissionId: string): Permission | undefined {
    return this.permissions.get(permissionId);
  }

  /**
   * 添加角色
   */
  addRole(role: Role): void {
    this.roles.set(role.id, role);
    
    // 初始化角色权限集合
    if (!this.rolePermissions.has(role.id)) {
      this.rolePermissions.set(role.id, new Set());
    }
    
    this.clearCache();
  }

  /**
   * 添加权限
   */
  addPermission(permission: Permission): void {
    this.permissions.set(permission.id, permission);
    this.clearCache();
  }

  /**
   * 为角色分配权限
   */
  assignPermissionToRole(roleId: string, permissionId: string): void {
    if (!this.roles.has(roleId) || !this.permissions.has(permissionId)) {
      throw new Error('Role or permission not found');
    }

    let rolePermissions = this.rolePermissions.get(roleId);
    if (!rolePermissions) {
      rolePermissions = new Set();
      this.rolePermissions.set(roleId, rolePermissions);
    }

    rolePermissions.add(permissionId);
    this.clearCache();
  }

  /**
   * 从角色移除权限
   */
  removePermissionFromRole(roleId: string, permissionId: string): void {
    const rolePermissions = this.rolePermissions.get(roleId);
    if (rolePermissions) {
      rolePermissions.delete(permissionId);
      this.clearCache();
    }
  }

  /**
   * 检查缓存是否有效
   */
  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    if (!expiry) {
      return false;
    }
    
    if (Date.now() > expiry) {
      this.permissionCache.delete(key);
      this.cacheExpiry.delete(key);
      return false;
    }
    
    return this.permissionCache.has(key);
  }

  /**
   * 设置缓存值
   */
  private setCacheValue(key: string, value: boolean): void {
    this.permissionCache.set(key, value);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.permissionCache.clear();
    this.cacheExpiry.clear();
    this.userRoles.clear();
  }

  /**
   * 清除用户缓存
   */
  clearUserCache(userId: string): void {
    this.userRoles.delete(userId);
    
    // 清除相关的权限缓存
    const keysToDelete: string[] = [];
    this.permissionCache.forEach((_, key) => {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      this.permissionCache.delete(key);
      this.cacheExpiry.delete(key);
    });
  }

  /**
   * 权限检查装饰器
   */
  requirePermission(permission: string) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;
      
      descriptor.value = async function (...args: any[]) {
        const rbac = RBACService.getInstance();
        const hasPermission = await rbac.hasPermission(permission);
        
        if (!hasPermission) {
          throw new Error(`Permission denied: ${permission}`);
        }
        
        return originalMethod.apply(this, args);
      };
      
      return descriptor;
    };
  }

  /**
   * 角色检查装饰器
   */
  requireRole(roleId: string) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;
      
      descriptor.value = async function (...args: any[]) {
        const rbac = RBACService.getInstance();
        const hasRole = await rbac.hasRole(roleId);
        
        if (!hasRole) {
          throw new Error(`Role required: ${roleId}`);
        }
        
        return originalMethod.apply(this, args);
      };
      
      return descriptor;
    };
  }

  /**
   * 获取权限检查结果
   */
  async checkPermissions(permissions: string[], userId?: string): Promise<PermissionCheck[]> {
    const results: PermissionCheck[] = [];
    
    for (const permission of permissions) {
      const hasPermission = await this.hasPermission(permission, userId);
      results.push({
        permission,
        granted: hasPermission,
        reason: hasPermission ? 'granted' : 'denied',
      });
    }
    
    return results;
  }

  /**
   * 获取RBAC配置
   */
  getConfig(): RBACConfig {
    return {
      roles: this.getAllRoles(),
      permissions: this.getAllPermissions(),
      rolePermissions: Array.from(this.rolePermissions.entries()).map(
        ([roleId, permissions]) => ({
          roleId,
          permissions: Array.from(permissions),
        })
      ),
      cacheTTL: this.CACHE_TTL,
    };
  }

  /**
   * 导出RBAC配置
   */
  exportConfig(): string {
    return JSON.stringify(this.getConfig(), null, 2);
  }

  /**
   * 导入RBAC配置
   */
  importConfig(configJson: string): void {
    try {
      const config: RBACConfig = JSON.parse(configJson);
      
      // 清除现有配置
      this.roles.clear();
      this.permissions.clear();
      this.rolePermissions.clear();
      this.clearCache();
      
      // 导入角色
      config.roles.forEach(role => {
        this.roles.set(role.id, role);
      });
      
      // 导入权限
      config.permissions.forEach(permission => {
        this.permissions.set(permission.id, permission);
      });
      
      // 导入角色权限映射
      config.rolePermissions.forEach(rp => {
        this.rolePermissions.set(rp.roleId, new Set(rp.permissions));
      });
      
      console.log('RBAC configuration imported successfully');
    } catch (error) {
      console.error('Failed to import RBAC configuration:', error);
      throw error;
    }
  }
}

// 创建单例实例
const rbacService = RBACService.getInstance();

export { rbacService, RBACService };
export default rbacService;