/**
 * 编辑器状态管理
 * 管理富文本编辑器状态、草稿自动保存、编辑历史等
 */

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { httpClient } from '../services/http';
import { API_ENDPOINTS } from '../constants/api';
import type { BlogPost, PostStatus } from '../types/blog';

// ==================== 类型定义 ====================

/**
 * 编辑器模式
 */
export type EditorMode = 'edit' | 'preview' | 'split';

/**
 * 编辑器主题
 */
export type EditorTheme = 'vs-light' | 'vs-dark' | 'hc-black';

/**
 * 编辑器语言
 */
export type EditorLanguage = 'markdown' | 'html' | 'plaintext';

/**
 * 编辑器配置
 */
export interface EditorConfig {
  theme: EditorTheme;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  tabSize: number;
  wordWrap: boolean;
  showLineNumbers: boolean;
  showMinimap: boolean;
  enableVim: boolean;
  enableEmmet: boolean;
  formatOnSave: boolean;
  enableCodeFolding: boolean;
  highlightActiveLine: boolean;
  showWhitespace: boolean;
}

/**
 * 编辑器快捷键
 */
export interface EditorShortcut {
  key: string;
  command: string;
  description: string;
  enabled: boolean;
}

/**
 * 编辑历史记录
 */
export interface EditorHistory {
  id: string;
  content: string;
  timestamp: number;
  description: string;
  wordCount: number;
}

/**
 * 草稿信息
 */
export interface DraftInfo {
  id: string;
  title: string;
  content: string;
  lastSaved: number;
  autoSaved: boolean;
  wordCount: number;
  characterCount: number;
  estimatedReadTime: number;
}

/**
 * 编辑器插件
 */
export interface EditorPlugin {
  id: string;
  name: string;
  enabled: boolean;
  config: Record<string, any>;
}

/**
 * 编辑器状态接口
 */
export interface EditorState {
  // 编辑器基础状态
  isInitialized: boolean;
  isLoading: boolean;
  isFullscreen: boolean;
  mode: EditorMode;
  language: EditorLanguage;
  
  // 当前编辑内容
  currentPost: Partial<BlogPost> | null;
  content: string;
  title: string;
  excerpt: string;
  tags: string[];
  categories: string[];
  status: PostStatus;
  
  // 编辑器配置
  config: EditorConfig;
  shortcuts: EditorShortcut[];
  plugins: EditorPlugin[];
  
  // 草稿和自动保存
  drafts: DraftInfo[];
  currentDraftId: string | null;
  autoSaveEnabled: boolean;
  autoSaveInterval: number;
  lastAutoSave: number;
  hasUnsavedChanges: boolean;
  
  // 编辑历史
  history: EditorHistory[];
  currentHistoryIndex: number;
  maxHistorySize: number;
  
  // 统计信息
  wordCount: number;
  characterCount: number;
  estimatedReadTime: number;
  
  // 光标和选择
  cursorPosition: { line: number; column: number };
  selection: { start: { line: number; column: number }; end: { line: number; column: number } } | null;
  
  // 搜索和替换
  searchQuery: string;
  replaceQuery: string;
  searchResults: Array<{ line: number; column: number; length: number }>;
  currentSearchIndex: number;
  
  // 错误和警告
  errors: Array<{ line: number; message: string; severity: 'error' | 'warning' | 'info' }>;
  
  // 协作编辑（预留）
  collaborators: Array<{ id: string; name: string; cursor: { line: number; column: number } }>;
  
  // 状态标志
  isSaving: boolean;
  isPublishing: boolean;
  
  // 错误状态
  error: string | null;
}

/**
 * 编辑器操作接口
 */
export interface EditorActions {
  // 初始化和配置
  initialize: () => void;
  updateConfig: (config: Partial<EditorConfig>) => void;
  resetConfig: () => void;
  
  // 内容操作
  setContent: (content: string) => void;
  updateContent: (content: string) => void;
  insertContent: (content: string, position?: { line: number; column: number }) => void;
  replaceContent: (start: { line: number; column: number }, end: { line: number; column: number }, content: string) => void;
  
