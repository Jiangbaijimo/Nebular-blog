import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import * as monaco from 'monaco-editor';
import { cn } from '../../../utils/common';

// Monaco编辑器配置接口
interface MonacoEditorProps {
  value?: string;
  defaultValue?: string;
  language?: string;
  theme?: 'vs' | 'vs-dark' | 'hc-black';
  options?: monaco.editor.IStandaloneEditorConstructionOptions;
  width?: string | number;
  height?: string | number;
  className?: string;
  onChange?: (value: string, event: monaco.editor.IModelContentChangedEvent) => void;
  onMount?: (editor: monaco.editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => void;
  onValidate?: (markers: monaco.editor.IMarker[]) => void;
  onCursorPositionChange?: (position: monaco.Position) => void;
  onSelectionChange?: (selection: monaco.Selection) => void;
  loading?: React.ReactNode;
  keepCurrentModel?: boolean;
  saveViewState?: boolean;
}

// 编辑器实例方法接口
export interface MonacoEditorRef {
  editor: monaco.editor.IStandaloneCodeEditor | null;
  monaco: typeof import('monaco-editor') | null;
  getValue: () => string;
  setValue: (value: string) => void;
  focus: () => void;
  getPosition: () => monaco.Position | null;
  setPosition: (position: monaco.IPosition) => void;
  getSelection: () => monaco.Selection | null;
  setSelection: (selection: monaco.IRange) => void;
  insertText: (text: string, position?: monaco.IPosition) => void;
  replaceText: (range: monaco.IRange, text: string) => void;
  undo: () => void;
  redo: () => void;
  format: () => void;
  resize: () => void;
}

const MonacoEditor = forwardRef<MonacoEditorRef, MonacoEditorProps>((
  {
    value,
    defaultValue = '',
    language = 'markdown',
    theme = 'vs',
    options = {},
    width = '100%',
    height = '400px',
    className,
    onChange,
    onMount,
    onValidate,
    onCursorPositionChange,
    onSelectionChange,
    loading,
    keepCurrentModel = false,
    saveViewState = true
  },
  ref
) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null);
  const subscriptionRef = useRef<monaco.IDisposable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const preventTriggerChangeEvent = useRef(false);
  const viewStates = useRef<Map<string, monaco.editor.ICodeEditorViewState>>(new Map());

