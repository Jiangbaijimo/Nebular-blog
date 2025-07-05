import { ESLint } from 'eslint';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// 代码质量配置接口
interface CodeQualityConfig {
  eslintConfig?: ESLint.Options;
  filePatterns?: string[];
  excludePatterns?: string[];
  thresholds?: {
    complexity?: number;
    maintainability?: number;
    coverage?: number;
    duplicates?: number;
  };
  outputFormat?: 'json' | 'html' | 'text';
  outputPath?: string;
}

// 代码质量指标接口
interface QualityMetrics {
  complexity: {
    cyclomatic: number;
    cognitive: number;
    halstead: {
      difficulty: number;
      effort: number;
      volume: number;
    };
  };
  maintainability: {
    index: number;
    rating: 'A' | 'B' | 'C' | 'D' | 'F';
  };
  duplicates: {
    percentage: number;
    lines: number;
    blocks: Array<{
      file: string;
      startLine: number;
      endLine: number;
      duplicateFile: string;
      duplicateStartLine: number;
    }>;
  };
  coverage: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  linting: {
    errors: number;
    warnings: number;
    issues: Array<{
      file: string;
      line: number;
      column: number;
      rule: string;
      severity: 'error' | 'warning';
      message: string;
    }>;
  };
  dependencies: {
    outdated: Array<{
      name: string;
      current: string;
      wanted: string;
      latest: string;
    }>;
    vulnerabilities: Array<{
      name: string;
      severity: 'low' | 'moderate' | 'high' | 'critical';
      description: string;
    }>;
    unused: string[];
  };
  performance: {
    bundleSize: number;
    chunkSizes: Array<{
      name: string;
      size: number;
    }>;
    loadTime: number;
  };
}

// 代码质量报告接口
interface QualityReport {
  timestamp: string;
  projectPath: string;
  metrics: QualityMetrics;
  score: {
    overall: number;
    complexity: number;
    maintainability: number;
    coverage: number;
    linting: number;
  };
  recommendations: Array<{
    type: 'error' | 'warning' | 'info';
    category: string;
    message: string;
    file?: string;
    line?: number;
    suggestion?: string;
  }>;
  trends: {
    previousScore?: number;
    improvement: number;
    regression: number;
  };
}

// 代码质量分析器
export class CodeQualityAnalyzer {
  private config: CodeQualityConfig;
  private eslint: ESLint;
  
  constructor(config: CodeQualityConfig = {}) {
    this.config = {
      filePatterns: ['src/**/*.{ts,tsx,js,jsx}'],
      excludePatterns: ['node_modules/**', 'dist/**', 'build/**'],
      thresholds: {
        complexity: 10,
        maintainability: 70,
        coverage: 80,
        duplicates: 5,
      },
      outputFormat: 'json',
      ...config,
    };
    
    this.eslint = new ESLint({
      baseConfig: {
        extends: [
          '@typescript-eslint/recommended',
          'plugin:react/recommended',
          'plugin:react-hooks/recommended',
          'plugin:jsx-a11y/recommended',
        ],
        parser: '@typescript-eslint/parser',
        parserOptions: {
          ecmaVersion: 2022,
          sourceType: 'module',
          ecmaFeatures: {
            jsx: true,
          },
        },
        plugins: [
          '@typescript-eslint',
          'react',
          'react-hooks',
          'jsx-a11y',
          'import',
        ],
        rules: {
          // TypeScript 规则
          '@typescript-eslint/no-unused-vars': 'error',
          '@typescript-eslint/no-explicit-any': 'warn',
          '@typescript-eslint/explicit-function-return-type': 'off',
          '@typescript-eslint/explicit-module-boundary-types': 'off',
          '@typescript-eslint/no-non-null-assertion': 'warn',
          
          // React 规则
          'react/react-in-jsx-scope': 'off',
          'react/prop-types': 'off',
          'react/display-name': 'off',
          'react-hooks/rules-of-hooks': 'error',
          'react-hooks/exhaustive-deps': 'warn',
          
          // 可访问性规则
          'jsx-a11y/anchor-is-valid': 'warn',
          'jsx-a11y/click-events-have-key-events': 'warn',
          'jsx-a11y/no-static-element-interactions': 'warn',
          
          // 导入规则
          'import/order': [
            'error',
            {
              groups: [
                'builtin',
                'external',
                'internal',
                'parent',
                'sibling',
                'index',
              ],
              'newlines-between': 'always',
            },
          ],
          'import/no-unused-modules': 'warn',
          'import/no-cycle': 'error',
          
          // 通用规则
          'no-console': 'warn',
          'no-debugger': 'error',
          'no-alert': 'error',
          'prefer-const': 'error',
          'no-var': 'error',
          'eqeqeq': 'error',
          'curly': 'error',
        },
        settings: {
          react: {
            version: 'detect',
          },
        },
      },
      ...this.config.eslintConfig,
    });
  }
  
