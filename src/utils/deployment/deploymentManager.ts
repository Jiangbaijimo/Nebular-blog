import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// 部署环境配置接口
interface DeploymentEnvironment {
  name: string;
  type: 'development' | 'staging' | 'production';
  url: string;
  branch: string;
  buildCommand: string;
  deployCommand: string;
  healthCheckUrl?: string;
  environmentVariables: Record<string, string>;
  secrets: Record<string, string>;
  notifications?: {
    slack?: {
      webhook: string;
      channel: string;
    };
    email?: {
      recipients: string[];
      smtp: {
        host: string;
        port: number;
        user: string;
        password: string;
      };
    };
  };
}

// 部署配置接口
interface DeploymentConfig {
  projectName: string;
  version: string;
  environments: DeploymentEnvironment[];
  docker?: {
    registry: string;
    repository: string;
    tag?: string;
  };
  cdn?: {
    provider: 'aws' | 'cloudflare' | 'azure';
    distributionId: string;
    bucketName: string;
  };
  monitoring?: {
    healthChecks: boolean;
    performanceTracking: boolean;
    errorTracking: boolean;
  };
  rollback?: {
    enabled: boolean;
    keepVersions: number;
  };
}

// 部署状态接口
interface DeploymentStatus {
  id: string;
  environment: string;
  status: 'pending' | 'building' | 'deploying' | 'success' | 'failed' | 'rolled-back';
  version: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  logs: string[];
  error?: string;
  rollbackVersion?: string;
  healthCheck?: {
    status: 'healthy' | 'unhealthy' | 'unknown';
    responseTime: number;
    checks: Array<{
      name: string;
      status: 'pass' | 'fail';
      message?: string;
    }>;
  };
}

// 部署历史记录接口
interface DeploymentHistory {
  deployments: DeploymentStatus[];
  rollbacks: Array<{
    id: string;
    fromVersion: string;
    toVersion: string;
    timestamp: Date;
    reason: string;
  }>;
}

// 部署管理器
export class DeploymentManager {
  private config: DeploymentConfig;
  private history: DeploymentHistory;
  private historyPath: string;
  
  constructor(config: DeploymentConfig, historyPath = '.deployment-history.json') {
    this.config = config;
    this.historyPath = historyPath;
    this.history = this.loadHistory();
  }
  
  // 部署到指定环境
  async deploy(
    environmentName: string,
    options: {
      version?: string;
      force?: boolean;
      skipTests?: boolean;
      skipHealthCheck?: boolean;
      dryRun?: boolean;
    } = {}
  ): Promise<DeploymentStatus> {
    const environment = this.config.environments.find(env => env.name === environmentName);
    if (!environment) {
      throw new Error(`Environment '${environmentName}' not found`);
    }
    
    const deploymentId = this.generateDeploymentId();
    const version = options.version || this.config.version;
    
    const deployment: DeploymentStatus = {
      id: deploymentId,
      environment: environmentName,
      status: 'pending',
      version,
      startTime: new Date(),
      logs: [],
    };
    
    this.history.deployments.push(deployment);
    
    try {
      this.log(deployment, `开始部署到 ${environmentName} 环境`);
      this.log(deployment, `版本: ${version}`);
      
      if (options.dryRun) {
        this.log(deployment, '这是一次试运行，不会执行实际部署');
        deployment.status = 'success';
        deployment.endTime = new Date();
        deployment.duration = deployment.endTime.getTime() - deployment.startTime.getTime();
        return deployment;
      }
      
      // 检查当前部署状态
      if (!options.force) {
        const currentDeployment = this.getCurrentDeployment(environmentName);
        if (currentDeployment && currentDeployment.status === 'deploying') {
          throw new Error(`Environment '${environmentName}' is currently being deployed`);
        }
      }
      
      // 设置环境变量
      await this.setEnvironmentVariables(environment);
      
      // 构建阶段
      deployment.status = 'building';
      await this.build(deployment, environment, options);
      
      // 部署阶段
      deployment.status = 'deploying';
      await this.deployToEnvironment(deployment, environment, options);
      
      // 健康检查
      if (!options.skipHealthCheck && environment.healthCheckUrl) {
        await this.performHealthCheck(deployment, environment);
      }
      
      // 通知
      await this.sendNotification(deployment, environment, 'success');
      
      deployment.status = 'success';
      deployment.endTime = new Date();
      deployment.duration = deployment.endTime.getTime() - deployment.startTime.getTime();
      
      this.log(deployment, `部署成功完成，耗时 ${deployment.duration}ms`);
      
    } catch (error) {
      deployment.status = 'failed';
      deployment.endTime = new Date();
      deployment.duration = deployment.endTime.getTime() - deployment.startTime.getTime();
      deployment.error = error instanceof Error ? error.message : String(error);
      
      this.log(deployment, `部署失败: ${deployment.error}`);
      
      // 发送失败通知
      await this.sendNotification(deployment, environment, 'failure');
      
      throw error;
    } finally {
      this.saveHistory();
    }
    
    return deployment;
  }
  