  // 文章信息
  setTitle: (title: string) => void;
  setExcerpt: (excerpt: string) => void;
  setTags: (tags: string[]) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  setCategories: (categories: string[]) => void;
  addCategory: (category: string) => void;
  removeCategory: (category: string) => void;
  setStatus: (status: PostStatus) => void;
  
  // 编辑器模式
  setMode: (mode: EditorMode) => void;
  toggleFullscreen: () => void;
  setLanguage: (language: EditorLanguage) => void;
  
  // 草稿管理
  createDraft: (title?: string) => string;
  loadDraft: (draftId: string) => void;
  saveDraft: (draftId?: string) => void;
  deleteDraft: (draftId: string) => void;
  autoSaveDraft: () => void;
  enableAutoSave: (enabled: boolean) => void;
  setAutoSaveInterval: (interval: number) => void;
  
  // 历史记录
  addToHistory: (description?: string) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  
  // 文件操作
  newPost: () => void;
  loadPost: (postId: string) => Promise<void>;
  savePost: () => Promise<void>;
  publishPost: () => Promise<void>;
  
  // 搜索和替换
  search: (query: string) => void;
  replace: (query: string, replacement: string) => void;
  replaceAll: (query: string, replacement: string) => void;
  clearSearch: () => void;
  
  // 光标和选择
  setCursorPosition: (position: { line: number; column: number }) => void;
  setSelection: (start: { line: number; column: number }, end: { line: number; column: number }) => void;
  
  // 插件管理
  enablePlugin: (pluginId: string) => void;
  disablePlugin: (pluginId: string) => void;
  updatePluginConfig: (pluginId: string, config: Record<string, any>) => void;
  
  // 快捷键
  updateShortcut: (shortcut: EditorShortcut) => void;
  resetShortcuts: () => void;
  
  // 错误处理
  addError: (line: number, message: string, severity: 'error' | 'warning' | 'info') => void;
  clearErrors: () => void;
  
  // 统计更新
  updateStatistics: () => void;
  
  // 状态重置
  reset: () => void;
  setError: (error: string | null) => void;
}

// ==================== 默认配置 ====================

const defaultEditorConfig: EditorConfig = {
  theme: 'vs-dark',
  fontSize: 14,
  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
  lineHeight: 1.5,
  tabSize: 2,
  wordWrap: true,
  showLineNumbers: true,
  showMinimap: true,
  enableVim: false,
  enableEmmet: true,
  formatOnSave: true,
  enableCodeFolding: true,
  highlightActiveLine: true,
  showWhitespace: false
};

const defaultShortcuts: EditorShortcut[] = [
  { key: 'Ctrl+S', command: 'save', description: '保存文档', enabled: true },
  { key: 'Ctrl+Shift+S', command: 'saveAs', description: '另存为', enabled: true },
  { key: 'Ctrl+P', command: 'publish', description: '发布文章', enabled: true },
  { key: 'Ctrl+F', command: 'search', description: '搜索', enabled: true },
  { key: 'Ctrl+H', command: 'replace', description: '替换', enabled: true },
  { key: 'Ctrl+Z', command: 'undo', description: '撤销', enabled: true },
  { key: 'Ctrl+Y', command: 'redo', description: '重做', enabled: true },
  { key: 'F11', command: 'toggleFullscreen', description: '切换全屏', enabled: true },
  { key: 'Ctrl+Shift+P', command: 'togglePreview', description: '切换预览', enabled: true },
  { key: 'Ctrl+B', command: 'bold', description: '加粗', enabled: true },
  { key: 'Ctrl+I', command: 'italic', description: '斜体', enabled: true },
  { key: 'Ctrl+K', command: 'link', description: '插入链接', enabled: true }
];

