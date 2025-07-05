// 主题配置常量

// 颜色调色板
export const COLOR_PALETTE = {
  // 主色调
  PRIMARY: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },
  
  // 辅助色
  SECONDARY: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  
  // 成功色
  SUCCESS: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },
  
  // 警告色
  WARNING: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },
  
  // 错误色
  ERROR: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },
  
  // 信息色
  INFO: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },
  
  // 中性色
  NEUTRAL: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
} as const;

// 浅色主题
export const LIGHT_THEME = {
  name: 'light',
  displayName: '浅色主题',
  
  colors: {
    // 主要颜色
    primary: COLOR_PALETTE.PRIMARY[600],
    primaryHover: COLOR_PALETTE.PRIMARY[700],
    primaryActive: COLOR_PALETTE.PRIMARY[800],
    primaryLight: COLOR_PALETTE.PRIMARY[100],
    
    // 辅助颜色
    secondary: COLOR_PALETTE.SECONDARY[600],
    secondaryHover: COLOR_PALETTE.SECONDARY[700],
    secondaryActive: COLOR_PALETTE.SECONDARY[800],
    secondaryLight: COLOR_PALETTE.SECONDARY[100],
    
    // 状态颜色
    success: COLOR_PALETTE.SUCCESS[600],
    successLight: COLOR_PALETTE.SUCCESS[100],
    warning: COLOR_PALETTE.WARNING[600],
    warningLight: COLOR_PALETTE.WARNING[100],
    error: COLOR_PALETTE.ERROR[600],
    errorLight: COLOR_PALETTE.ERROR[100],
    info: COLOR_PALETTE.INFO[600],
    infoLight: COLOR_PALETTE.INFO[100],
    
    // 背景颜色
    background: '#ffffff',
    backgroundSecondary: COLOR_PALETTE.NEUTRAL[50],
    backgroundTertiary: COLOR_PALETTE.NEUTRAL[100],
    
    // 表面颜色
    surface: '#ffffff',
    surfaceHover: COLOR_PALETTE.NEUTRAL[50],
    surfaceActive: COLOR_PALETTE.NEUTRAL[100],
    
    // 文本颜色
    textPrimary: COLOR_PALETTE.NEUTRAL[900],
    textSecondary: COLOR_PALETTE.NEUTRAL[600],
    textTertiary: COLOR_PALETTE.NEUTRAL[500],
    textDisabled: COLOR_PALETTE.NEUTRAL[400],
    textInverse: '#ffffff',
    
    // 边框颜色
    border: COLOR_PALETTE.NEUTRAL[200],
    borderHover: COLOR_PALETTE.NEUTRAL[300],
    borderActive: COLOR_PALETTE.NEUTRAL[400],
    
    // 分割线颜色
    divider: COLOR_PALETTE.NEUTRAL[200],
    
    // 阴影颜色
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowHover: 'rgba(0, 0, 0, 0.15)',
    
    // 覆盖层颜色
    overlay: 'rgba(0, 0, 0, 0.5)',
    
    // 编辑器颜色
    editorBackground: '#ffffff',
    editorText: COLOR_PALETTE.NEUTRAL[900],
    editorSelection: COLOR_PALETTE.PRIMARY[100],
    editorLineNumber: COLOR_PALETTE.NEUTRAL[400],
    editorGutter: COLOR_PALETTE.NEUTRAL[50],
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
} as const;

// 深色主题
export const DARK_THEME = {
  name: 'dark',
  displayName: '深色主题',
  
  colors: {
    // 主要颜色
    primary: COLOR_PALETTE.PRIMARY[500],
    primaryHover: COLOR_PALETTE.PRIMARY[400],
    primaryActive: COLOR_PALETTE.PRIMARY[300],
    primaryLight: COLOR_PALETTE.PRIMARY[900],
    
    // 辅助颜色
    secondary: COLOR_PALETTE.SECONDARY[400],
    secondaryHover: COLOR_PALETTE.SECONDARY[300],
    secondaryActive: COLOR_PALETTE.SECONDARY[200],
    secondaryLight: COLOR_PALETTE.SECONDARY[800],
    
    // 状态颜色
    success: COLOR_PALETTE.SUCCESS[500],
    successLight: COLOR_PALETTE.SUCCESS[900],
    warning: COLOR_PALETTE.WARNING[500],
    warningLight: COLOR_PALETTE.WARNING[900],
    error: COLOR_PALETTE.ERROR[500],
    errorLight: COLOR_PALETTE.ERROR[900],
    info: COLOR_PALETTE.INFO[500],
    infoLight: COLOR_PALETTE.INFO[900],
    
    // 背景颜色
    background: COLOR_PALETTE.NEUTRAL[900],
    backgroundSecondary: COLOR_PALETTE.NEUTRAL[800],
    backgroundTertiary: COLOR_PALETTE.NEUTRAL[700],
    
    // 表面颜色
    surface: COLOR_PALETTE.NEUTRAL[800],
    surfaceHover: COLOR_PALETTE.NEUTRAL[700],
    surfaceActive: COLOR_PALETTE.NEUTRAL[600],
    
    // 文本颜色
    textPrimary: COLOR_PALETTE.NEUTRAL[100],
    textSecondary: COLOR_PALETTE.NEUTRAL[300],
    textTertiary: COLOR_PALETTE.NEUTRAL[400],
    textDisabled: COLOR_PALETTE.NEUTRAL[500],
    textInverse: COLOR_PALETTE.NEUTRAL[900],
    
    // 边框颜色
    border: COLOR_PALETTE.NEUTRAL[700],
    borderHover: COLOR_PALETTE.NEUTRAL[600],
    borderActive: COLOR_PALETTE.NEUTRAL[500],
    
    // 分割线颜色
    divider: COLOR_PALETTE.NEUTRAL[700],
    
    // 阴影颜色
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowHover: 'rgba(0, 0, 0, 0.4)',
    
    // 覆盖层颜色
    overlay: 'rgba(0, 0, 0, 0.7)',
    
    // 编辑器颜色
    editorBackground: COLOR_PALETTE.NEUTRAL[900],
    editorText: COLOR_PALETTE.NEUTRAL[100],
    editorSelection: COLOR_PALETTE.PRIMARY[800],
    editorLineNumber: COLOR_PALETTE.NEUTRAL[500],
    editorGutter: COLOR_PALETTE.NEUTRAL[800],
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  },
} as const;

// 字体配置
export const TYPOGRAPHY = {
  // 字体族
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
    chinese: ['PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'WenQuanYi Micro Hei', 'sans-serif'],
  },
  
  // 字体大小
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
    '7xl': '4.5rem',  // 72px
    '8xl': '6rem',    // 96px
    '9xl': '8rem',    // 128px
  },
  
  // 字体粗细
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  
  // 行高
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
  
  // 字母间距
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// 间距配置
export const SPACING = {
  0: '0px',
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
} as const;

// 圆角配置
export const BORDER_RADIUS = {
  none: '0px',
  sm: '0.125rem',   // 2px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

// 动画配置
export const ANIMATIONS = {
  // 过渡时间
  duration: {
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms',
  },
  
  // 缓动函数
  timingFunction: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  // 关键帧动画
  keyframes: {
    spin: {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
    ping: {
      '75%, 100%': {
        transform: 'scale(2)',
        opacity: '0',
      },
    },
    pulse: {
      '0%, 100%': {
        opacity: '1',
      },
      '50%': {
        opacity: '.5',
      },
    },
    bounce: {
      '0%, 100%': {
        transform: 'translateY(-25%)',
        animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
      },
      '50%': {
        transform: 'translateY(0)',
        animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
      },
    },
    fadeIn: {
      from: { opacity: '0' },
      to: { opacity: '1' },
    },
    fadeOut: {
      from: { opacity: '1' },
      to: { opacity: '0' },
    },
    slideInUp: {
      from: {
        transform: 'translateY(100%)',
        opacity: '0',
      },
      to: {
        transform: 'translateY(0)',
        opacity: '1',
      },
    },
    slideInDown: {
      from: {
        transform: 'translateY(-100%)',
        opacity: '0',
      },
      to: {
        transform: 'translateY(0)',
        opacity: '1',
      },
    },
    slideInLeft: {
      from: {
        transform: 'translateX(-100%)',
        opacity: '0',
      },
      to: {
        transform: 'translateX(0)',
        opacity: '1',
      },
    },
    slideInRight: {
      from: {
        transform: 'translateX(100%)',
        opacity: '0',
      },
      to: {
        transform: 'translateX(0)',
        opacity: '1',
      },
    },
    zoomIn: {
      from: {
        transform: 'scale(0.9)',
        opacity: '0',
      },
      to: {
        transform: 'scale(1)',
        opacity: '1',
      },
    },
    zoomOut: {
      from: {
        transform: 'scale(1)',
        opacity: '1',
      },
      to: {
        transform: 'scale(0.9)',
        opacity: '0',
      },
    },
  },
} as const;

// 断点配置
export const BREAKPOINTS = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Z-index 配置
export const Z_INDEX = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// 主题配置
export const THEME_CONFIG = {
  light: LIGHT_THEME,
  dark: DARK_THEME,
} as const;

// 默认主题
export const DEFAULT_THEME = 'light';

// 主题切换动画持续时间
export const THEME_TRANSITION_DURATION = 300;