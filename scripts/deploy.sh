#!/bin/bash

# Blog 项目部署脚本
# 支持多环境部署：development, staging, production

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示帮助信息
show_help() {
    cat << EOF
用法: $0 [选项] <环境>

环境:
    development     部署到开发环境
    staging         部署到测试环境
    production      部署到生产环境

选项:
    -h, --help      显示此帮助信息
    -v, --version   指定部署版本
    -f, --force     强制部署（跳过确认）
    -s, --skip-tests 跳过测试
    -d, --dry-run   试运行（不执行实际部署）
    --skip-build    跳过构建步骤
    --skip-backup   跳过备份步骤
    --rollback      回滚到上一个版本

示例:
    $0 staging                    # 部署到测试环境
    $0 production -v 1.2.3        # 部署指定版本到生产环境
    $0 production --force          # 强制部署到生产环境
    $0 staging --dry-run           # 试运行部署到测试环境
    $0 production --rollback       # 回滚生产环境
EOF
}

# 默认参数
ENVIRONMENT=""
VERSION=""
FORCE=false
SKIP_TESTS=false
DRY_RUN=false
SKIP_BUILD=false
SKIP_BACKUP=false
ROLLBACK=false

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -s|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --rollback)
            ROLLBACK=true
            shift
            ;;
        development|staging|production)
            ENVIRONMENT="$1"
            shift
            ;;
        *)
            log_error "未知参数: $1"
            show_help
            exit 1
            ;;
    esac
done

# 检查环境参数
if [[ -z "$ENVIRONMENT" ]]; then
    log_error "请指定部署环境"
    show_help
    exit 1
fi

# 检查必要的工具
check_dependencies() {
    log_info "检查依赖工具..."
    
    local missing_tools=()
    
    command -v node >/dev/null 2>&1 || missing_tools+=("node")
    command -v npm >/dev/null 2>&1 || missing_tools+=("npm")
    command -v git >/dev/null 2>&1 || missing_tools+=("git")
    command -v docker >/dev/null 2>&1 || missing_tools+=("docker")
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_error "缺少必要工具: ${missing_tools[*]}"
        exit 1
    fi
    
    log_success "依赖检查通过"
}

# 加载环境配置
load_environment_config() {
    log_info "加载 $ENVIRONMENT 环境配置..."
    
    case $ENVIRONMENT in
        development)
            export NODE_ENV=development
            export PORT=3000
            export BUILD_COMMAND="npm run build:dev"
            export DEPLOY_COMMAND="npm run start:dev"
            export HEALTH_CHECK_URL="http://localhost:3000/health"
            ;;
        staging)
            export NODE_ENV=staging
            export PORT=3001
            export BUILD_COMMAND="npm run build:staging"
            export DEPLOY_COMMAND="npm run start:staging"
            export HEALTH_CHECK_URL="https://staging.yourblog.com/health"
            ;;
        production)
            export NODE_ENV=production
            export PORT=3000
            export BUILD_COMMAND="npm run build"
            export DEPLOY_COMMAND="npm run start"
            export HEALTH_CHECK_URL="https://yourblog.com/health"
            ;;
    esac
    
    # 加载环境变量文件
    if [[ -f ".env.$ENVIRONMENT" ]]; then
        log_info "加载环境变量文件: .env.$ENVIRONMENT"
        set -a
        source ".env.$ENVIRONMENT"
        set +a
    fi
    
    log_success "环境配置加载完成"
}

# 检查 Git 状态
check_git_status() {
    log_info "检查 Git 状态..."
    
    if [[ ! -d ".git" ]]; then
        log_error "当前目录不是 Git 仓库"
        exit 1
    fi
    
    # 检查是否有未提交的更改
    if [[ -n $(git status --porcelain) ]]; then
        log_warning "检测到未提交的更改"
        if [[ "$FORCE" != true ]]; then
            read -p "是否继续部署？(y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_info "部署已取消"
                exit 0
            fi
        fi
    fi
    
    # 获取当前分支和提交
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    CURRENT_COMMIT=$(git rev-parse HEAD)
    
    log_info "当前分支: $CURRENT_BRANCH"
    log_info "当前提交: $CURRENT_COMMIT"
    
    # 检查分支是否符合环境要求
    case $ENVIRONMENT in
        production)
            if [[ "$CURRENT_BRANCH" != "main" && "$FORCE" != true ]]; then
                log_error "生产环境只能从 main 分支部署"
                exit 1
            fi
            ;;
        staging)
            if [[ "$CURRENT_BRANCH" != "develop" && "$CURRENT_BRANCH" != "main" && "$FORCE" != true ]]; then
                log_error "测试环境只能从 develop 或 main 分支部署"
                exit 1
            fi
            ;;
    esac
    
    log_success "Git 状态检查通过"
}

