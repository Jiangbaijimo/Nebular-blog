import React, { createContext, useContext, useReducer, useRef, useCallback, useEffect } from 'react';
import { MonacoEditorRef } from './MonacoEditor';
import * as monaco from 'monaco-editor';

// 编辑器状态接口
interface EditorState {
  content: string;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  cursorPosition: monaco.Position | null;
  selection: monaco.Selection | null;
  viewMode: 'edit' | 'preview' | 'split';
  theme: 'vs' | 'vs-dark' | 'hc-black';
  fontSize: number;
  wordWrap: boolean;
  lineNumbers: boolean;
  minimap: boolean;
  autoSave: boolean;
  autoSaveInterval: number; // 秒
  history: {
    canUndo: boolean;
    canRedo: boolean;
  };
  errors: monaco.editor.IMarker[];
  searchQuery: string;
  replaceQuery: string;
  isSearchVisible: boolean;
  isReplaceVisible: boolean;
}

// 编辑器动作类型
type EditorAction =
  | { type: 'SET_CONTENT'; payload: string }
  | { type: 'SET_DIRTY'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_LAST_SAVED'; payload: Date }
  | { type: 'SET_CURSOR_POSITION'; payload: monaco.Position }
  | { type: 'SET_SELECTION'; payload: monaco.Selection }
  | { type: 'SET_VIEW_MODE'; payload: 'edit' | 'preview' | 'split' }
  | { type: 'SET_THEME'; payload: 'vs' | 'vs-dark' | 'hc-black' }
  | { type: 'SET_FONT_SIZE'; payload: number }
  | { type: 'SET_WORD_WRAP'; payload: boolean }
  | { type: 'SET_LINE_NUMBERS'; payload: boolean }
  | { type: 'SET_MINIMAP'; payload: boolean }
  | { type: 'SET_AUTO_SAVE'; payload: boolean }
  | { type: 'SET_AUTO_SAVE_INTERVAL'; payload: number }
  | { type: 'SET_HISTORY'; payload: { canUndo: boolean; canRedo: boolean } }
  | { type: 'SET_ERRORS'; payload: monaco.editor.IMarker[] }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_REPLACE_QUERY'; payload: string }
  | { type: 'SET_SEARCH_VISIBLE'; payload: boolean }
  | { type: 'SET_REPLACE_VISIBLE'; payload: boolean }
  | { type: 'RESET_STATE' };

// 编辑器上下文接口
interface EditorContextType {
  state: EditorState;
  dispatch: React.Dispatch<EditorAction>;
  editorRef: React.RefObject<MonacoEditorRef>;
  
  // 内容操作
  setContent: (content: string) => void;
  getContent: () => string;
  insertText: (text: string, position?: monaco.IPosition) => void;
  replaceText: (range: monaco.IRange, text: string) => void;
  
  // 编辑器操作
  focus: () => void;
  undo: () => void;
  redo: () => void;
  format: () => void;
  
  // 位置和选择
  getCursorPosition: () => monaco.Position | null;
  setCursorPosition: (position: monaco.IPosition) => void;
  getSelection: () => monaco.Selection | null;
  setSelection: (selection: monaco.IRange) => void;
  
  // 搜索和替换
  find: (query: string) => void;
  replace: (query: string, replacement: string) => void;
  replaceAll: (query: string, replacement: string) => void;
  
  // 保存操作
  save: () => Promise<void>;
  autoSaveEnabled: boolean;
  
  // 视图控制
  setViewMode: (mode: 'edit' | 'preview' | 'split') => void;
  togglePreview: () => void;
  
  // 设置
  updateSettings: (settings: Partial<EditorState>) => void;
  
  // 事件回调
  onContentChange?: (content: string) => void;
  onSave?: (content: string) => Promise<void>;
  onError?: (error: Error) => void;
}

// 初始状态
const initialState: EditorState = {
  content: '',
  isDirty: false,
  isLoading: false,
  isSaving: false,
  lastSaved: null,
  cursorPosition: null,
  selection: null,
  viewMode: 'edit',
  theme: 'vs',
  fontSize: 14,
  wordWrap: true,
  lineNumbers: true,
  minimap: false,
  autoSave: true,
  autoSaveInterval: 30,
  history: {
    canUndo: false,
    canRedo: false
  },
  errors: [],
  searchQuery: '',
  replaceQuery: '',
  isSearchVisible: false,
  isReplaceVisible: false
};

// 状态reducer
const editorReducer = (state: EditorState, action: EditorAction): EditorState => {
  switch (action.type) {
    case 'SET_CONTENT':
      return { ...state, content: action.payload, isDirty: true };
    case 'SET_DIRTY':
      return { ...state, isDirty: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_SAVING':
      return { ...state, isSaving: action.payload };
    case 'SET_LAST_SAVED':
      return { ...state, lastSaved: action.payload, isDirty: false };
    case 'SET_CURSOR_POSITION':
      return { ...state, cursorPosition: action.payload };
    case 'SET_SELECTION':
      return { ...state, selection: action.payload };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_FONT_SIZE':
      return { ...state, fontSize: action.payload };
    case 'SET_WORD_WRAP':
      return { ...state, wordWrap: action.payload };
    case 'SET_LINE_NUMBERS':
      return { ...state, lineNumbers: action.payload };
    case 'SET_MINIMAP':
      return { ...state, minimap: action.payload };
    case 'SET_AUTO_SAVE':
      return { ...state, autoSave: action.payload };
    case 'SET_AUTO_SAVE_INTERVAL':
      return { ...state, autoSaveInterval: action.payload };
    case 'SET_HISTORY':
      return { ...state, history: action.payload };
    case 'SET_ERRORS':
      return { ...state, errors: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_REPLACE_QUERY':
      return { ...state, replaceQuery: action.payload };
    case 'SET_SEARCH_VISIBLE':
      return { ...state, isSearchVisible: action.payload };
    case 'SET_REPLACE_VISIBLE':
      return { ...state, isReplaceVisible: action.payload };
    case 'RESET_STATE':
      return { ...initialState };
    default:
      return state;
  }
};

// 创建上下文
const EditorContext = createContext<EditorContextType | null>(null);

// 编辑器提供者组件属性
interface EditorProviderProps {
  children: React.ReactNode;
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onSave?: (content: string) => Promise<void>;
  onError?: (error: Error) => void;
  autoSave?: boolean;
  autoSaveInterval?: number;
}

// 编辑器提供者组件
export const EditorProvider: React.FC<EditorProviderProps> = ({
  children,
  initialContent = '',
  onContentChange,
  onSave,
  onError,
  autoSave = true,
  autoSaveInterval = 30
}) => {
  const [state, dispatch] = useReducer(editorReducer, {
    ...initialState,
    content: initialContent,
    autoSave,
    autoSaveInterval
  });
  
  const editorRef = useRef<MonacoEditorRef>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef<string>(initialContent);

  // 内容操作方法
  const setContent = useCallback((content: string) => {
    dispatch({ type: 'SET_CONTENT', payload: content });
    if (editorRef.current) {
      editorRef.current.setValue(content);
    }
    lastContentRef.current = content;
  }, []);

  const getContent = useCallback(() => {
    return editorRef.current?.getValue() || state.content;
  }, [state.content]);

  const insertText = useCallback((text: string, position?: monaco.IPosition) => {
    if (editorRef.current) {
      editorRef.current.insertText(text, position);
    }
  }, []);

  const replaceText = useCallback((range: monaco.IRange, text: string) => {
    if (editorRef.current) {
      editorRef.current.replaceText(range, text);
    }
  }, []);

  // 编辑器操作方法
  const focus = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  const undo = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.undo();
    }
  }, []);

  const redo = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.redo();
    }
  }, []);

  const format = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.format();
    }
  }, []);

  // 位置和选择方法
  const getCursorPosition = useCallback(() => {
    return editorRef.current?.getPosition() || null;
  }, []);

  const setCursorPosition = useCallback((position: monaco.IPosition) => {
    if (editorRef.current) {
      editorRef.current.setPosition(position);
    }
  }, []);

  const getSelection = useCallback(() => {
    return editorRef.current?.getSelection() || null;
  }, []);

  const setSelection = useCallback((selection: monaco.IRange) => {
    if (editorRef.current) {
      editorRef.current.setSelection(selection);
    }
  }, []);

  // 搜索和替换方法
  const find = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
    dispatch({ type: 'SET_SEARCH_VISIBLE', payload: true });
    if (editorRef.current?.editor) {
      editorRef.current.editor.trigger('keyboard', 'actions.find', null);
    }
  }, []);

  const replace = useCallback((query: string, replacement: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
    dispatch({ type: 'SET_REPLACE_QUERY', payload: replacement });
    dispatch({ type: 'SET_REPLACE_VISIBLE', payload: true });
    if (editorRef.current?.editor) {
      editorRef.current.editor.trigger('keyboard', 'editor.action.startFindReplaceAction', null);
    }
  }, []);

  const replaceAll = useCallback((query: string, replacement: string) => {
    if (editorRef.current?.editor) {
      const model = editorRef.current.editor.getModel();
      if (model) {
        const matches = model.findMatches(query, false, false, false, null, false);
        const edits = matches.map(match => ({
          range: match.range,
          text: replacement
        }));
        editorRef.current.editor.executeEdits('replace-all', edits);
      }
    }
  }, []);

  // 保存方法
  const save = useCallback(async () => {
    if (state.isSaving) return;
    
    try {
      dispatch({ type: 'SET_SAVING', payload: true });
      const content = getContent();
      
      if (onSave) {
        await onSave(content);
      }
      
      dispatch({ type: 'SET_LAST_SAVED', payload: new Date() });
      lastContentRef.current = content;
    } catch (error) {
      if (onError) {
        onError(error as Error);
      }
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [state.isSaving, getContent, onSave, onError]);

  // 视图控制方法
  const setViewMode = useCallback((mode: 'edit' | 'preview' | 'split') => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
  }, []);

  const togglePreview = useCallback(() => {
    const newMode = state.viewMode === 'preview' ? 'edit' : 'preview';
    dispatch({ type: 'SET_VIEW_MODE', payload: newMode });
  }, [state.viewMode]);

  // 设置更新方法
  const updateSettings = useCallback((settings: Partial<EditorState>) => {
    Object.entries(settings).forEach(([key, value]) => {
      switch (key) {
        case 'theme':
          dispatch({ type: 'SET_THEME', payload: value as any });
          break;
        case 'fontSize':
          dispatch({ type: 'SET_FONT_SIZE', payload: value as number });
          break;
        case 'wordWrap':
          dispatch({ type: 'SET_WORD_WRAP', payload: value as boolean });
          break;
        case 'lineNumbers':
          dispatch({ type: 'SET_LINE_NUMBERS', payload: value as boolean });
          break;
        case 'minimap':
          dispatch({ type: 'SET_MINIMAP', payload: value as boolean });
          break;
        case 'autoSave':
          dispatch({ type: 'SET_AUTO_SAVE', payload: value as boolean });
          break;
        case 'autoSaveInterval':
          dispatch({ type: 'SET_AUTO_SAVE_INTERVAL', payload: value as number });
          break;
      }
    });
  }, []);

  // 自动保存逻辑
  useEffect(() => {
    if (state.autoSave && state.isDirty && !state.isSaving) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      autoSaveTimerRef.current = setTimeout(() => {
        save();
      }, state.autoSaveInterval * 1000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [state.autoSave, state.isDirty, state.isSaving, state.autoSaveInterval, save]);

  // 内容变化监听
  useEffect(() => {
    if (onContentChange && state.content !== lastContentRef.current) {
      onContentChange(state.content);
    }
  }, [state.content, onContentChange]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault();
            save();
            break;
          case 'f':
            event.preventDefault();
            find('');
            break;
          case 'h':
            event.preventDefault();
            replace('', '');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [save, find, replace]);

  const contextValue: EditorContextType = {
    state,
    dispatch,
    editorRef,
    setContent,
    getContent,
    insertText,
    replaceText,
    focus,
    undo,
    redo,
    format,
    getCursorPosition,
    setCursorPosition,
    getSelection,
    setSelection,
    find,
    replace,
    replaceAll,
    save,
    autoSaveEnabled: state.autoSave,
    setViewMode,
    togglePreview,
    updateSettings,
    onContentChange,
    onSave,
    onError
  };

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  );
};

// 使用编辑器上下文的Hook
export const useEditor = (): EditorContextType => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
};

// 编辑器状态Hook
export const useEditorState = () => {
  const { state } = useEditor();
  return state;
};

// 编辑器操作Hook
export const useEditorActions = () => {
  const {
    setContent,
    getContent,
    insertText,
    replaceText,
    focus,
    undo,
    redo,
    format,
    save,
    setViewMode,
    togglePreview,
    updateSettings
  } = useEditor();
  
  return {
    setContent,
    getContent,
    insertText,
    replaceText,
    focus,
    undo,
    redo,
    format,
    save,
    setViewMode,
    togglePreview,
    updateSettings
  };
};

export default EditorProvider;