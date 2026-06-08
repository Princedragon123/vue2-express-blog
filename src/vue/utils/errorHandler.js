// 统一处理应用中的错误，包括：
// 1. 记录错误日志
// 2. 持久化存储错误信息
// 3. 显示友好的错误提示
// 4. 错误日志管理
// A: 方便排查问题、分析错误趋势、改进用户体验
// A: 防止内存溢出，localStorage 容量有限
// A: 可以集成 Sentry、Bugsnag 等错误监控服务

/**
 * 错误处理类
 */
class ErrorHandler {
    constructor() {
        // 错误日志数组
        this.errors = [];
        
        // 最大保存错误数量
        this.maxErrors = 100;
    }

    // 记录错误
    // - error: Error 对象
    // - context: 错误上下文（可选）
    // 在 catch 块中调用，记录错误信息
    // try {
    //   await api.login(credentials);
    // } catch (error) {
    //   errorHandler.logError(error, { component: 'Login', action: 'submit' });
    logError(error, context = {}) {
        const errorInfo = {
            timestamp: new Date().toISOString(),
            message: error.message || '未知错误',
            stack: error.stack,
            context: context,
            url: window.location.href
        };

        // 控制台输出
        console.error('错误记录:', errorInfo);
        
        // 添加到内存日志
        this.errors.push(errorInfo);

        // 限制错误数量（先进先出）
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }

        // 保存到 localStorage
        this.saveToStorage();
    }

    // 保存到 localStorage
    saveToStorage() {
        try {
            localStorage.setItem('app_errors', JSON.stringify(this.errors.slice(-50)));
        } catch (e) {
            console.warn('保存错误日志失败:', e);
        }
    }

    // 从 localStorage 加载
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('app_errors');
            if (stored) {
                this.errors = JSON.parse(stored);
            }
        } catch (e) {
            console.warn('加载错误日志失败:', e);
        }
    }

    // 获取错误日志
    getErrors() {
        return this.errors;
    }

    // 清除错误日志
    clearErrors() {
        this.errors = [];
        localStorage.removeItem('app_errors');
    }

    // 显示友好的错误提示
    showError(message, type = 'error') {
        this.createToast(message, type);
    }

    // 创建 Toast 组件
    // 1. 创建容器（如果不存在）
    // 2. 创建 Toast 元素
    // 3. 设置样式和动画
    // 4. 3 秒后自动移除
    createToast(message, type) {
        // 检查是否已存在 toast 容器
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(container);
        }

        // 创建 toast 元素
        const toast = document.createElement('div');
        
        // 根据类型设置背景色
        const bgColor = type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#28a745';
        
        toast.style.cssText = `
            background: ${bgColor};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
            max-width: 350px;
            word-wrap: break-word;
        `;
        toast.textContent = message;

        // 添加动画样式（只添加一次）
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        if (!document.querySelector('#toast-styles')) {
            style.id = 'toast-styles';
            document.head.appendChild(style);
        }

        container.appendChild(toast);

        // 3 秒后移除
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// 导出单例实例
// import errorHandler from '@/utils/errorHandler';
// // 记录错误
// errorHandler.logError(error, { component: 'Login' });
// // 显示错误提示
// errorHandler.showError('操作失败');
// // 获取错误日志
// const errors = errorHandler.getErrors();
// // 清除错误日志
// errorHandler.clearErrors();
export default new ErrorHandler();