  // 分析代码质量
  async analyze(projectPath: string): Promise<QualityReport> {
    const files = await this.getSourceFiles(projectPath);
    
    const [lintingResults, complexityResults, duplicateResults, coverageResults] = await Promise.all([
      this.analyzeLinting(files),
      this.analyzeComplexity(files),
      this.analyzeDuplicates(files),
      this.analyzeCoverage(projectPath),
    ]);
    
    const dependencyResults = await this.analyzeDependencies(projectPath);
    const performanceResults = await this.analyzePerformance(projectPath);
    
    const metrics: QualityMetrics = {
      complexity: complexityResults,
      maintainability: this.calculateMaintainability(complexityResults, lintingResults),
      duplicates: duplicateResults,
      coverage: coverageResults,
      linting: lintingResults,
      dependencies: dependencyResults,
      performance: performanceResults,
    };
    
    const score = this.calculateScore(metrics);
    const recommendations = this.generateRecommendations(metrics);
    const trends = await this.calculateTrends(projectPath, score.overall);
    
    const report: QualityReport = {
      timestamp: new Date().toISOString(),
      projectPath,
      metrics,
      score,
      recommendations,
      trends,
    };
    
    await this.saveReport(report);
    
    return report;
  }
  
  // 获取源文件列表
  private async getSourceFiles(projectPath: string): Promise<string[]> {
    const patterns = this.config.filePatterns!.map(pattern => 
      path.join(projectPath, pattern)
    );
    
    const files: string[] = [];
    
    for (const pattern of patterns) {
      const matchedFiles = await glob(pattern, {
        ignore: this.config.excludePatterns,
      });
      files.push(...matchedFiles);
    }
    
    return [...new Set(files)];
  }
  
  // 分析 ESLint 问题
  private async analyzeLinting(files: string[]): Promise<QualityMetrics['linting']> {
    const results = await this.eslint.lintFiles(files);
    
    let errors = 0;
    let warnings = 0;
    const issues: QualityMetrics['linting']['issues'] = [];
    
    for (const result of results) {
      for (const message of result.messages) {
        if (message.severity === 2) {
          errors++;
        } else {
          warnings++;
        }
        
        issues.push({
          file: result.filePath,
          line: message.line,
          column: message.column,
          rule: message.ruleId || 'unknown',
          severity: message.severity === 2 ? 'error' : 'warning',
          message: message.message,
        });
      }
    }
    
    return { errors, warnings, issues };
  }
  
  // 分析代码复杂度
  private async analyzeComplexity(files: string[]): Promise<QualityMetrics['complexity']> {
    let totalCyclomatic = 0;
    let totalCognitive = 0;
    let totalHalsteadDifficulty = 0;
    let totalHalsteadEffort = 0;
    let totalHalsteadVolume = 0;
    let fileCount = 0;
    
    for (const file of files) {
      try {
        const content = await fs.promises.readFile(file, 'utf-8');
        const complexity = this.calculateFileComplexity(content);
        
        totalCyclomatic += complexity.cyclomatic;
        totalCognitive += complexity.cognitive;
        totalHalsteadDifficulty += complexity.halstead.difficulty;
        totalHalsteadEffort += complexity.halstead.effort;
        totalHalsteadVolume += complexity.halstead.volume;
        fileCount++;
      } catch (error) {
        console.warn(`Failed to analyze complexity for ${file}:`, error);
      }
    }
    
    return {
      cyclomatic: fileCount > 0 ? totalCyclomatic / fileCount : 0,
      cognitive: fileCount > 0 ? totalCognitive / fileCount : 0,
      halstead: {
        difficulty: fileCount > 0 ? totalHalsteadDifficulty / fileCount : 0,
        effort: fileCount > 0 ? totalHalsteadEffort / fileCount : 0,
        volume: fileCount > 0 ? totalHalsteadVolume / fileCount : 0,
      },
    };
  }
  
