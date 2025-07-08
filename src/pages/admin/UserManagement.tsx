import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Shield,
  User as UserIcon,
  Mail,
  Calendar,
  MoreHorizontal,
  Users,
  UserCheck,
  UserX,
  Crown,
  RefreshCw,
  Download,
  Upload,
  ChevronDown,
  Eye,
  Lock,
  Unlock,
  Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  useUserList,
  useDeleteUser,
  useBatchDeleteUsers,
  useUpdateUserStatus,
  useBatchUpdateUserStatus,
  useUpdateUserRole,
  useUserStats,
  useExportUsers,
  useImportUsers,
  useResetUserPassword
} from '../../hooks/useUser';
import type { User, UserRole, UserStatus } from '../../types/user';

// 角色选项
const roleOptions = [
  { value: '', label: '全部角色' },
  { value: 'admin', label: '管理员' },
  { value: 'author', label: '作者' },
  { value: 'reader', label: '读者' }
];

// 状态选项
const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'active', label: '活跃' },
  { value: 'inactive', label: '非活跃' },
  { value: 'banned', label: '已禁用' }
];

// 排序选项
const sortOptions = [
  { value: 'createdAt', label: '注册时间' },
  { value: 'lastLoginAt', label: '最后登录' },
  { value: 'name', label: '姓名' },
  { value: 'email', label: '邮箱' },
  { value: 'postsCount', label: '文章数量' }
];

