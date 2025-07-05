// 编辑器相关类型定义

export interface EditorState {
  content: string;
  title: string;
  isDirty: boolean;
  isAutoSaving: boolean;
  lastSaved?: Date;
  cursorPosition?: CursorPosition;
  selection?: TextSelection;
  history: EditorHistory;
}

export interface CursorPosition {
  line: number;
  column: number;
  offset: number;
}

export interface TextSelection {
  start: CursorPosition;
  end: CursorPosition;
  text: string;
}

export interface EditorHistory {
  undoStack: EditorAction[];
  redoStack: EditorAction[];
  maxSize: number;
}

export interface EditorAction {
  type: EditorActionType;
  content: string;
  position: CursorPosition;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export enum EditorActionType {
  INSERT = 'insert',
  DELETE = 'delete',
  REPLACE = 'replace',
  FORMAT = 'format',
  PASTE = 'paste'
}

export interface EditorConfig {
  theme: EditorTheme;
  language: string;
  fontSize: number;
  tabSize: number;
  insertSpaces: boolean;
  wordWrap: boolean;
  lineNumbers: boolean;
  minimap: boolean;
  folding: boolean;
  autoIndent: boolean;
  autoClosingBrackets: boolean;
  autoClosingQuotes: boolean;
  formatOnSave: boolean;
  formatOnPaste: boolean;
}

export enum EditorTheme {
  VS_DARK = 'vs-dark',
  VS_LIGHT = 'vs-light',
  HC_BLACK = 'hc-black',
  MONOKAI = 'monokai',
  GITHUB = 'github'
}

export interface MarkdownExtension {
  name: string;
  syntax: string;
  render: (content: string) => string;
  preview?: boolean;
  toolbar?: ToolbarButton;
}

export interface ToolbarButton {
  icon: string;
  title: string;
  action: () => void;
  shortcut?: string;
  group?: string;
}

export interface EditorPlugin {
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  config?: Record<string, any>;
  hooks: PluginHooks;
}

export interface PluginHooks {
  onInit?: (editor: any) => void;
  onContentChange?: (content: string) => void;
  onSave?: (content: string) => void;
  onDestroy?: () => void;
}

export interface AutoSaveConfig {
  enabled: boolean;
  interval: number; // milliseconds
  minChanges: number;
  saveOnBlur: boolean;
  saveOnFocusLoss: boolean;
}

export interface SpellCheckConfig {
  enabled: boolean;
  language: string;
  customDictionary: string[];
  ignoreWords: string[];
}

export interface CodeHighlightConfig {
  enabled: boolean;
  theme: string;
  languages: string[];
  showLineNumbers: boolean;
  wrapLongLines: boolean;
}

export interface ImageInsertOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  alt?: string;
  title?: string;
  caption?: string;
}

export interface LinkInsertOptions {
  url: string;
  text?: string;
  title?: string;
  target?: '_blank' | '_self';
  rel?: string;
}

export interface TableInsertOptions {
  rows: number;
  columns: number;
  headers: boolean;
  alignment?: ('left' | 'center' | 'right')[];
}

export interface EditorShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  action: string | (() => void);
  description: string;
}

export interface EditorValidation {
  rules: ValidationRule[];
  showErrors: boolean;
  validateOnChange: boolean;
  validateOnSave: boolean;
}

export interface ValidationRule {
  name: string;
  message: string;
  validator: (content: string) => boolean;
  severity: 'error' | 'warning' | 'info';
}

export interface EditorMetrics {
  wordCount: number;
  characterCount: number;
  characterCountNoSpaces: number;
  paragraphCount: number;
  readingTime: number; // minutes
  typingSpeed?: number; // words per minute
}

export interface CollaborationState {
  enabled: boolean;
  users: CollaborativeUser[];
  cursors: Record<string, CursorPosition>;
  selections: Record<string, TextSelection>;
  operations: CollaborativeOperation[];
}

export interface CollaborativeUser {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  isActive: boolean;
  lastSeen: Date;
}

export interface CollaborativeOperation {
  id: string;
  userId: string;
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
  timestamp: Date;
}