# 运行测试
run_tests() {
    if [[ "$SKIP_TESTS" == true ]]; then
        log_warning "跳过测试"
        return 0
    fi
    
    log_info "运行测试..."
    
    # 单元测试
    log_info "运行单元测试..."
    npm run test:unit || {
        log_error "单元测试失败"
        exit 1
    }
    
    # 集成测试
    log_info "运行集成测试..."
    npm run test:integration || {
        log_error "集成测试失败"
        exit 1
    }
    
    # 代码质量检查
    log_info "运行代码质量检查..."
    npm run lint || {
        log_error "代码质量检查失败"
        exit 1
    }
    
    log_success "所有测试通过"
}

# 构建项目
build_project() {
    if [[ "$SKIP_BUILD" == true ]]; then
        log_warning "跳过构建"
        return 0
    fi
    
    log_info "构建项目..."
    
    # 清理旧的构建文件
    if [[ -d "dist" ]]; then
        rm -rf dist
    fi
    
    # 安装依赖
    log_info "安装依赖..."
    npm ci
    
    # 执行构建
    log_info "执行构建命令: $BUILD_COMMAND"
    eval $BUILD_COMMAND || {
        log_error "构建失败"
        exit 1
    }
    
    # 验证构建结果
    if [[ ! -d "dist" ]]; then
        log_error "构建输出目录不存在"
        exit 1
    fi
    
    log_success "项目构建完成"
}

# 创建备份
create_backup() {
    if [[ "$SKIP_BACKUP" == true ]]; then
        log_warning "跳过备份"
        return 0
    fi
    
    log_info "创建备份..."
    
    local backup_dir="backups/$(date +%Y%m%d_%H%M%S)_$ENVIRONMENT"
    mkdir -p "$backup_dir"
    
    # 备份当前部署
    if [[ -d "dist" ]]; then
        cp -r dist "$backup_dir/"
    fi
    
    # 备份配置文件
    if [[ -f "package.json" ]]; then
        cp package.json "$backup_dir/"
    fi
    
    # 备份环境变量
    if [[ -f ".env.$ENVIRONMENT" ]]; then
        cp ".env.$ENVIRONMENT" "$backup_dir/"
    fi
    
    # 记录部署信息
    cat > "$backup_dir/deploy_info.txt" << EOF
部署时间: $(date)
环境: $ENVIRONMENT
分支: $CURRENT_BRANCH
提交: $CURRENT_COMMIT
版本: ${VERSION:-"latest"}
EOF
    
    log_success "备份创建完成: $backup_dir"
}

# 构建 Docker 镜像
build_docker_image() {
    log_info "构建 Docker 镜像..."
    
    local image_tag="blog-app:${VERSION:-latest}-$ENVIRONMENT"
    
    docker build -t "$image_tag" . || {
        log_error "Docker 镜像构建失败"
        exit 1
    }
    
    log_success "Docker 镜像构建完成: $image_tag"
}

# 部署应用
deploy_application() {
    log_info "部署应用到 $ENVIRONMENT 环境..."
    
    case $ENVIRONMENT in
        development)
            deploy_to_development
            ;;
        staging)
            deploy_to_staging
            ;;
        production)
            deploy_to_production
            ;;
    esac
    
    log_success "应用部署完成"
}

# 部署到开发环境
deploy_to_development() {
    log_info "部署到开发环境..."
    
    # 停止现有服务
    pkill -f "node.*dist" || true
    
    # 启动新服务
    nohup $DEPLOY_COMMAND > logs/app.log 2>&1 &
    
    sleep 5
}

# 部署到测试环境
deploy_to_staging() {
    log_info "部署到测试环境..."
    
    # 使用 Docker Compose 部署
    docker-compose -f docker-compose.staging.yml down || true
    docker-compose -f docker-compose.staging.yml up -d
}

# 部署到生产环境
deploy_to_production() {
    log_info "部署到生产环境..."
    
    # 滚动更新部署
    if command -v kubectl >/dev/null 2>&1; then
        # Kubernetes 部署
        kubectl set image deployment/blog-app blog-app="blog-app:${VERSION:-latest}-production"
        kubectl rollout status deployment/blog-app
    else
        # Docker Compose 部署
        docker-compose -f docker-compose.production.yml up -d --no-deps --build blog-app
    fi
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log_info "健康检查尝试 $attempt/$max_attempts"
        
        if curl -f "$HEALTH_CHECK_URL" >/dev/null 2>&1; then
            log_success "健康检查通过"
            return 0
        fi
        
        sleep 10
        ((attempt++))
    done
    
    log_error "健康检查失败"
    return 1
}