const defaultPlugins: EditorPlugin[] = [
  { id: 'imageUpload', name: '图片上传', enabled: true, config: {} },
  { id: 'codeHighlight', name: '代码高亮', enabled: true, config: {} },
  { id: 'mathFormula', name: '数学公式', enabled: true, config: {} },
  { id: 'tableEditor', name: '表格编辑', enabled: true, config: {} },
  { id: 'emojiPicker', name: '表情选择器', enabled: true, config: {} },
  { id: 'autoComplete', name: '自动补全', enabled: true, config: {} }
];

const initialEditorState: EditorState = {
  isInitialized: false,
  isLoading: false,
  isFullscreen: false,
  mode: 'split',
  language: 'markdown',
  
  currentPost: null,
  content: '',
  title: '',
  excerpt: '',
  tags: [],
  categories: [],
  status: 'draft',
  
  config: defaultEditorConfig,
  shortcuts: defaultShortcuts,
  plugins: defaultPlugins,
  
  drafts: [],
  currentDraftId: null,
  autoSaveEnabled: true,
  autoSaveInterval: 10000, // 10秒
  lastAutoSave: 0,
  hasUnsavedChanges: false,
  
  history: [],
  currentHistoryIndex: -1,
  maxHistorySize: 50,
  
  wordCount: 0,
  characterCount: 0,
  estimatedReadTime: 0,
  
  cursorPosition: { line: 1, column: 1 },
  selection: null,
  
  searchQuery: '',
  replaceQuery: '',
  searchResults: [],
  currentSearchIndex: -1,
  
  errors: [],
  collaborators: [],
  
  isSaving: false,
  isPublishing: false,
  error: null
};

// ==================== 工具函数 ====================

/**
 * 计算文本统计信息
 */
function calculateTextStats(content: string) {
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const characterCount = content.length;
  const estimatedReadTime = Math.ceil(wordCount / 200); // 假设每分钟阅读200字
  
  return { wordCount, characterCount, estimatedReadTime };
}

/**
 * 生成草稿ID
 */
