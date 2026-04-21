// ============================================================
// errorHandler.js - 错误处理工具（学习版·错误日志）
// ============================================================
// 
// 【文件职责】
// 统一处理应用中的错误，包括：
// 1. 记录错误日志
// 2. 持久化存储错误信息
// 3. 显示友好的错误提示
// 4. 错误日志管理
// 
// 【学习重点】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  1. 单例模式：整个应用只有一个错误处理器实例                            │
// │  2. 错误日志：记录错误时间、信息、堆栈                                  │
// │  3. 持久化：localStorage 存储错误日志                                   │
// │  4. Toast 组件：动态创建提示组件                                       │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【错误处理流程】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │   代码执行出错                                                          │
// │   ────────────                                                          │
// │       │                                                                 │
// │       ▼                                                                 │
// │   errorHandler.logError(error, { component: 'Login' })                  │
// │       │                                                                 │
// │       ├── 1. 收集错误信息                                               │
// │       │   {                                                             │
// │       │     timestamp: '2024-01-01T12:00:00Z',                         │
// │       │     message: 'Network Error',                                  │
// │       │     stack: 'Error: Network Error\n    at ...',                 │
// │       │     context: { component: 'Login' },                           │
// │       │     url: 'https://example.com/login'                           │
// │       │   }                                                             │
// │       │                                                                 │
// │       ├── 2. 控制台输出                                                 │
// │       │   console.error('错误记录:', errorInfo)                        │
// │       │                                                                 │
// │       ├── 3. 添加到内存日志                                             │
// │       │   this.errors.push(errorInfo)                                  │
// │       │                                                                 │
// │       ├── 4. 保存到 localStorage                                        │
// │       │   localStorage.setItem('app_errors', ...)                      │
// │       │                                                                 │
// │       └── 5. 显示用户提示                                               │
// │           errorHandler.showError('操作失败，请重试')                    │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【错误日志结构】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  {                                                                      │
// │    timestamp: "2024-01-01T12:00:00.000Z",  // ISO 时间格式             │
// │    message: "Network Error",               // 错误消息                 │
// │    stack: "Error: Network Error\n...",     // 错误堆栈                 │
// │    context: {                              // 错误上下文               │
// │      component: "Login",                                               │
// │      action: "submit"                                                  │
// │    },                                                                   │
// │    url: "https://example.com/login"        // 发生错误的页面 URL       │
// │  }                                                                      │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【单例模式】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  【什么是单例模式？】                                                    │
// │  确保一个类只有一个实例，并提供全局访问点                               │
// │                                                                         │
// │  【实现方式】                                                            │
// │  // 类定义                                                              │
// │  class ErrorHandler { ... }                                            │
// │                                                                         │
// │  // 导出单例实例（而不是类）                                            │
// │  export default new ErrorHandler();                                    │
// │                                                                         │
// │  【使用方式】                                                            │
// │  import errorHandler from '@/utils/errorHandler';                      │
// │  errorHandler.logError(error);  // 直接使用实例                        │
// │                                                                         │
// │  【优点】                                                                │
// │  - 全局共享同一个错误日志                                               │
// │  - 避免重复创建实例                                                    │
// │  - 方便统一管理                                                        │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【面试常问】
// Q1: 为什么要记录错误日志？
// A: 方便排查问题、分析错误趋势、改进用户体验
// 
// Q2: 为什么限制错误数量？
// A: 防止内存溢出，localStorage 容量有限
// 
// Q3: 如何在生产环境上报错误？
// A: 可以集成 Sentry、Bugsnag 等错误监控服务
// ============================================================

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

    // ========================================================
    // 记录错误
    // ========================================================
    // 【参数】
    // - error: Error 对象
    // - context: 错误上下文（可选）
    // 
    // 【用途】
    // 在 catch 块中调用，记录错误信息
    // 
    // 【示例】
    // try {
    //   await api.login(credentials);
    // } catch (error) {
    //   errorHandler.logError(error, { component: 'Login', action: 'submit' });
    // }
    // ========================================================
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

    // ========================================================
    // 保存到 localStorage
    // ========================================================
    // 【用途】持久化存储错误日志，页面刷新后仍可查看
    // 【限制】只保存最近 50 条
    // ========================================================
    saveToStorage() {
        try {
            localStorage.setItem('app_errors', JSON.stringify(this.errors.slice(-50)));
        } catch (e) {
            console.warn('保存错误日志失败:', e);
        }
    }

    // ========================================================
    // 从 localStorage 加载
    // ========================================================
    // 【用途】应用启动时加载历史错误日志
    // ========================================================
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

    // ========================================================
    // 获取错误日志
    // ========================================================
    getErrors() {
        return this.errors;
    }

    // ========================================================
    // 清除错误日志
    // ========================================================
    clearErrors() {
        this.errors = [];
        localStorage.removeItem('app_errors');
    }

    // ========================================================
    // 显示友好的错误提示
    // ========================================================
    showError(message, type = 'error') {
        this.createToast(message, type);
    }

    // ========================================================
    // 创建 Toast 组件
    // ========================================================
    // 【实现】
    // 1. 创建容器（如果不存在）
    // 2. 创建 Toast 元素
    // 3. 设置样式和动画
    // 4. 3 秒后自动移除
    // ========================================================
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

// ============================================================
// 导出单例实例
// ============================================================
// 【单例模式】导出实例而不是类
// 【使用方式】
// import errorHandler from '@/utils/errorHandler';
// 
// // 记录错误
// errorHandler.logError(error, { component: 'Login' });
// 
// // 显示错误提示
// errorHandler.showError('操作失败');
// 
// // 获取错误日志
// const errors = errorHandler.getErrors();
// 
// // 清除错误日志
// errorHandler.clearErrors();
// ============================================================
export default new ErrorHandler();