  // 回滚到指定版本
  async rollback(
    environmentName: string,
    targetVersion?: string,
    reason = 'Manual rollback'
  ): Promise<DeploymentStatus> {
    const environment = this.config.environments.find(env => env.name === environmentName);
    if (!environment) {
      throw new Error(`Environment '${environmentName}' not found`);
    }
    
    // 获取目标版本
    if (!targetVersion) {
      const previousDeployments = this.history.deployments
        .filter(d => d.environment === environmentName && d.status === 'success')
        .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
      
      if (previousDeployments.length < 2) {
        throw new Error('No previous successful deployment found for rollback');
      }
      
      targetVersion = previousDeployments[1].version;
    }
    
    const rollbackId = this.generateDeploymentId();
    
    // 记录回滚操作
    this.history.rollbacks.push({
      id: rollbackId,
      fromVersion: this.config.version,
      toVersion: targetVersion,
      timestamp: new Date(),
      reason,
    });
    
    // 执行部署到目标版本
    const deployment = await this.deploy(environmentName, {
      version: targetVersion,
      force: true,
    });
    
    deployment.status = 'rolled-back';
    deployment.rollbackVersion = targetVersion;
    
    this.log(deployment, `回滚到版本 ${targetVersion}，原因: ${reason}`);
    
    return deployment;
  }
  
  // 构建项目
  private async build(
    deployment: DeploymentStatus,
    environment: DeploymentEnvironment,
    options: any
  ): Promise<void> {
    this.log(deployment, '开始构建项目');
    
    try {
      // 运行测试（除非跳过）
      if (!options.skipTests) {
        this.log(deployment, '运行测试');
        const { stdout: testOutput } = await execAsync('npm test');
        this.log(deployment, `测试输出: ${testOutput}`);
      }
      
      // 运行构建命令
      this.log(deployment, `执行构建命令: ${environment.buildCommand}`);
      const { stdout: buildOutput } = await execAsync(environment.buildCommand);
      this.log(deployment, `构建输出: ${buildOutput}`);
      
      // 如果配置了 Docker，构建镜像
      if (this.config.docker) {
        await this.buildDockerImage(deployment);
      }
      
      this.log(deployment, '构建完成');
    } catch (error) {
      throw new Error(`构建失败: ${error}`);
    }
  }
  
  // 构建 Docker 镜像
  private async buildDockerImage(deployment: DeploymentStatus): Promise<void> {
    if (!this.config.docker) return;
    
    const { registry, repository } = this.config.docker;
    const tag = this.config.docker.tag || deployment.version;
    const imageName = `${registry}/${repository}:${tag}`;
    
    this.log(deployment, `构建 Docker 镜像: ${imageName}`);
    
    try {
      // 构建镜像
      const { stdout: buildOutput } = await execAsync(`docker build -t ${imageName} .`);
      this.log(deployment, `Docker 构建输出: ${buildOutput}`);
      
      // 推送到仓库
      this.log(deployment, `推送镜像到仓库`);
      const { stdout: pushOutput } = await execAsync(`docker push ${imageName}`);
      this.log(deployment, `Docker 推送输出: ${pushOutput}`);
      
    } catch (error) {
      throw new Error(`Docker 构建失败: ${error}`);
    }
  }
  