  // 计算单个文件的复杂度
  private calculateFileComplexity(content: string): {
    cyclomatic: number;
    cognitive: number;
    halstead: {
      difficulty: number;
      effort: number;
      volume: number;
    };
  } {
    // 简化的复杂度计算
    // 实际项目中应该使用专门的复杂度分析库，如 typhonjs-escomplex
    
    const cyclomaticKeywords = [
      'if', 'else', 'while', 'for', 'switch', 'case', 'catch', 'try',
      '&&', '||', '?', ':', 'break', 'continue', 'return'
    ];
    
    let cyclomatic = 1; // 基础复杂度
    let cognitive = 0;
    
    for (const keyword of cyclomaticKeywords) {
      const matches = content.match(new RegExp(`\\b${keyword}\\b`, 'g'));
      if (matches) {
        cyclomatic += matches.length;
        cognitive += matches.length;
      }
    }
    
    // 简化的 Halstead 指标计算
    const operators = content.match(/[+\-*/=<>!&|?:;,(){}\[\]]/g) || [];
    const operands = content.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g) || [];
    
    const uniqueOperators = new Set(operators).size;
    const uniqueOperands = new Set(operands).size;
    const totalOperators = operators.length;
    const totalOperands = operands.length;
    
    const vocabulary = uniqueOperators + uniqueOperands;
    const length = totalOperators + totalOperands;
    const volume = length * Math.log2(vocabulary || 1);
    const difficulty = (uniqueOperators / 2) * (totalOperands / (uniqueOperands || 1));
    const effort = difficulty * volume;
    