function generateDraftId(): string {
  return `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 生成历史记录ID
 */
function generateHistoryId(): string {
  return `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== 编辑器Store ====================

export const useEditorStore = create<EditorState & EditorActions>()()
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialEditorState,

          // 初始化编辑器
          initialize: () => {
            set((state) => {
              state.isInitialized = true;
            });
            
            // 启动自动保存
            const state = get();
            if (state.autoSaveEnabled) {
              setInterval(() => {
                const currentState = get();
                if (currentState.hasUnsavedChanges && currentState.content) {
                  currentState.autoSaveDraft();
                }
              }, state.autoSaveInterval);
            }
          },

          // 更新编辑器配置
          updateConfig: (config) => {
            set((state) => {
              state.config = { ...state.config, ...config };
            });
          },

          // 重置配置
          resetConfig: () => {
            set((state) => {
              state.config = defaultEditorConfig;
            });
          },

          // 设置内容
          setContent: (content) => {
            set((state) => {
              state.content = content;
              const stats = calculateTextStats(content);
              state.wordCount = stats.wordCount;
              state.characterCount = stats.characterCount;
              state.estimatedReadTime = stats.estimatedReadTime;
              state.hasUnsavedChanges = true;
            });
          },

          // 更新内容
          updateContent: (content) => {
            const state = get();
            if (state.content !== content) {
              state.setContent(content);
              state.addToHistory('内容更新');
            }
          },

          // 插入内容
          insertContent: (content, position) => {
            set((state) => {
              if (position) {
                // 在指定位置插入
                const lines = state.content.split('\n');
                const line = lines[position.line - 1] || '';
                const newLine = line.slice(0, position.column - 1) + content + line.slice(position.column - 1);
                lines[position.line - 1] = newLine;
                state.content = lines.join('\n');
              } else {
                // 在当前光标位置插入
                state.content += content;
              }
              
              const stats = calculateTextStats(state.content);
              state.wordCount = stats.wordCount;
              state.characterCount = stats.characterCount;
              state.estimatedReadTime = stats.estimatedReadTime;
              state.hasUnsavedChanges = true;
            });
          },

          // 替换内容
          replaceContent: (start, end, content) => {
            set((state) => {
              const lines = state.content.split('\n');
              
              // 简化处理：只处理单行替换
              if (start.line === end.line) {
                const line = lines[start.line - 1] || '';
                const newLine = line.slice(0, start.column - 1) + content + line.slice(end.column - 1);
                lines[start.line - 1] = newLine;
                state.content = lines.join('\n');
              }
              
              const stats = calculateTextStats(state.content);
              state.wordCount = stats.wordCount;
              state.characterCount = stats.characterCount;
              state.estimatedReadTime = stats.estimatedReadTime;
              state.hasUnsavedChanges = true;
            });
          },

          // 设置标题
          setTitle: (title) => {
            set((state) => {
              state.title = title;
              state.hasUnsavedChanges = true;
            });
          },

          // 设置摘要
          setExcerpt: (excerpt) => {
            set((state) => {
              state.excerpt = excerpt;
              state.hasUnsavedChanges = true;
            });
          },

          // 设置标签
          setTags: (tags) => {
            set((state) => {
              state.tags = tags;
              state.hasUnsavedChanges = true;
            });
          },

          // 添加标签
          addTag: (tag) => {
            set((state) => {
              if (!state.tags.includes(tag)) {
                state.tags.push(tag);
                state.hasUnsavedChanges = true;
              }
            });
          },

          // 移除标签
          removeTag: (tag) => {
            set((state) => {
              const index = state.tags.indexOf(tag);
              if (index > -1) {
                state.tags.splice(index, 1);
                state.hasUnsavedChanges = true;
              }
            });
          },

          // 设置分类
          setCategories: (categories) => {
            set((state) => {
              state.categories = categories;
              state.hasUnsavedChanges = true;
            });
          },

          // 添加分类
          addCategory: (category) => {
            set((state) => {
              if (!state.categories.includes(category)) {
                state.categories.push(category);
                state.hasUnsavedChanges = true;
              }
            });
          },

          // 移除分类
          removeCategory: (category) => {
            set((state) => {
              const index = state.categories.indexOf(category);
              if (index > -1) {
                state.categories.splice(index, 1);
                state.hasUnsavedChanges = true;
              }
            });
          },

          // 设置状态
          setStatus: (status) => {
            set((state) => {
              state.status = status;
              state.hasUnsavedChanges = true;
            });
          },

          // 设置编辑器模式
          setMode: (mode) => {
            set((state) => {
              state.mode = mode;
            });
          },

          // 切换全屏
          toggleFullscreen: () => {
            set((state) => {
              state.isFullscreen = !state.isFullscreen;
            });
          },

          // 设置语言
          setLanguage: (language) => {
            set((state) => {
              state.language = language;
            });
          },

          // 创建草稿
          createDraft: (title = '未命名草稿') => {
            const draftId = generateDraftId();
            const state = get();
            
            set((draft) => {
              const newDraft: DraftInfo = {
                id: draftId,
                title,
                content: state.content,
                lastSaved: Date.now(),
                autoSaved: false,
                wordCount: state.wordCount,
                characterCount: state.characterCount,
                estimatedReadTime: state.estimatedReadTime
              };
              
              draft.drafts.push(newDraft);
              draft.currentDraftId = draftId;
            });
            
            return draftId;
          },

          // 加载草稿
          loadDraft: (draftId) => {
            const state = get();
            const draft = state.drafts.find(d => d.id === draftId);
            
            if (draft) {
              set((state) => {
                state.content = draft.content;
                state.title = draft.title;
                state.currentDraftId = draftId;
                state.wordCount = draft.wordCount;
                state.characterCount = draft.characterCount;
                state.estimatedReadTime = draft.estimatedReadTime;
                state.hasUnsavedChanges = false;
              });
            }
          },

          // 保存草稿
          saveDraft: (draftId) => {
            const state = get();
            const targetDraftId = draftId || state.currentDraftId;
            
            if (!targetDraftId) {
              // 创建新草稿
              state.createDraft(state.title || '未命名草稿');
              return;
            }
            
            set((state) => {
              const draftIndex = state.drafts.findIndex(d => d.id === targetDraftId);
              if (draftIndex > -1) {
                state.drafts[draftIndex] = {
                  ...state.drafts[draftIndex],
                  title: state.title || '未命名草稿',
                  content: state.content,
                  lastSaved: Date.now(),
                  autoSaved: false,
                  wordCount: state.wordCount,
                  characterCount: state.characterCount,
                  estimatedReadTime: state.estimatedReadTime
                };
                state.hasUnsavedChanges = false;
              }
            });
          },

          // 删除草稿
          deleteDraft: (draftId) => {
            set((state) => {
              const index = state.drafts.findIndex(d => d.id === draftId);
              if (index > -1) {
                state.drafts.splice(index, 1);
                if (state.currentDraftId === draftId) {
                  state.currentDraftId = null;
                }
              }
            });
          },

          // 自动保存草稿
          autoSaveDraft: () => {
            const state = get();
            
            if (!state.autoSaveEnabled || !state.hasUnsavedChanges) {
              return;
            }
            
            let targetDraftId = state.currentDraftId;
            
            if (!targetDraftId) {
              targetDraftId = state.createDraft('自动保存草稿');
            }
            
            set((state) => {
              const draftIndex = state.drafts.findIndex(d => d.id === targetDraftId);
              if (draftIndex > -1) {
                state.drafts[draftIndex] = {
                  ...state.drafts[draftIndex],
                  content: state.content,
                  lastSaved: Date.now(),
                  autoSaved: true,
                  wordCount: state.wordCount,
                  characterCount: state.characterCount,
                  estimatedReadTime: state.estimatedReadTime
                };
                state.lastAutoSave = Date.now();
                state.hasUnsavedChanges = false;
              }
            });
          },

          // 启用/禁用自动保存
          enableAutoSave: (enabled) => {
            set((state) => {
              state.autoSaveEnabled = enabled;
            });
          },

          // 设置自动保存间隔
          setAutoSaveInterval: (interval) => {
            set((state) => {
              state.autoSaveInterval = interval;
            });
          },

          // 添加到历史记录
          addToHistory: (description = '编辑操作') => {
            const state = get();
            
            set((state) => {
              const historyItem: EditorHistory = {
                id: generateHistoryId(),
                content: state.content,
                timestamp: Date.now(),
                description,
                wordCount: state.wordCount
              };
              
              // 移除当前位置之后的历史记录
              if (state.currentHistoryIndex < state.history.length - 1) {
                state.history = state.history.slice(0, state.currentHistoryIndex + 1);
              }
              
              state.history.push(historyItem);
              state.currentHistoryIndex = state.history.length - 1;
              
              // 限制历史记录数量
              if (state.history.length > state.maxHistorySize) {
                state.history = state.history.slice(-state.maxHistorySize);
                state.currentHistoryIndex = state.history.length - 1;
              }
            });
          },

          // 撤销
          undo: () => {
            const state = get();
            
            if (state.currentHistoryIndex > 0) {
              set((state) => {
                state.currentHistoryIndex--;
                const historyItem = state.history[state.currentHistoryIndex];
                if (historyItem) {
                  state.content = historyItem.content;
                  const stats = calculateTextStats(historyItem.content);
                  state.wordCount = stats.wordCount;
                  state.characterCount = stats.characterCount;
                  state.estimatedReadTime = stats.estimatedReadTime;
                }
              });
            }
          },

          // 重做
          redo: () => {
            const state = get();
            
            if (state.currentHistoryIndex < state.history.length - 1) {
              set((state) => {
                state.currentHistoryIndex++;
                const historyItem = state.history[state.currentHistoryIndex];
                if (historyItem) {
                  state.content = historyItem.content;
                  const stats = calculateTextStats(historyItem.content);
                  state.wordCount = stats.wordCount;
                  state.characterCount = stats.characterCount;
                  state.estimatedReadTime = stats.estimatedReadTime;
                }
              });
            }
          },

          // 清除历史记录
          clearHistory: () => {
            set((state) => {
              state.history = [];
              state.currentHistoryIndex = -1;
            });
          },

          // 新建文章
          newPost: () => {
            set((state) => {
              state.currentPost = null;
              state.content = '';
              state.title = '';
              state.excerpt = '';
              state.tags = [];
              state.categories = [];
              state.status = 'draft';
              state.wordCount = 0;
              state.characterCount = 0;
              state.estimatedReadTime = 0;
              state.hasUnsavedChanges = false;
              state.currentDraftId = null;
              state.history = [];
              state.currentHistoryIndex = -1;
              state.errors = [];
              state.error = null;
            });
          },

          // 加载文章
          loadPost: async (postId) => {
            set((state) => {
              state.isLoading = true;
              state.error = null;
            });

            try {
              const response = await httpClient.get(`${API_ENDPOINTS.BLOG.GET_POST}/${postId}`);
              
              if (response.success && response.data) {
                const post = response.data;
                
                set((state) => {
                  state.currentPost = post;
                  state.content = post.content || '';
                  state.title = post.title || '';
                  state.excerpt = post.excerpt || '';
                  state.tags = post.tags || [];
                  state.categories = post.categories || [];
                  state.status = post.status || 'draft';
                  
                  const stats = calculateTextStats(state.content);
                  state.wordCount = stats.wordCount;
                  state.characterCount = stats.characterCount;
                  state.estimatedReadTime = stats.estimatedReadTime;
                  
                  state.hasUnsavedChanges = false;
                });
              } else {
                throw new Error(response.message || 'Failed to load post');
              }
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to load post';
              });
            } finally {
              set((state) => {
                state.isLoading = false;
              });
            }
          },

          // 保存文章
          savePost: async () => {
            const state = get();
            
            set((state) => {
              state.isSaving = true;
              state.error = null;
            });

            try {
              const postData = {
                title: state.title,
                content: state.content,
                excerpt: state.excerpt,
                tags: state.tags,
                categories: state.categories,
                status: state.status
              };

              let response;
              if (state.currentPost?.id) {
                // 更新现有文章
                response = await httpClient.put(`${API_ENDPOINTS.BLOG.UPDATE_POST}/${state.currentPost.id}`, postData);
              } else {
                // 创建新文章
                response = await httpClient.post(API_ENDPOINTS.BLOG.CREATE_POST, postData);
              }
              
              if (response.success && response.data) {
                set((state) => {
                  state.currentPost = response.data;
                  state.hasUnsavedChanges = false;
                });
              } else {
                throw new Error(response.message || 'Failed to save post');
              }
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to save post';
              });
              throw error;
            } finally {
              set((state) => {
                state.isSaving = false;
              });
            }
          },

          // 发布文章
          publishPost: async () => {
            const state = get();
            
            set((state) => {
              state.isPublishing = true;
              state.error = null;
            });

            try {
              // 先保存文章
              await state.savePost();
              
              // 然后发布
              if (state.currentPost?.id) {
                const response = await httpClient.post(`${API_ENDPOINTS.BLOG.PUBLISH_POST}/${state.currentPost.id}`);
                
                if (response.success) {
                  set((state) => {
                    state.status = 'published';
                    if (state.currentPost) {
                      state.currentPost.status = 'published';
                    }
                  });
                } else {
                  throw new Error(response.message || 'Failed to publish post');
                }
              }
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Failed to publish post';
              });
              throw error;
            } finally {
              set((state) => {
                state.isPublishing = false;
              });
            }
          },

          // 搜索
          search: (query) => {
            set((state) => {
              state.searchQuery = query;
              state.searchResults = [];
              state.currentSearchIndex = -1;
              
              if (query) {
                const lines = state.content.split('\n');
                lines.forEach((line, lineIndex) => {
                  let columnIndex = 0;
                  while (true) {
                    const index = line.indexOf(query, columnIndex);
                    if (index === -1) break;
                    
                    state.searchResults.push({
                      line: lineIndex + 1,
                      column: index + 1,
                      length: query.length
                    });
                    
                    columnIndex = index + 1;
                  }
                });
                
                if (state.searchResults.length > 0) {
                  state.currentSearchIndex = 0;
                }
              }
            });
          },

          // 替换
          replace: (query, replacement) => {
            const state = get();
            if (state.currentSearchIndex >= 0 && state.currentSearchIndex < state.searchResults.length) {
              const result = state.searchResults[state.currentSearchIndex];
              state.replaceContent(
                { line: result.line, column: result.column },
                { line: result.line, column: result.column + result.length },
                replacement
              );
              
              // 重新搜索
              state.search(query);
            }
          },

          // 全部替换
          replaceAll: (query, replacement) => {
            set((state) => {
              state.content = state.content.replace(new RegExp(query, 'g'), replacement);
              const stats = calculateTextStats(state.content);
              state.wordCount = stats.wordCount;
              state.characterCount = stats.characterCount;
              state.estimatedReadTime = stats.estimatedReadTime;
              state.hasUnsavedChanges = true;
            });
            
            // 重新搜索
            get().search(query);
          },

          // 清除搜索
          clearSearch: () => {
            set((state) => {
              state.searchQuery = '';
              state.replaceQuery = '';
              state.searchResults = [];
              state.currentSearchIndex = -1;
            });
          },

          // 设置光标位置
          setCursorPosition: (position) => {
            set((state) => {
              state.cursorPosition = position;
            });
          },

          // 设置选择区域
          setSelection: (start, end) => {
            set((state) => {
              state.selection = { start, end };
            });
          },

          // 启用插件
          enablePlugin: (pluginId) => {
            set((state) => {
              const plugin = state.plugins.find(p => p.id === pluginId);
              if (plugin) {
                plugin.enabled = true;
              }
            });
          },

          // 禁用插件
          disablePlugin: (pluginId) => {
            set((state) => {
              const plugin = state.plugins.find(p => p.id === pluginId);
              if (plugin) {
                plugin.enabled = false;
              }
            });
          },

          // 更新插件配置
          updatePluginConfig: (pluginId, config) => {
            set((state) => {
              const plugin = state.plugins.find(p => p.id === pluginId);
              if (plugin) {
                plugin.config = { ...plugin.config, ...config };
              }
            });
          },

          // 更新快捷键
          updateShortcut: (shortcut) => {
            set((state) => {
              const index = state.shortcuts.findIndex(s => s.command === shortcut.command);
              if (index > -1) {
                state.shortcuts[index] = shortcut;
              } else {
                state.shortcuts.push(shortcut);
              }
            });
          },

          // 重置快捷键
          resetShortcuts: () => {
            set((state) => {
              state.shortcuts = defaultShortcuts;
            });
          },

          // 添加错误
          addError: (line, message, severity) => {
            set((state) => {
              state.errors.push({ line, message, severity });
            });
          },

          // 清除错误
          clearErrors: () => {
            set((state) => {
              state.errors = [];
            });
          },

          // 更新统计信息
          updateStatistics: () => {
            const state = get();
            const stats = calculateTextStats(state.content);
            
            set((state) => {
              state.wordCount = stats.wordCount;
              state.characterCount = stats.characterCount;
              state.estimatedReadTime = stats.estimatedReadTime;
            });
          },

          // 重置状态
          reset: () => {
            set(() => initialEditorState);
          },

          // 设置错误
          setError: (error) => {
            set((state) => {
              state.error = error;
            });
          }
        }))
      ),
      {
        name: 'editor-store',
        partialize: (state) => ({
          config: state.config,
          shortcuts: state.shortcuts,
          plugins: state.plugins,
          drafts: state.drafts,
          autoSaveEnabled: state.autoSaveEnabled,
          autoSaveInterval: state.autoSaveInterval,
          maxHistorySize: state.maxHistorySize
        })
      }
    ),
    {
      name: 'editor-store'
    }
  );