const UserManagement: React.FC = () => {
  // 搜索和筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // API hooks
  const {
    data: userData,
    loading: usersLoading,
    error: usersError,
    refetch: refetchUsers
  } = useUserList({
    page: currentPage,
    limit: pageSize,
    search: searchTerm,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
    sortBy,
    sortOrder
  });

  const { data: stats, loading: statsLoading } = useUserStats();
  const { mutate: deleteUser } = useDeleteUser();
  const { mutate: batchDeleteUsers } = useBatchDeleteUsers();
  const { mutate: updateUserStatus } = useUpdateUserStatus();
  const { mutate: batchUpdateUserStatus } = useBatchUpdateUserStatus();
  const { mutate: updateUserRole } = useUpdateUserRole();
  const { mutate: resetUserPassword } = useResetUserPassword();
  const { mutate: exportUsers } = useExportUsers();
  const { mutate: importUsers } = useImportUsers();

  const users = userData?.users || [];
  const totalUsers = userData?.total || 0;
  const totalPages = Math.ceil(totalUsers / pageSize);

  // 更新搜索和筛选参数
  const updateParams = () => {
    setCurrentPage(1);
    refetchUsers();
  };

  // 刷新用户列表
  const refreshUsers = () => {
    refetchUsers();
  };

  // 搜索处理
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // 角色筛选处理
  const handleRoleFilter = (role: string) => {
    setRoleFilter(role);
    setCurrentPage(1);
  };

  // 状态筛选处理
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  // 排序处理
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // 批量删除用户
  const handleBatchDelete = () => {
    if (selectedUsers.length === 0) return;
    
    if (confirm(`确定要删除选中的 ${selectedUsers.length} 个用户吗？`)) {
      batchDeleteUsers(selectedUsers, {
        onSuccess: () => {
          setSelectedUsers([]);
          refreshUsers();
        }
      });
    }
  };

  // 批量更新用户状态
  const handleBatchStatusUpdate = (status: UserStatus) => {
    if (selectedUsers.length === 0) return;
    
    batchUpdateUserStatus({ userIds: selectedUsers, status }, {
      onSuccess: () => {
        setSelectedUsers([]);
        refreshUsers();
      }
    });
  };

  // 删除单个用户
  const handleDeleteUser = (userId: string) => {
    if (confirm('确定要删除这个用户吗？')) {
      deleteUser(userId, {
        onSuccess: () => {
          refreshUsers();
        }
      });
    }
  };

  // 更新用户状态
  const handleUpdateUserStatus = (userId: string, status: UserStatus) => {
    updateUserStatus({ userId, status }, {
      onSuccess: () => {
        refreshUsers();
      }
    });
  };

  // 更新用户角色
  const handleUpdateUserRole = (userId: string, role: UserRole) => {
    updateUserRole({ userId, role }, {
      onSuccess: () => {
        refreshUsers();
      }
    });
  };

  // 重置用户密码
  const handleResetPassword = (userId: string) => {
    if (confirm('确定要重置这个用户的密码吗？')) {
      resetUserPassword(userId, {
        onSuccess: () => {
          alert('密码重置成功，新密码已发送到用户邮箱');
        }
      });
    }
  };

  // 导出用户数据
  const handleExportUsers = () => {
    exportUsers({
      search: searchTerm,
      role: roleFilter || undefined,
      status: statusFilter || undefined
    });
  };

  // 导入用户数据
  const handleImportUsers = (file: File) => {
    importUsers(file, {
      onSuccess: () => {
        refreshUsers();
      }
    });
  };

  // 辅助函数
  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'author':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'reader':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'banned':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getRoleText = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return '管理员';
      case 'author':
        return '作者';
      case 'reader':
        return '读者';
      default:
        return '未知';
    }
  };

  const getStatusText = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return '活跃';
      case 'inactive':
        return '非活跃';
      case 'banned':
        return '已禁用';
      default:
        return '未知';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4" />;
      case 'author':
        return <Edit className="w-4 h-4" />;
      case 'reader':
        return <UserIcon className="w-4 h-4" />;
      default:
        return <UserIcon className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('zh-CN');
  };

  // 全选处理
  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  // 单选处理
  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // 错误处理
  if (usersError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">用户管理</h1>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                加载用户列表失败
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{usersError.message || '请检查网络连接后重试'}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={refreshUsers}
                  className="bg-red-100 dark:bg-red-900/30 px-3 py-2 rounded-md text-sm font-medium text-red-800 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  重试
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 加载状态骨架屏
  if (usersLoading && users.length === 0) {
    return (
      <div className="space-y-6">
        {/* 头部骨架 */}
        <div className="animate-pulse">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
            </div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          </div>
          
          {/* 统计卡片骨架 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                  </div>
                  <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
          
          {/* 搜索和筛选骨架 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              </div>
            </div>
          </div>
          
          {/* 表格骨架 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-6 flex items-center space-x-4">
                  <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                  </div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">用户管理</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            管理系统用户，包括角色分配和权限控制。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshUsers}
            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
          <button
            onClick={handleExportUsers}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            导出
          </button>
          <Link
            to="/admin/users/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加用户
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">总用户数</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {statsLoading ? '-' : formatNumber(stats?.totalUsers || totalUsers)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">活跃用户</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {statsLoading ? '-' : formatNumber(stats?.activeUsers || users.filter(u => u.status === 'active').length)}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">管理员</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {statsLoading ? '-' : formatNumber(stats?.adminUsers || users.filter(u => u.role === 'admin').length)}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <Crown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">本月新增</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {statsLoading ? '-' : formatNumber(stats?.newUsersThisMonth || 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Plus className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索用户名或邮箱..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">筛选:</span>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => handleRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[120px]"
            >
              {roleOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[120px]"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">排序:</span>
              <select
                value={sortBy}
                onChange={(e) => handleSort(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[120px]"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                title={sortOrder === 'asc' ? '升序' : '降序'}
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </div>
        
        {/* 高级筛选 */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4" />
            高级筛选
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  注册时间范围
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <span className="text-gray-400">至</span>
                  <input
                    type="date"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  文章数量范围
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="最少"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder="最多"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  最后登录
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                  <option value="">全部</option>
                  <option value="today">今天</option>
                  <option value="week">本周</option>
                  <option value="month">本月</option>
                  <option value="quarter">本季度</option>
                  <option value="never">从未登录</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 批量操作 */}
      {selectedUsers.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-400">
                已选择 {selectedUsers.length} 个用户
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBatchStatusUpdate('active')}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-1"
              >
                <UserCheck className="w-4 h-4" />
                批量激活
              </button>
              <button
                onClick={() => handleBatchStatusUpdate('banned')}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-1"
              >
                <Lock className="w-4 h-4" />
                批量禁用
              </button>
              <button
                onClick={handleBatchDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                批量删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                用户列表 ({formatNumber(totalUsers)})
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                全选
              </label>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  用户
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  角色
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  加入日期
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  最后登录
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  文章数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                      />
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {getRoleIcon(user.role)}
                      <span className="ml-1">{getRoleText(user.role)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {getStatusText(user.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-900 dark:text-white">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      {formatDate(user.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {user.lastLoginAt ? formatDate(user.lastLoginAt) : '从未登录'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {user.postsCount || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/admin/users/${user.id}/edit`}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="编辑用户"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleResetPassword(user.id)}
                        className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                        title="重置密码"
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleUpdateUserStatus(user.id, user.status === 'active' ? 'banned' : 'active')}
                        className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                        title={user.status === 'active' ? '禁用用户' : '激活用户'}
                      >
                        {user.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="删除用户"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && !usersLoading && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Users className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm || roleFilter || statusFilter ? '未找到匹配的用户' : '暂无用户'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || roleFilter || statusFilter ? '尝试调整搜索条件或筛选器' : '开始添加第一个用户'}
            </p>
            {!searchTerm && !roleFilter && !statusFilter && (
              <div className="mt-4">
                <Link
                  to="/admin/users/create"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  添加用户
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 px-6 py-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              显示第 <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> 到 <span className="font-medium">{Math.min(currentPage * pageSize, totalUsers)}</span> 条，
              共 <span className="font-medium">{formatNumber(totalUsers)}</span> 条记录
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              
              {/* 页码按钮 */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;