    return {
      cyclomatic,
      cognitive,
      halstead: {
        difficulty: isFinite(difficulty) ? difficulty : 0,
        effort: isFinite(effort) ? effort : 0,
        volume: isFinite(volume) ? volume : 0,
      },
    };
  }
  
  // 分析代码重复
  private async analyzeDuplicates(files: string[]): Promise<QualityMetrics['duplicates']> {
    // 简化的重复代码检测
    // 实际项目中应该使用专门的重复代码检测工具，如 jscpd
    
    const duplicateBlocks: QualityMetrics['duplicates']['blocks'] = [];
    let totalLines = 0;
    let duplicateLines = 0;
    
    const fileContents = new Map<string, string[]>();
    
    // 读取所有文件内容
    for (const file of files) {
      try {
        const content = await fs.promises.readFile(file, 'utf-8');
        const lines = content.split('\n');
        fileContents.set(file, lines);
        totalLines += lines.length;
      } catch (error) {
        console.warn(`Failed to read file ${file}:`, error);
      }
    }
    
    // 简单的重复检测（检测连续的相同行）
    const minBlockSize = 5;
    const processedFiles = Array.from(fileContents.keys());
    
    for (let i = 0; i < processedFiles.length; i++) {
      for (let j = i + 1; j < processedFiles.length; j++) {
        const file1 = processedFiles[i];
        const file2 = processedFiles[j];
        const lines1 = fileContents.get(file1)!;
        const lines2 = fileContents.get(file2)!;
        
        const duplicates = this.findDuplicateBlocks(lines1, lines2, minBlockSize);
        
        for (const duplicate of duplicates) {
          duplicateBlocks.push({
            file: file1,
            startLine: duplicate.start1,
            endLine: duplicate.end1,
            duplicateFile: file2,
            duplicateStartLine: duplicate.start2,
          });
          
          duplicateLines += duplicate.end1 - duplicate.start1 + 1;
        }
      }
    }
    
    const percentage = totalLines > 0 ? (duplicateLines / totalLines) * 100 : 0;
    
    return {
      percentage,
      lines: duplicateLines,
      blocks: duplicateBlocks,
    };
  }
  
  // 查找重复代码块
  private findDuplicateBlocks(
    lines1: string[],
    lines2: string[],
    minSize: number
  ): Array<{
    start1: number;
    end1: number;
    start2: number;
    end2: number;
  }> {
    const duplicates: Array<{
      start1: number;
      end1: number;
      start2: number;
      end2: number;
    }> = [];
    
    for (let i = 0; i <= lines1.length - minSize; i++) {
      for (let j = 0; j <= lines2.length - minSize; j++) {
        let matchLength = 0;
        
        while (
          i + matchLength < lines1.length &&
          j + matchLength < lines2.length &&
          lines1[i + matchLength].trim() === lines2[j + matchLength].trim() &&
          lines1[i + matchLength].trim() !== ''
        ) {
          matchLength++;
        }
        
        if (matchLength >= minSize) {
          duplicates.push({
            start1: i,
            end1: i + matchLength - 1,
            start2: j,
            end2: j + matchLength - 1,
          });
        }
      }
    }
    
    return duplicates;
  }
  
  // 分析测试覆盖率
  private async analyzeCoverage(projectPath: string): Promise<QualityMetrics['coverage']> {
    try {
      // 尝试读取 Jest 覆盖率报告
      const coveragePath = path.join(projectPath, 'coverage', 'coverage-summary.json');
      
      if (fs.existsSync(coveragePath)) {
        const coverageData = JSON.parse(await fs.promises.readFile(coveragePath, 'utf-8'));
        const total = coverageData.total;
        
        return {
          statements: total.statements.pct,
          branches: total.branches.pct,
          functions: total.functions.pct,
          lines: total.lines.pct,
        };
      }
    } catch (error) {
      console.warn('Failed to read coverage report:', error);
    }
    
    return {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0,
    };
  }
  
  // 分析依赖项
  private async analyzeDependencies(projectPath: string): Promise<QualityMetrics['dependencies']> {
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      return {
        outdated: [],
        vulnerabilities: [],
        unused: [],
      };
    }
    
    try {
      const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf-8'));
      
      // 这里应该调用 npm audit 和 npm outdated
      // 简化实现
      return {
        outdated: [],
        vulnerabilities: [],
        unused: [],
      };
    } catch (error) {
      console.warn('Failed to analyze dependencies:', error);
      return {
        outdated: [],
        vulnerabilities: [],
        unused: [],
      };
    }
  }
  
  // 分析性能指标
  private async analyzePerformance(projectPath: string): Promise<QualityMetrics['performance']> {
    // 这里应该分析构建产物的大小
    // 简化实现
    return {
      bundleSize: 0,
      chunkSizes: [],
      loadTime: 0,
    };
  }
  
  // 计算可维护性指数
  private calculateMaintainability(
    complexity: QualityMetrics['complexity'],
    linting: QualityMetrics['linting']
  ): QualityMetrics['maintainability'] {
    // 简化的可维护性指数计算
    const complexityScore = Math.max(0, 100 - complexity.cyclomatic * 2);
    const lintingScore = Math.max(0, 100 - (linting.errors * 10 + linting.warnings * 2));
    
    const index = (complexityScore + lintingScore) / 2;
    
    let rating: 'A' | 'B' | 'C' | 'D' | 'F';
    if (index >= 85) rating = 'A';
    else if (index >= 70) rating = 'B';
    else if (index >= 55) rating = 'C';
    else if (index >= 40) rating = 'D';
    else rating = 'F';
    
    return { index, rating };
  }
  
  // 计算总体评分
  private calculateScore(metrics: QualityMetrics): QualityReport['score'] {
    const complexityScore = Math.max(0, 100 - metrics.complexity.cyclomatic * 5);
    const maintainabilityScore = metrics.maintainability.index;
    const coverageScore = (metrics.coverage.statements + metrics.coverage.branches + 
                          metrics.coverage.functions + metrics.coverage.lines) / 4;
    const lintingScore = Math.max(0, 100 - (metrics.linting.errors * 10 + metrics.linting.warnings * 2));
    
    const overall = (complexityScore + maintainabilityScore + coverageScore + lintingScore) / 4;
    
    return {
      overall,
      complexity: complexityScore,
      maintainability: maintainabilityScore,
      coverage: coverageScore,
      linting: lintingScore,
    };
  }
  
  // 生成改进建议
  private generateRecommendations(metrics: QualityMetrics): QualityReport['recommendations'] {
    const recommendations: QualityReport['recommendations'] = [];
    
    // 复杂度建议
    if (metrics.complexity.cyclomatic > this.config.thresholds!.complexity!) {
      recommendations.push({
        type: 'warning',
        category: 'complexity',
        message: `平均圈复杂度 ${metrics.complexity.cyclomatic.toFixed(2)} 超过阈值 ${this.config.thresholds!.complexity}`,
        suggestion: '考虑重构复杂的函数，将其拆分为更小的函数',
      });
    }
    
    // 可维护性建议
    if (metrics.maintainability.index < this.config.thresholds!.maintainability!) {
      recommendations.push({
        type: 'warning',
        category: 'maintainability',
        message: `可维护性指数 ${metrics.maintainability.index.toFixed(2)} 低于阈值 ${this.config.thresholds!.maintainability}`,
        suggestion: '减少代码复杂度，修复 ESLint 问题，增加注释',
      });
    }
    
    // 覆盖率建议
    if (metrics.coverage.lines < this.config.thresholds!.coverage!) {
      recommendations.push({
        type: 'warning',
        category: 'coverage',
        message: `测试覆盖率 ${metrics.coverage.lines.toFixed(2)}% 低于阈值 ${this.config.thresholds!.coverage}%`,
        suggestion: '增加单元测试和集成测试',
      });
    }
    
    // 重复代码建议
    if (metrics.duplicates.percentage > this.config.thresholds!.duplicates!) {
      recommendations.push({
        type: 'warning',
        category: 'duplicates',
        message: `代码重复率 ${metrics.duplicates.percentage.toFixed(2)}% 超过阈值 ${this.config.thresholds!.duplicates}%`,
        suggestion: '提取公共函数和组件，减少代码重复',
      });
    }
    
    // ESLint 错误建议
    if (metrics.linting.errors > 0) {
      recommendations.push({
        type: 'error',
        category: 'linting',
        message: `发现 ${metrics.linting.errors} 个 ESLint 错误`,
        suggestion: '修复所有 ESLint 错误',
      });
    }
    
    // ESLint 警告建议
    if (metrics.linting.warnings > 10) {
      recommendations.push({
        type: 'warning',
        category: 'linting',
        message: `发现 ${metrics.linting.warnings} 个 ESLint 警告`,
        suggestion: '逐步修复 ESLint 警告',
      });
    }
    
    // 依赖项建议
    if (metrics.dependencies.vulnerabilities.length > 0) {
      const criticalVulns = metrics.dependencies.vulnerabilities.filter(v => v.severity === 'critical').length;
      const highVulns = metrics.dependencies.vulnerabilities.filter(v => v.severity === 'high').length;
      
      if (criticalVulns > 0) {
        recommendations.push({
          type: 'error',
          category: 'security',
          message: `发现 ${criticalVulns} 个严重安全漏洞`,
          suggestion: '立即更新存在严重漏洞的依赖项',
        });
      }
      
      if (highVulns > 0) {
        recommendations.push({
          type: 'warning',
          category: 'security',
          message: `发现 ${highVulns} 个高危安全漏洞`,
          suggestion: '尽快更新存在高危漏洞的依赖项',
        });
      }
    }
    
    if (metrics.dependencies.outdated.length > 0) {
      recommendations.push({
        type: 'info',
        category: 'dependencies',
        message: `发现 ${metrics.dependencies.outdated.length} 个过时的依赖项`,
        suggestion: '定期更新依赖项以获得最新功能和安全修复',
      });
    }
    
    return recommendations;
  }
  
  // 计算趋势
  private async calculateTrends(
    projectPath: string,
    currentScore: number
  ): Promise<QualityReport['trends']> {
    try {
      const historyPath = path.join(projectPath, '.quality-history.json');
      
      if (fs.existsSync(historyPath)) {
        const history = JSON.parse(await fs.promises.readFile(historyPath, 'utf-8'));
        const previousScore = history.scores[history.scores.length - 1];
        
        const improvement = Math.max(0, currentScore - previousScore);
        const regression = Math.max(0, previousScore - currentScore);
        
        // 更新历史记录
        history.scores.push(currentScore);
        if (history.scores.length > 50) {
          history.scores = history.scores.slice(-50); // 保留最近 50 次记录
        }
        
        await fs.promises.writeFile(historyPath, JSON.stringify(history, null, 2));
        
        return {
          previousScore,
          improvement,
          regression,
        };
      } else {
        // 创建新的历史记录
        const history = {
          scores: [currentScore],
        };
        
        await fs.promises.writeFile(historyPath, JSON.stringify(history, null, 2));
        
        return {
          improvement: 0,
          regression: 0,
        };
      }
    } catch (error) {
      console.warn('Failed to calculate trends:', error);
      return {
        improvement: 0,
        regression: 0,
      };
    }
  }
  
  // 保存报告
  private async saveReport(report: QualityReport): Promise<void> {
    if (!this.config.outputPath) {
      return;
    }
    
    const outputDir = path.dirname(this.config.outputPath);
    if (!fs.existsSync(outputDir)) {
      await fs.promises.mkdir(outputDir, { recursive: true });
    }
    
    switch (this.config.outputFormat) {
      case 'json':
        await fs.promises.writeFile(
          this.config.outputPath,
          JSON.stringify(report, null, 2)
        );
        break;
        
      case 'html':
        const htmlReport = this.generateHtmlReport(report);
        await fs.promises.writeFile(this.config.outputPath, htmlReport);
        break;
        
      case 'text':
        const textReport = this.generateTextReport(report);
        await fs.promises.writeFile(this.config.outputPath, textReport);
        break;
    }
  }
  
  // 生成 HTML 报告
  private generateHtmlReport(report: QualityReport): string {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>代码质量报告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .score { font-size: 2em; font-weight: bold; color: ${this.getScoreColor(report.score.overall)}; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px; }
        .metric h3 { margin-top: 0; }
        .recommendations { margin: 20px 0; }
        .recommendation { padding: 10px; margin: 5px 0; border-radius: 4px; }
        .error { background: #ffebee; border-left: 4px solid #f44336; }
        .warning { background: #fff3e0; border-left: 4px solid #ff9800; }
        .info { background: #e3f2fd; border-left: 4px solid #2196f3; }
    </style>
</head>
<body>
    <div class="header">
        <h1>代码质量报告</h1>
        <p>生成时间: ${report.timestamp}</p>
        <p>项目路径: ${report.projectPath}</p>
        <div class="score">总体评分: ${report.score.overall.toFixed(1)}</div>
    </div>
    
    <div class="metrics">
        <div class="metric">
            <h3>复杂度</h3>
            <p>圈复杂度: ${report.metrics.complexity.cyclomatic.toFixed(2)}</p>
            <p>认知复杂度: ${report.metrics.complexity.cognitive.toFixed(2)}</p>
            <p>评分: ${report.score.complexity.toFixed(1)}</p>
        </div>
        
        <div class="metric">
            <h3>可维护性</h3>
            <p>可维护性指数: ${report.metrics.maintainability.index.toFixed(2)}</p>
            <p>等级: ${report.metrics.maintainability.rating}</p>
            <p>评分: ${report.score.maintainability.toFixed(1)}</p>
        </div>
        
        <div class="metric">
            <h3>测试覆盖率</h3>
            <p>语句覆盖率: ${report.metrics.coverage.statements.toFixed(1)}%</p>
            <p>分支覆盖率: ${report.metrics.coverage.branches.toFixed(1)}%</p>
            <p>函数覆盖率: ${report.metrics.coverage.functions.toFixed(1)}%</p>
            <p>行覆盖率: ${report.metrics.coverage.lines.toFixed(1)}%</p>
            <p>评分: ${report.score.coverage.toFixed(1)}</p>
        </div>
        
        <div class="metric">
            <h3>代码规范</h3>
            <p>错误: ${report.metrics.linting.errors}</p>
            <p>警告: ${report.metrics.linting.warnings}</p>
            <p>评分: ${report.score.linting.toFixed(1)}</p>
        </div>
        
        <div class="metric">
            <h3>代码重复</h3>
            <p>重复率: ${report.metrics.duplicates.percentage.toFixed(2)}%</p>
            <p>重复行数: ${report.metrics.duplicates.lines}</p>
            <p>重复块数: ${report.metrics.duplicates.blocks.length}</p>
        </div>
    </div>
    
    <div class="recommendations">
        <h2>改进建议</h2>
        ${report.recommendations.map(rec => `
            <div class="recommendation ${rec.type}">
                <strong>[${rec.category.toUpperCase()}]</strong> ${rec.message}
                ${rec.suggestion ? `<br><em>建议: ${rec.suggestion}</em>` : ''}
            </div>
        `).join('')}
    </div>
</body>
</html>
    `;
  }
  
  // 生成文本报告
  private generateTextReport(report: QualityReport): string {
    return `
代码质量报告
============

生成时间: ${report.timestamp}
项目路径: ${report.projectPath}
总体评分: ${report.score.overall.toFixed(1)}

评分详情:
- 复杂度: ${report.score.complexity.toFixed(1)}
- 可维护性: ${report.score.maintainability.toFixed(1)}
- 测试覆盖率: ${report.score.coverage.toFixed(1)}
- 代码规范: ${report.score.linting.toFixed(1)}

指标详情:
--------
复杂度:
  圈复杂度: ${report.metrics.complexity.cyclomatic.toFixed(2)}
  认知复杂度: ${report.metrics.complexity.cognitive.toFixed(2)}

可维护性:
  可维护性指数: ${report.metrics.maintainability.index.toFixed(2)}
  等级: ${report.metrics.maintainability.rating}

测试覆盖率:
  语句覆盖率: ${report.metrics.coverage.statements.toFixed(1)}%
  分支覆盖率: ${report.metrics.coverage.branches.toFixed(1)}%
  函数覆盖率: ${report.metrics.coverage.functions.toFixed(1)}%
  行覆盖率: ${report.metrics.coverage.lines.toFixed(1)}%

代码规范:
  错误: ${report.metrics.linting.errors}
  警告: ${report.metrics.linting.warnings}

代码重复:
  重复率: ${report.metrics.duplicates.percentage.toFixed(2)}%
  重复行数: ${report.metrics.duplicates.lines}
  重复块数: ${report.metrics.duplicates.blocks.length}

改进建议:
--------
${report.recommendations.map(rec => `[${rec.type.toUpperCase()}] [${rec.category.toUpperCase()}] ${rec.message}${rec.suggestion ? `\n  建议: ${rec.suggestion}` : ''}`).join('\n\n')}

趋势分析:
--------
${report.trends.previousScore ? `上次评分: ${report.trends.previousScore.toFixed(1)}` : '首次分析'}
${report.trends.improvement > 0 ? `改进: +${report.trends.improvement.toFixed(1)}` : ''}
${report.trends.regression > 0 ? `退步: -${report.trends.regression.toFixed(1)}` : ''}
    `;
  }
  
  // 获取评分颜色
  private getScoreColor(score: number): string {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  }
}

// 代码格式化工具
export class CodeFormatter {
  // 格式化代码
  static async formatCode(
    content: string,
    filePath: string,
    options: {
      parser?: 'typescript' | 'babel' | 'css' | 'html' | 'json' | 'markdown';
      printWidth?: number;
      tabWidth?: number;
      useTabs?: boolean;
      semi?: boolean;
      singleQuote?: boolean;
      quoteProps?: 'as-needed' | 'consistent' | 'preserve';
      trailingComma?: 'none' | 'es5' | 'all';
      bracketSpacing?: boolean;
      bracketSameLine?: boolean;
      arrowParens?: 'always' | 'avoid';
      endOfLine?: 'lf' | 'crlf' | 'cr' | 'auto';
    } = {}
  ): Promise<string> {
    // 这里应该使用 Prettier 进行格式化
    // 简化实现，直接返回原内容
    return content;
  }
  
  // 批量格式化文件
  static async formatFiles(
    patterns: string[],
    options?: any
  ): Promise<{
    formatted: string[];
    errors: Array<{ file: string; error: string }>;
  }> {
    const formatted: string[] = [];
    const errors: Array<{ file: string; error: string }> = [];
    
    for (const pattern of patterns) {
      try {
        const files = await glob(pattern);
        
        for (const file of files) {
          try {
            const content = await fs.promises.readFile(file, 'utf-8');
            const formattedContent = await this.formatCode(content, file, options);
            
            if (content !== formattedContent) {
              await fs.promises.writeFile(file, formattedContent);
              formatted.push(file);
            }
          } catch (error) {
            errors.push({
              file,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      } catch (error) {
        errors.push({
          file: pattern,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    
    return { formatted, errors };
  }
}

// 代码质量 CLI 工具
export class QualityCLI {
  static async run(args: string[]): Promise<void> {
    const command = args[0];
    
    switch (command) {
      case 'analyze':
        await this.runAnalysis(args.slice(1));
        break;
        
      case 'format':
        await this.runFormatting(args.slice(1));
        break;
        
      case 'lint':
        await this.runLinting(args.slice(1));
        break;
        
      default:
        console.log('Usage: quality <command> [options]');
        console.log('Commands:');
        console.log('  analyze  - 分析代码质量');
        console.log('  format   - 格式化代码');
        console.log('  lint     - 检查代码规范');
    }
  }
  
  private static async runAnalysis(args: string[]): Promise<void> {
    const projectPath = args[0] || process.cwd();
    const outputPath = args.find(arg => arg.startsWith('--output='))?.split('=')[1];
    const format = args.find(arg => arg.startsWith('--format='))?.split('=')[1] as 'json' | 'html' | 'text' || 'text';
    
    const analyzer = new CodeQualityAnalyzer({
      outputPath,
      outputFormat: format,
    });
    
    console.log('正在分析代码质量...');
    const report = await analyzer.analyze(projectPath);
    
    console.log(`\n代码质量分析完成！`);
    console.log(`总体评分: ${report.score.overall.toFixed(1)}`);
    console.log(`可维护性等级: ${report.metrics.maintainability.rating}`);
    
    if (report.recommendations.length > 0) {
      console.log('\n改进建议:');
      report.recommendations.forEach(rec => {
        console.log(`  [${rec.type.toUpperCase()}] ${rec.message}`);
      });
    }
    
    if (outputPath) {
      console.log(`\n详细报告已保存到: ${outputPath}`);
    }
  }
  
  private static async runFormatting(args: string[]): Promise<void> {
    const patterns = args.filter(arg => !arg.startsWith('--'));
    const defaultPatterns = ['src/**/*.{ts,tsx,js,jsx}'];
    
    console.log('正在格式化代码...');
    const result = await CodeFormatter.formatFiles(patterns.length > 0 ? patterns : defaultPatterns);
    
    console.log(`\n格式化完成！`);
    console.log(`已格式化文件: ${result.formatted.length}`);
    
    if (result.errors.length > 0) {
      console.log(`\n错误:`);
      result.errors.forEach(error => {
        console.log(`  ${error.file}: ${error.error}`);
      });
    }
  }
  
  private static async runLinting(args: string[]): Promise<void> {
    const projectPath = args[0] || process.cwd();
    
    const analyzer = new CodeQualityAnalyzer();
    const files = await analyzer['getSourceFiles'](projectPath);
    const lintingResults = await analyzer['analyzeLinting'](files);
    
    console.log(`\nESLint 检查完成！`);
    console.log(`错误: ${lintingResults.errors}`);
    console.log(`警告: ${lintingResults.warnings}`);
    
    if (lintingResults.issues.length > 0) {
      console.log('\n问题详情:');
      lintingResults.issues.forEach(issue => {
        console.log(`  ${issue.file}:${issue.line}:${issue.column} [${issue.severity}] ${issue.message} (${issue.rule})`);
      });
    }
  }
}

// 导出主要类和接口
export {
  CodeQualityConfig,
  QualityMetrics,
  QualityReport,
};