  // 部署到环境
  private async deployToEnvironment(
    deployment: DeploymentStatus,
    environment: DeploymentEnvironment,
    options: any
  ): Promise<void> {
    this.log(deployment, `开始部署到 ${environment.name} 环境`);
    
    try {
      // 执行部署命令
      this.log(deployment, `执行部署命令: ${environment.deployCommand}`);
      const { stdout: deployOutput } = await execAsync(environment.deployCommand);
      this.log(deployment, `部署输出: ${deployOutput}`);
      
      // 如果配置了 CDN，清除缓存
      if (this.config.cdn) {
        await this.invalidateCDN(deployment);
      }
      
      this.log(deployment, '部署完成');
    } catch (error) {
      throw new Error(`部署失败: ${error}`);
    }
  }
  
  // 清除 CDN 缓存
  private async invalidateCDN(deployment: DeploymentStatus): Promise<void> {
    if (!this.config.cdn) return;
    
    const { provider, distributionId } = this.config.cdn;
    
    this.log(deployment, `清除 ${provider} CDN 缓存`);
    
    try {
      switch (provider) {
        case 'aws':
          const { stdout: awsOutput } = await execAsync(
            `aws cloudfront create-invalidation --distribution-id ${distributionId} --paths "/*"`
          );
          this.log(deployment, `AWS CloudFront 缓存清除输出: ${awsOutput}`);
          break;
          
        case 'cloudflare':
          // 这里需要使用 Cloudflare API
          this.log(deployment, 'Cloudflare CDN 缓存清除（需要实现 API 调用）');
          break;
          
        case 'azure':
          // 这里需要使用 Azure CDN API
          this.log(deployment, 'Azure CDN 缓存清除（需要实现 API 调用）');
          break;
      }
    } catch (error) {
      this.log(deployment, `CDN 缓存清除失败: ${error}`);
      // CDN 缓存清除失败不应该导致部署失败
    }
  }
  