# 回滚部署
rollback_deployment() {
    log_info "回滚 $ENVIRONMENT 环境..."
    
    # 查找最新的备份
    local latest_backup=$(ls -t backups/ | grep "_$ENVIRONMENT" | head -n 1)
    
    if [[ -z "$latest_backup" ]]; then
        log_error "未找到可用的备份"
        exit 1
    fi
    
    log_info "使用备份: $latest_backup"
    
    # 恢复备份
    if [[ -d "backups/$latest_backup/dist" ]]; then
        rm -rf dist
        cp -r "backups/$latest_backup/dist" .
    fi
    
    # 重启服务
    case $ENVIRONMENT in
        development)
            pkill -f "node.*dist" || true
            nohup $DEPLOY_COMMAND > logs/app.log 2>&1 &
            ;;
        staging)
            docker-compose -f docker-compose.staging.yml restart blog-app
            ;;
        production)
            if command -v kubectl >/dev/null 2>&1; then
                kubectl rollout undo deployment/blog-app
            else
                docker-compose -f docker-compose.production.yml restart blog-app
            fi
            ;;
    esac
    
    log_success "回滚完成"
}

# 发送通知
send_notification() {
    local status=$1
    local message=$2
    
    log_info "发送部署通知..."
    
    # Slack 通知（如果配置了 webhook）
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        local color="good"
        if [[ "$status" != "success" ]]; then
            color="danger"
        fi
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"text\": \"$message\",
                    \"fields\": [
                        {\"title\": \"环境\", \"value\": \"$ENVIRONMENT\", \"short\": true},
                        {\"title\": \"分支\", \"value\": \"$CURRENT_BRANCH\", \"short\": true},
                        {\"title\": \"提交\", \"value\": \"$CURRENT_COMMIT\", \"short\": true},
                        {\"title\": \"时间\", \"value\": \"$(date)\", \"short\": true}
                    ]
                }]
            }" \
            "$SLACK_WEBHOOK_URL" || true
    fi
    
    # 邮件通知（如果配置了邮件服务）
    if [[ -n "$EMAIL_RECIPIENTS" ]]; then
        echo "$message" | mail -s "部署通知: $ENVIRONMENT" "$EMAIL_RECIPIENTS" || true
    fi
}

# 清理函数
cleanup() {
    log_info "清理临时文件..."
    
    # 清理旧的备份（保留最近10个）
    if [[ -d "backups" ]]; then
        ls -t backups/ | tail -n +11 | xargs -r -I {} rm -rf "backups/{}"
    fi
    
    # 清理 Docker 镜像（保留最近5个）
    if command -v docker >/dev/null 2>&1; then
        docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}" | \
            grep "blog-app" | tail -n +6 | awk '{print $1":"$2}' | \
            xargs -r docker rmi || true
    fi
}

# 主函数
main() {
    log_info "开始部署到 $ENVIRONMENT 环境"
    
    if [[ "$DRY_RUN" == true ]]; then
        log_warning "这是一次试运行，不会执行实际部署"
    fi
    
    # 检查依赖
    check_dependencies
    
    # 加载环境配置
    load_environment_config
    
    # 检查 Git 状态
    check_git_status
    
    if [[ "$ROLLBACK" == true ]]; then
        # 执行回滚
        if [[ "$DRY_RUN" != true ]]; then
            rollback_deployment
            health_check
            send_notification "success" "回滚到 $ENVIRONMENT 环境成功"
        fi
        log_success "回滚完成"
        return 0
    fi
    
    # 确认部署
    if [[ "$FORCE" != true && "$DRY_RUN" != true ]]; then
        echo
        log_warning "即将部署到 $ENVIRONMENT 环境"
        log_info "分支: $CURRENT_BRANCH"
        log_info "提交: $CURRENT_COMMIT"
        log_info "版本: ${VERSION:-"latest"}"
        echo
        read -p "确认继续？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "部署已取消"
            exit 0
        fi
    fi
    
    # 执行部署步骤
    if [[ "$DRY_RUN" != true ]]; then
        run_tests
        create_backup
        build_project
        build_docker_image
        deploy_application
        health_check || {
            log_error "健康检查失败，考虑回滚"
            send_notification "failure" "部署到 $ENVIRONMENT 环境失败：健康检查未通过"
            exit 1
        }
        cleanup
        send_notification "success" "部署到 $ENVIRONMENT 环境成功"
    fi
    
    log_success "部署流程完成"
}

# 错误处理
trap 'log_error "部署过程中发生错误，退出码: $?"; send_notification "failure" "部署到 $ENVIRONMENT 环境失败"' ERR

# 执行主函数
main "$@"