// ==================== 导出工具函数 ====================

/**
 * 获取编辑器内容
 */
export const useEditorContent = () => {
  return useEditorStore((state) => ({
    content: state.content,
    title: state.title,
    excerpt: state.excerpt,
    tags: state.tags,
    categories: state.categories,
    status: state.status,
    wordCount: state.wordCount,
    characterCount: state.characterCount,
    estimatedReadTime: state.estimatedReadTime,
    hasUnsavedChanges: state.hasUnsavedChanges,
    setContent: state.setContent,
    updateContent: state.updateContent,
    setTitle: state.setTitle,
    setExcerpt: state.setExcerpt,
    setTags: state.setTags,
    setCategories: state.setCategories,
    setStatus: state.setStatus
  }));
};

/**
 * 获取编辑器配置
 */
export const useEditorConfig = () => {
  return useEditorStore((state) => ({
    config: state.config,
    mode: state.mode,
    language: state.language,
    isFullscreen: state.isFullscreen,
    updateConfig: state.updateConfig,
    resetConfig: state.resetConfig,
    setMode: state.setMode,
    setLanguage: state.setLanguage,
    toggleFullscreen: state.toggleFullscreen
  }));
};

/**
 * 获取草稿管理
 */
export const useEditorDrafts = () => {
  return useEditorStore((state) => ({
    drafts: state.drafts,
    currentDraftId: state.currentDraftId,
    autoSaveEnabled: state.autoSaveEnabled,
    autoSaveInterval: state.autoSaveInterval,
    lastAutoSave: state.lastAutoSave,
    createDraft: state.createDraft,
    loadDraft: state.loadDraft,
    saveDraft: state.saveDraft,
    deleteDraft: state.deleteDraft,
    autoSaveDraft: state.autoSaveDraft,
    enableAutoSave: state.enableAutoSave,
    setAutoSaveInterval: state.setAutoSaveInterval
  }));
};