  // 执行健康检查
  private async performHealthCheck(
    deployment: DeploymentStatus,
    environment: DeploymentEnvironment
  ): Promise<void> {
    if (!environment.healthCheckUrl) return;
    
    this.log(deployment, `执行健康检查: ${environment.healthCheckUrl}`);
    
    const maxRetries = 5;
    const retryDelay = 10000; // 10 秒
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const startTime = Date.now();
        const response = await fetch(environment.healthCheckUrl);
        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
          deployment.healthCheck = {
            status: 'healthy',
            responseTime,
            checks: [
              {
                name: 'HTTP Status',
                status: 'pass',
                message: `Status: ${response.status}`,
              },
              {
                name: 'Response Time',
                status: responseTime < 5000 ? 'pass' : 'fail',
                message: `${responseTime}ms`,
              },
            ],
          };
          
          this.log(deployment, `健康检查通过，响应时间: ${responseTime}ms`);
          return;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        this.log(deployment, `健康检查失败 (尝试 ${i + 1}/${maxRetries}): ${error}`);
        
        if (i === maxRetries - 1) {
          deployment.healthCheck = {
            status: 'unhealthy',
            responseTime: 0,
            checks: [
              {
                name: 'HTTP Status',
                status: 'fail',
                message: String(error),
              },
            ],
          };
          
          throw new Error(`健康检查失败: ${error}`);
        }
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  // 设置环境变量
  private async setEnvironmentVariables(environment: DeploymentEnvironment): Promise<void> {
    // 设置环境变量
    Object.entries(environment.environmentVariables).forEach(([key, value]) => {
      process.env[key] = value;
    });
    
    // 设置密钥（从安全存储中获取）
    Object.entries(environment.secrets).forEach(([key, secretKey]) => {
      // 这里应该从安全存储（如 AWS Secrets Manager、Azure Key Vault 等）中获取密钥
      // 简化实现，直接使用环境变量
      const secretValue = process.env[secretKey];
      if (secretValue) {
        process.env[key] = secretValue;
      }
    });
  }
  
  // 发送通知
  private async sendNotification(
    deployment: DeploymentStatus,
    environment: DeploymentEnvironment,
    type: 'success' | 'failure'
  ): Promise<void> {
    if (!environment.notifications) return;
    
    const message = this.formatNotificationMessage(deployment, type);
    
    // Slack 通知
    if (environment.notifications.slack) {
      try {
        await this.sendSlackNotification(
          environment.notifications.slack,
          message,
          type
        );
      } catch (error) {
        console.warn('Failed to send Slack notification:', error);
      }
    }
    
    // 邮件通知
    if (environment.notifications.email) {
      try {
        await this.sendEmailNotification(
          environment.notifications.email,
          message,
          type
        );
      } catch (error) {
        console.warn('Failed to send email notification:', error);
      }
    }
  }
  
  // 发送 Slack 通知
  private async sendSlackNotification(
    slackConfig: { webhook: string; channel: string },
    message: string,
    type: 'success' | 'failure'
  ): Promise<void> {
    const color = type === 'success' ? 'good' : 'danger';
    const emoji = type === 'success' ? ':white_check_mark:' : ':x:';
    
    const payload = {
      channel: slackConfig.channel,
      attachments: [
        {
          color,
          text: `${emoji} ${message}`,
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };
    
    await fetch(slackConfig.webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }
  
  // 发送邮件通知
  private async sendEmailNotification(
    emailConfig: {
      recipients: string[];
      smtp: {
        host: string;
        port: number;
        user: string;
        password: string;
      };
    },
    message: string,
    type: 'success' | 'failure'
  ): Promise<void> {
    // 这里需要使用邮件发送库，如 nodemailer
    // 简化实现
    console.log(`Email notification: ${message}`);
  }
  
  // 格式化通知消息
  private formatNotificationMessage(
    deployment: DeploymentStatus,
    type: 'success' | 'failure'
  ): string {
    const status = type === 'success' ? '成功' : '失败';
    const duration = deployment.duration ? `，耗时 ${deployment.duration}ms` : '';
    
    return `部署${status}\n` +
           `项目: ${this.config.projectName}\n` +
           `环境: ${deployment.environment}\n` +
           `版本: ${deployment.version}\n` +
           `时间: ${deployment.startTime.toISOString()}${duration}\n` +
           (deployment.error ? `错误: ${deployment.error}` : '');
  }
  
  // 获取当前部署状态
  getCurrentDeployment(environmentName: string): DeploymentStatus | undefined {
    return this.history.deployments
      .filter(d => d.environment === environmentName)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())[0];
  }
  
  // 获取部署历史
  getDeploymentHistory(environmentName?: string): DeploymentStatus[] {
    let deployments = this.history.deployments;
    
    if (environmentName) {
      deployments = deployments.filter(d => d.environment === environmentName);
    }
    
    return deployments.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }
  
  // 获取回滚历史
  getRollbackHistory(): DeploymentHistory['rollbacks'] {
    return this.history.rollbacks.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  // 清理旧的部署记录
  cleanupHistory(keepDays = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);
    
    this.history.deployments = this.history.deployments.filter(
      d => d.startTime > cutoffDate
    );
    
    this.history.rollbacks = this.history.rollbacks.filter(
      r => r.timestamp > cutoffDate
    );
    
    this.saveHistory();
  }
  
  // 生成部署 ID
  private generateDeploymentId(): string {
    return `deploy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // 记录日志
  private log(deployment: DeploymentStatus, message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    deployment.logs.push(logMessage);
    console.log(logMessage);
  }
  
  // 加载历史记录
  private loadHistory(): DeploymentHistory {
    try {
      if (fs.existsSync(this.historyPath)) {
        const data = fs.readFileSync(this.historyPath, 'utf-8');
        const history = JSON.parse(data);
        
        // 转换日期字符串为 Date 对象
        history.deployments.forEach((d: any) => {
          d.startTime = new Date(d.startTime);
          if (d.endTime) d.endTime = new Date(d.endTime);
        });
        
        history.rollbacks.forEach((r: any) => {
          r.timestamp = new Date(r.timestamp);
        });
        
        return history;
      }
    } catch (error) {
      console.warn('Failed to load deployment history:', error);
    }
    
    return {
      deployments: [],
      rollbacks: [],
    };
  }
  
  // 保存历史记录
  private saveHistory(): void {
    try {
      fs.writeFileSync(this.historyPath, JSON.stringify(this.history, null, 2));
    } catch (error) {
      console.warn('Failed to save deployment history:', error);
    }
  }
}

// CI/CD 管道管理器
export class CIPipelineManager {
  // 生成 GitHub Actions 工作流
  static generateGitHubActionsWorkflow(config: {
    name: string;
    triggers: {
      push?: { branches: string[] };
      pullRequest?: { branches: string[] };
      schedule?: string;
    };
    jobs: {
      test?: {
        nodeVersion: string[];
        os: string[];
      };
      build?: {
        nodeVersion: string;
        os: string;
      };
      deploy?: {
        environment: string;
        nodeVersion: string;
        os: string;
      };
    };
  }): string {
    const workflow = {
      name: config.name,
      on: {},
      jobs: {},
    };
    
    // 配置触发器
    if (config.triggers.push) {
      (workflow.on as any).push = {
        branches: config.triggers.push.branches,
      };
    }
    
    if (config.triggers.pullRequest) {
      (workflow.on as any).pull_request = {
        branches: config.triggers.pullRequest.branches,
      };
    }
    
    if (config.triggers.schedule) {
      (workflow.on as any).schedule = [
        { cron: config.triggers.schedule },
      ];
    }
    
    // 测试任务
    if (config.jobs.test) {
      (workflow.jobs as any).test = {
        'runs-on': '${{ matrix.os }}',
        strategy: {
          matrix: {
            'node-version': config.jobs.test.nodeVersion,
            os: config.jobs.test.os,
          },
        },
        steps: [
          {
            uses: 'actions/checkout@v3',
          },
          {
            name: 'Use Node.js ${{ matrix.node-version }}',
            uses: 'actions/setup-node@v3',
            with: {
              'node-version': '${{ matrix.node-version }}',
              'cache': 'npm',
            },
          },
          {
            run: 'npm ci',
          },
          {
            run: 'npm run lint',
          },
          {
            run: 'npm test',
          },
          {
            run: 'npm run build',
          },
        ],
      };
    }
    
    // 构建任务
    if (config.jobs.build) {
      (workflow.jobs as any).build = {
        'runs-on': config.jobs.build.os,
        needs: config.jobs.test ? ['test'] : undefined,
        steps: [
          {
            uses: 'actions/checkout@v3',
          },
          {
            name: 'Use Node.js',
            uses: 'actions/setup-node@v3',
            with: {
              'node-version': config.jobs.build.nodeVersion,
              'cache': 'npm',
            },
          },
          {
            run: 'npm ci',
          },
          {
            run: 'npm run build',
          },
          {
            name: 'Upload build artifacts',
            uses: 'actions/upload-artifact@v3',
            with: {
              name: 'build-files',
              path: 'dist/',
            },
          },
        ],
      };
    }
    
    // 部署任务
    if (config.jobs.deploy) {
      (workflow.jobs as any).deploy = {
        'runs-on': config.jobs.deploy.os,
        needs: ['build'],
        environment: config.jobs.deploy.environment,
        if: "github.ref == 'refs/heads/main'",
        steps: [
          {
            uses: 'actions/checkout@v3',
          },
          {
            name: 'Download build artifacts',
            uses: 'actions/download-artifact@v3',
            with: {
              name: 'build-files',
              path: 'dist/',
            },
          },
          {
            name: 'Deploy to production',
            run: 'npm run deploy',
            env: {
              DEPLOY_TOKEN: '${{ secrets.DEPLOY_TOKEN }}',
            },
          },
        ],
      };
    }
    
    return `# This file was auto-generated\n${JSON.stringify(workflow, null, 2).replace(/"/g, '')}`;
  }
  
  // 生成 Docker 配置
  static generateDockerfile(config: {
    nodeVersion: string;
    workdir: string;
    buildCommand: string;
    startCommand: string;
    port: number;
  }): string {
    return `# Multi-stage build for production
FROM node:${config.nodeVersion}-alpine AS builder

# Set working directory
WORKDIR ${config.workdir}

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN ${config.buildCommand}

# Production stage
FROM node:${config.nodeVersion}-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set working directory
WORKDIR ${config.workdir}

# Copy built application
COPY --from=builder --chown=nextjs:nodejs ${config.workdir}/dist ./dist
COPY --from=builder --chown=nextjs:nodejs ${config.workdir}/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs ${config.workdir}/package*.json ./

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE ${config.port}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${config.port}/health || exit 1

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["${config.startCommand}"]
`;
  }
  
  // 生成 Docker Compose 配置
  static generateDockerCompose(config: {
    services: Array<{
      name: string;
      image: string;
      ports: string[];
      environment: Record<string, string>;
      volumes?: string[];
      dependsOn?: string[];
    }>;
  }): string {
    const compose = {
      version: '3.8',
      services: {},
    };
    
    config.services.forEach(service => {
      (compose.services as any)[service.name] = {
        image: service.image,
        ports: service.ports,
        environment: service.environment,
        volumes: service.volumes,
        depends_on: service.dependsOn,
        restart: 'unless-stopped',
        healthcheck: {
          test: ['CMD', 'curl', '-f', 'http://localhost:3000/health'],
          interval: '30s',
          timeout: '10s',
          retries: 3,
          start_period: '40s',
        },
      };
    });
    
    return `# This file was auto-generated\n${JSON.stringify(compose, null, 2).replace(/"/g, '')}`;
  }
  
  // 生成 Kubernetes 部署配置
  static generateKubernetesManifests(config: {
    appName: string;
    image: string;
    replicas: number;
    port: number;
    resources: {
      requests: { cpu: string; memory: string };
      limits: { cpu: string; memory: string };
    };
    environment: Record<string, string>;
  }): {
    deployment: string;
    service: string;
    ingress: string;
  } {
    const deployment = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: config.appName,
        labels: {
          app: config.appName,
        },
      },
      spec: {
        replicas: config.replicas,
        selector: {
          matchLabels: {
            app: config.appName,
          },
        },
        template: {
          metadata: {
            labels: {
              app: config.appName,
            },
          },
          spec: {
            containers: [
              {
                name: config.appName,
                image: config.image,
                ports: [
                  {
                    containerPort: config.port,
                  },
                ],
                env: Object.entries(config.environment).map(([name, value]) => ({
                  name,
                  value,
                })),
                resources: config.resources,
                livenessProbe: {
                  httpGet: {
                    path: '/health',
                    port: config.port,
                  },
                  initialDelaySeconds: 30,
                  periodSeconds: 10,
                },
                readinessProbe: {
                  httpGet: {
                    path: '/ready',
                    port: config.port,
                  },
                  initialDelaySeconds: 5,
                  periodSeconds: 5,
                },
              },
            ],
          },
        },
      },
    };
    
    const service = {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: config.appName,
        labels: {
          app: config.appName,
        },
      },
      spec: {
        selector: {
          app: config.appName,
        },
        ports: [
          {
            port: 80,
            targetPort: config.port,
          },
        ],
        type: 'ClusterIP',
      },
    };
    
    const ingress = {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'Ingress',
      metadata: {
        name: config.appName,
        annotations: {
          'kubernetes.io/ingress.class': 'nginx',
          'cert-manager.io/cluster-issuer': 'letsencrypt-prod',
        },
      },
      spec: {
        tls: [
          {
            hosts: [`${config.appName}.example.com`],
            secretName: `${config.appName}-tls`,
          },
        ],
        rules: [
          {
            host: `${config.appName}.example.com`,
            http: {
              paths: [
                {
                  path: '/',
                  pathType: 'Prefix',
                  backend: {
                    service: {
                      name: config.appName,
                      port: {
                        number: 80,
                      },
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    };
    
    return {
      deployment: JSON.stringify(deployment, null, 2),
      service: JSON.stringify(service, null, 2),
      ingress: JSON.stringify(ingress, null, 2),
    };
  }
}

// 部署脚本生成器
export class DeploymentScriptGenerator {
  // 生成部署脚本
  static generateDeployScript(config: {
    platform: 'vercel' | 'netlify' | 'aws' | 'azure' | 'gcp';
    projectName: string;
    buildCommand: string;
    outputDir: string;
    environmentVariables: Record<string, string>;
  }): string {
    switch (config.platform) {
      case 'vercel':
        return this.generateVercelScript(config);
      case 'netlify':
        return this.generateNetlifyScript(config);
      case 'aws':
        return this.generateAWSScript(config);
      case 'azure':
        return this.generateAzureScript(config);
      case 'gcp':
        return this.generateGCPScript(config);
      default:
        throw new Error(`Unsupported platform: ${config.platform}`);
    }
  }
  
  private static generateVercelScript(config: any): string {
    return `#!/bin/bash

# Vercel deployment script
echo "Deploying to Vercel..."

# Install Vercel CLI
npm install -g vercel

# Set environment variables
${Object.entries(config.environmentVariables)
  .map(([key, value]) => `vercel env add ${key} production <<< "${value}"`)
  .join('\n')}

# Deploy
vercel --prod --confirm

echo "Deployment completed!"
`;
  }
  
  private static generateNetlifyScript(config: any): string {
    return `#!/bin/bash

# Netlify deployment script
echo "Deploying to Netlify..."

# Install Netlify CLI
npm install -g netlify-cli

# Build project
${config.buildCommand}

# Deploy
netlify deploy --prod --dir=${config.outputDir}

echo "Deployment completed!"
`;
  }
  
  private static generateAWSScript(config: any): string {
    return `#!/bin/bash

# AWS S3 + CloudFront deployment script
echo "Deploying to AWS..."

# Build project
${config.buildCommand}

# Sync to S3
aws s3 sync ${config.outputDir} s3://${config.projectName}-bucket --delete

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"

echo "Deployment completed!"
`;
  }
  
  private static generateAzureScript(config: any): string {
    return `#!/bin/bash

# Azure Static Web Apps deployment script
echo "Deploying to Azure..."

# Build project
${config.buildCommand}

# Deploy using Azure CLI
az staticwebapp deploy --name ${config.projectName} --source ${config.outputDir}

echo "Deployment completed!"
`;
  }
  
  private static generateGCPScript(config: any): string {
    return `#!/bin/bash

# Google Cloud Platform deployment script
echo "Deploying to GCP..."

# Build project
${config.buildCommand}

# Deploy to Cloud Storage
gsutil -m rsync -r -d ${config.outputDir} gs://${config.projectName}-bucket

# Update CDN cache
gcloud compute url-maps invalidate-cdn-cache ${config.projectName}-lb --path "/*"

echo "Deployment completed!"
`;
  }
}

// 导出主要类和接口
export {
  DeploymentEnvironment,
  DeploymentConfig,
  DeploymentStatus,
  DeploymentHistory,
};