  // 默认编辑器选项
  const defaultOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    automaticLayout: true,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Consolas, "Courier New", monospace',
    wordWrap: 'on',
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    renderLineHighlight: 'line',
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: false,
    cursorStyle: 'line',
    automaticLayout: true,
    glyphMargin: true,
    folding: true,
    lineNumbers: 'on',
    lineDecorationsWidth: 10,
    lineNumbersMinChars: 3,
    renderWhitespace: 'selection',
    contextmenu: true,
    mouseWheelZoom: true,
    multiCursorModifier: 'ctrlCmd',
    accessibilitySupport: 'auto',
    quickSuggestions: {
      other: true,
      comments: true,
      strings: true
    },
    parameterHints: {
      enabled: true
    },
    autoIndent: 'full',
    formatOnType: true,
    formatOnPaste: true,
    dragAndDrop: true,
    links: true,
    colorDecorators: true,
    lightbulb: {
      enabled: true
    },
    find: {
      seedSearchStringFromSelection: 'always',
      autoFindInSelection: 'never'
    }
  };

  // 合并选项
  const editorOptions = { ...defaultOptions, ...options };

  // 暴露编辑器方法
  useImperativeHandle(ref, () => ({
    editor: editorRef.current,
    monaco: monacoRef.current,
    getValue: () => editorRef.current?.getValue() || '',
    setValue: (newValue: string) => {
      if (editorRef.current) {
        preventTriggerChangeEvent.current = true;
        editorRef.current.setValue(newValue);
        preventTriggerChangeEvent.current = false;
      }
    },
    focus: () => editorRef.current?.focus(),
    getPosition: () => editorRef.current?.getPosition() || null,
    setPosition: (position: monaco.IPosition) => {
      editorRef.current?.setPosition(position);
    },
    getSelection: () => editorRef.current?.getSelection() || null,
    setSelection: (selection: monaco.IRange) => {
      editorRef.current?.setSelection(selection);
    },
    insertText: (text: string, position?: monaco.IPosition) => {
      if (editorRef.current) {
        const pos = position || editorRef.current.getPosition();
        if (pos) {
          editorRef.current.executeEdits('insert-text', [{
            range: new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
            text
          }]);
        }
      }
    },
    replaceText: (range: monaco.IRange, text: string) => {
      if (editorRef.current) {
        editorRef.current.executeEdits('replace-text', [{
          range,
          text
        }]);
      }
    },
    undo: () => editorRef.current?.trigger('keyboard', 'undo', null),
    redo: () => editorRef.current?.trigger('keyboard', 'redo', null),
    format: () => editorRef.current?.trigger('keyboard', 'editor.action.formatDocument', null),
    resize: () => editorRef.current?.layout()
  }), []);

  // 初始化Monaco编辑器
  useEffect(() => {
    const initMonaco = async () => {
      try {
        setIsLoading(true);
        
        // 配置Monaco环境
        if (typeof window !== 'undefined') {
          // 设置Monaco的worker路径
          (window as any).MonacoEnvironment = {
            getWorkerUrl: function (moduleId: string, label: string) {
              if (label === 'json') {
                return './json.worker.js';
              }
              if (label === 'css' || label === 'scss' || label === 'less') {
                return './css.worker.js';
              }
              if (label === 'html' || label === 'handlebars' || label === 'razor') {
                return './html.worker.js';
              }
              if (label === 'typescript' || label === 'javascript') {
                return './ts.worker.js';
              }
              return './editor.worker.js';
            }
          };
        }

        if (containerRef.current && !editorRef.current) {
          // 创建编辑器实例
          const editor = monaco.editor.create(containerRef.current, {
            value: value || defaultValue,
            language,
            theme,
            ...editorOptions
          });

          editorRef.current = editor;
          monacoRef.current = monaco;

          // 设置编辑器事件监听
          const disposables: monaco.IDisposable[] = [];

          // 内容变化事件
          disposables.push(
            editor.onDidChangeModelContent((event) => {
              if (!preventTriggerChangeEvent.current && onChange) {
                onChange(editor.getValue(), event);
              }
            })
          );

          // 光标位置变化事件
          if (onCursorPositionChange) {
            disposables.push(
              editor.onDidChangeCursorPosition((event) => {
                onCursorPositionChange(event.position);
              })
            );
          }

          // 选择变化事件
          if (onSelectionChange) {
            disposables.push(
              editor.onDidChangeCursorSelection((event) => {
                onSelectionChange(event.selection);
              })
            );
          }

          // 验证事件
          if (onValidate) {
            disposables.push(
              monaco.editor.onDidChangeMarkers(([resource]) => {
                const markers = monaco.editor.getModelMarkers({ resource });
                onValidate(markers);
              })
            );
          }

          subscriptionRef.current = disposables;

          // 调用onMount回调
          if (onMount) {
            onMount(editor, monaco);
          }

          setIsEditorReady(true);
        }
      } catch (error) {
        console.error('Monaco Editor initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initMonaco();

    // 清理函数
    return () => {
      subscriptionRef.current.forEach(disposable => disposable.dispose());
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, []);

  // 更新编辑器值
  useEffect(() => {
    if (isEditorReady && editorRef.current && value !== undefined) {
      const currentValue = editorRef.current.getValue();
      if (currentValue !== value) {
        preventTriggerChangeEvent.current = true;
        editorRef.current.setValue(value);
        preventTriggerChangeEvent.current = false;
      }
    }
  }, [value, isEditorReady]);

  // 更新编辑器语言
  useEffect(() => {
    if (isEditorReady && editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, language);
      }
    }
  }, [language, isEditorReady]);

  // 更新编辑器主题
  useEffect(() => {
    if (isEditorReady && monacoRef.current) {
      monaco.editor.setTheme(theme);
    }
  }, [theme, isEditorReady]);

  // 更新编辑器选项
  useEffect(() => {
    if (isEditorReady && editorRef.current) {
      editorRef.current.updateOptions(editorOptions);
    }
  }, [options, isEditorReady]);

  // 处理窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (editorRef.current) {
        editorRef.current.layout();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 保存和恢复视图状态
  useEffect(() => {
    if (saveViewState && isEditorReady && editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        const uri = model.uri.toString();
        const savedViewState = viewStates.current.get(uri);
        if (savedViewState) {
          editorRef.current.restoreViewState(savedViewState);
        }

        return () => {
          if (editorRef.current) {
            const currentViewState = editorRef.current.saveViewState();
            if (currentViewState) {
              viewStates.current.set(uri, currentViewState);
            }
          }
        };
      }
    }
  }, [saveViewState, isEditorReady]);

  const containerStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  };

  return (
    <div className={cn('relative', className)} style={containerStyle}>
      {isLoading && loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 z-10">
          {loading}
        </div>
      )}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ opacity: isLoading ? 0 : 1 }}
      />
    </div>
  );
});

MonacoEditor.displayName = 'MonacoEditor';

// 预设的Markdown编辑器
export const MarkdownEditor = forwardRef<MonacoEditorRef, Omit<MonacoEditorProps, 'language'>>(
  (props, ref) => {
    const markdownOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
      wordWrap: 'on',
      lineNumbers: 'on',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      quickSuggestions: false,
      parameterHints: { enabled: false },
      suggestOnTriggerCharacters: false,
      acceptSuggestionOnEnter: 'off',
      tabCompletion: 'off',
      wordBasedSuggestions: false,
      ...props.options
    };

    return (
      <MonacoEditor
        ref={ref}
        language="markdown"
        options={markdownOptions}
        {...props}
      />
    );
  }
);

MarkdownEditor.displayName = 'MarkdownEditor';

export { MonacoEditor };
export default MonacoEditor;