/**
 * 获取编辑历史
 */
export const useEditorHistory = () => {
  return useEditorStore((state) => ({
    history: state.history,
    currentHistoryIndex: state.currentHistoryIndex,
    addToHistory: state.addToHistory,
    undo: state.undo,
    redo: state.redo,
    clearHistory: state.clearHistory
  }));
};

/**
 * 获取搜索功能
 */
export const useEditorSearch = () => {
  return useEditorStore((state) => ({
    searchQuery: state.searchQuery,
    replaceQuery: state.replaceQuery,
    searchResults: state.searchResults,
    currentSearchIndex: state.currentSearchIndex,
    search: state.search,
    replace: state.replace,
    replaceAll: state.replaceAll,
    clearSearch: state.clearSearch
  }));
};

/**
 * 获取编辑器状态
 */
export const useEditorStatus = () => {
  return useEditorStore((state) => ({
    isInitialized: state.isInitialized,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    isPublishing: state.isPublishing,
    error: state.error,
    errors: state.errors,
    initialize: state.initialize,
    newPost: state.newPost,
    loadPost: state.loadPost,
    savePost: state.savePost,
    publishPost: state.publishPost,
    reset: state.reset,
    setError: state.setError
  }));
};

/**
 * 获取插件管理
 */
export const useEditorPlugins = () => {
  return useEditorStore((state) => ({
    plugins: state.plugins,
    enablePlugin: state.enablePlugin,
    disablePlugin: state.disablePlugin,
    updatePluginConfig: state.updatePluginConfig
  }));
};

/**
 * 获取快捷键管理
 */
export const useEditorShortcuts = () => {
  return useEditorStore((state) => ({
    shortcuts: state.shortcuts,
    updateShortcut: state.updateShortcut,
    resetShortcuts: state.resetShortcuts
  }));
};