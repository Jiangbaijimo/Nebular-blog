// 主题相关类型定义

export interface ThemeConfig {
  name: string;
  displayName: string;
  description?: string;
  version: string;
  author?: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  shadows: ThemeShadows;
  animations: ThemeAnimations;
  components?: ComponentThemes;
  customProperties?: Record<string, string>;
}

export interface ThemeColors {
  // 基础颜色
  primary: ColorPalette;
  secondary: ColorPalette;
  accent: ColorPalette;
  neutral: ColorPalette;
  
  // 语义颜色
  success: ColorPalette;
  warning: ColorPalette;
  error: ColorPalette;
  info: ColorPalette;
  
  // 背景颜色
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    overlay: string;
  };
  
  // 文本颜色
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
    disabled: string;
  };
  
  // 边框颜色
  border: {
    primary: string;
    secondary: string;
    focus: string;
    error: string;
  };
}

export interface ColorPalette {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface ThemeTypography {
  fontFamily: {
    sans: string[];
    serif: string[];
    mono: string[];
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
  };
  fontWeight: {
    thin: number;
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
    extrabold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
    loose: number;
  };
  letterSpacing: {
    tight: string;
    normal: string;
    wide: string;
  };
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
  '6xl': string;
}

export interface ThemeShadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
  none: string;
}

export interface ThemeAnimations {
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  easing: {
    linear: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
  };
  keyframes: Record<string, Record<string, any>>;
}

export interface ComponentThemes {
  button?: ButtonTheme;
  input?: InputTheme;
  modal?: ModalTheme;
  card?: CardTheme;
  editor?: EditorTheme;
}

export interface ButtonTheme {
  variants: {
    primary: ComponentVariant;
    secondary: ComponentVariant;
    outline: ComponentVariant;
    ghost: ComponentVariant;
    link: ComponentVariant;
  };
  sizes: {
    sm: ComponentSize;
    md: ComponentSize;
    lg: ComponentSize;
  };
}

export interface InputTheme {
  variants: {
    default: ComponentVariant;
    filled: ComponentVariant;
    outline: ComponentVariant;
  };
  states: {
    default: ComponentState;
    focus: ComponentState;
    error: ComponentState;
    disabled: ComponentState;
  };
}

export interface ModalTheme {
  overlay: {
    background: string;
    backdropFilter: string;
  };
  content: {
    background: string;
    borderRadius: string;
    shadow: string;
  };
}

export interface CardTheme {
  background: string;
  border: string;
  borderRadius: string;
  shadow: string;
  hover: {
    shadow: string;
    transform: string;
  };
}

export interface EditorTheme {
  background: string;
  foreground: string;
  selection: string;
  lineHighlight: string;
  cursor: string;
  syntax: {
    keyword: string;
    string: string;
    comment: string;
    number: string;
    operator: string;
    function: string;
    variable: string;
  };
}

export interface ComponentVariant {
  background: string;
  color: string;
  border?: string;
  hover?: {
    background: string;
    color: string;
    border?: string;
  };
  active?: {
    background: string;
    color: string;
    border?: string;
  };
}

export interface ComponentSize {
  padding: string;
  fontSize: string;
  height: string;
  borderRadius: string;
}

export interface ComponentState {
  background?: string;
  color?: string;
  border?: string;
  shadow?: string;
}

export interface ThemeMode {
  name: 'light' | 'dark' | 'auto';
  displayName: string;
  icon: string;
}

export interface ThemePreferences {
  mode: ThemeMode['name'];
  currentTheme: string;
  customThemes: string[];
  autoSwitchTime?: {
    lightModeStart: string; // HH:mm format
    darkModeStart: string; // HH:mm format
  };
  followSystemTheme: boolean;
  enableAnimations: boolean;
  reducedMotion: boolean;
}

export interface ThemeCustomization {
  id: string;
  name: string;
  baseTheme: string;
  modifications: Partial<ThemeConfig>;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface ThemeProvider {
  themes: Record<string, ThemeConfig>;
  currentTheme: string;
  mode: ThemeMode['name'];
  preferences: ThemePreferences;
  customizations: ThemeCustomization[];
}

export interface ThemeEvent {
  type: ThemeEventType;
  theme?: string;
  mode?: ThemeMode['name'];
  timestamp: Date;
}

export enum ThemeEventType {
  THEME_CHANGED = 'theme-changed',
  MODE_CHANGED = 'mode-changed',
  CUSTOMIZATION_APPLIED = 'customization-applied',
  PREFERENCES_UPDATED = 'preferences-updated'
}

export interface ThemeExport {
  version: string;
  theme: ThemeConfig;
  metadata: {
    exportedAt: Date;
    exportedBy: string;
    description?: string;
  };
}

export interface ThemeImport {
  file: File;
  theme: ThemeConfig;
  conflicts?: string[];
  overwrite: boolean;
}