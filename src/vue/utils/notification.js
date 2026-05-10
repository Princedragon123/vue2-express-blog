// ============================================================
// notification.js - 通知提示工具（学习版·DOM操作）
// ============================================================
// 
// 【文件职责】
// 提供轻量级的通知提示功能，包括：
// 1. 成功/错误/警告/信息四种类型
// 2. 自动消失的 Toast 提示
// 3. 动画效果
// 
// 【学习重点】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  1. DOM 操作：createElement、appendChild、removeChild                   │
// │  2. CSS-in-JS：通过 JS 设置样式                                         │
// │  3. 定时器：setTimeout 控制显示/隐藏                                    │
// │  4. 动画效果：CSS transition + transform                               │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【通知类型】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  【success】成功提示 - 绿色背景                                          │
// │  showNotification('操作成功！', 'success')                              │
// │  ┌─────────────────────────────┐                                       │
// │  │ ✅ 操作成功！                │                                       │
// │  └─────────────────────────────┘                                       │
// │                                                                         │
// │  【error】错误提示 - 红色背景                                            │
// │  showNotification('操作失败！', 'error')                                │
// │  ┌─────────────────────────────┐                                       │
// │  │ ❌ 操作失败！                │                                       │
// │  └─────────────────────────────┘                                       │
// │                                                                         │
// │  【warning】警告提示 - 橙色背景                                          │
// │  showNotification('请注意！', 'warning')                                │
// │  ┌─────────────────────────────┐                                       │
// │  │ ⚠️ 请注意！                  │                                       │
// │  └─────────────────────────────┘                                       │
// │                                                                         │
// │  【info】信息提示 - 蓝色背景（默认）                                      │
// │  showNotification('提示信息')                                           │
// │  ┌─────────────────────────────┐                                       │
// │  │ ℹ️ 提示信息                  │                                       │
// │  └─────────────────────────────┘                                       │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【动画流程】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │   创建元素                                                              │
// │   ────────                                                              │
// │       │                                                                 │
// │       │ opacity: 0, transform: translateX(100%)                        │
// │       │ （初始状态：不可见，在右侧外面）                                │
// │       ▼                                                                 │
// │   100ms 后                                                              │
// │   ────────                                                              │
// │       │                                                                 │
// │       │ opacity: 1, transform: translateX(0)                           │
// │       │ （动画进入：滑入并显示）                                        │
// │       ▼                                                                 │
// │   显示 3.5 秒                                                           │
// │   ──────────                                                            │
// │       │                                                                 │
// │       ▼                                                                 │
// │   开始退出                                                              │
// │   ────────                                                              │
// │       │                                                                 │
// │       │ opacity: 0, transform: translateX(100%)                        │
// │       │ （动画退出：滑出并隐藏）                                        │
// │       ▼                                                                 │
// │   400ms 后                                                              │
// │   ────────                                                              │
// │       │                                                                 │
// │       │ 移除 DOM 元素                                                   │
// │       ▼                                                                 │
// │   完成                                                                  │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【面试常问】
// Q1: 为什么用 JS 创建 DOM 而不是 Vue 组件？
// A: 工具函数可在任何地方调用，不依赖 Vue 实例
// 
// Q2: 为什么要先添加到页面再设置动画？
// A: 浏览器需要先渲染初始状态，动画才能生效
// 
// Q3: 如何防止通知堆叠？
// A: 可以添加队列机制或限制同时显示数量
// ============================================================

// ============================================================
// 【第一部分：原代码版本】
// ============================================================
// 【学习对比】这是原始版本，方便你对比优化前后的区别
// 【特点】功能完整，但每次调用都需要传 type 参数
// 【缺点】重复代码多，每次都要写 'success'、'error' 等
// ============================================================

/**
 * 【原函数】显示通知消息（原始版本）
 * @param {string} message - 通知消息内容
 * @param {string} type - 通知类型：success, error, warning, info
 */
/*
export function showNotification(message, type = 'info') {
    // ========================================================
    // 步骤1：创建通知元素
    // ========================================================
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // ========================================================
    // 步骤2：创建图标元素
    // ========================================================
    const icon = document.createElement('span');
    icon.className = 'nav-icon';
    
    // 根据类型设置图标
    switch (type) {
        case 'success':
            icon.textContent = '✅';
            break;
        case 'error':
            icon.textContent = '❌';
            break;
        case 'warning':
            icon.textContent = '⚠️';
            break;
        default:
            icon.textContent = 'ℹ️';
    }
    
    // ========================================================
    // 步骤3：创建消息文本元素
    // ========================================================
    const messageText = document.createElement('span');
    messageText.textContent = message;
    
    // 组装通知元素
    notification.appendChild(icon);
    notification.appendChild(messageText);
    
    // ========================================================
    // 步骤4：设置样式（CSS-in-JS）
    // ========================================================
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 12px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        z-index: 9999;
        opacity: 0;
        transform: translateX(100%) translateY(-20px);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        max-width: 320px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: 'Comic Sans MS', cursive, sans-serif;
    `;
    
    // 设置图标样式
    icon.style.cssText = `
        font-size: 18px;
        flex-shrink: 0;
    `;
    
    // 根据类型设置背景色
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#4caf50';
            icon.style.color = '#e8f5e8';
            break;
        case 'error':
            notification.style.backgroundColor = '#f44336';
            icon.style.color = '#ffebee';
            break;
        case 'warning':
            notification.style.backgroundColor = '#ff9800';
            icon.style.color = '#fff3e0';
            break;
        default:
            notification.style.backgroundColor = '#2196f3';
            icon.style.color = '#e3f2fd';
    }
    
    // ========================================================
    // 步骤5：添加到页面
    // ========================================================
    document.body.appendChild(notification);
    
    // ========================================================
    // 步骤6：触发进入动画
    // ========================================================
    // 【重要】需要延迟一帧，让浏览器先渲染初始状态
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0) translateY(0)';
    }, 100);
    
    // ========================================================
    // 步骤7：设置自动消失
    // ========================================================
    setTimeout(() => {
        // 开始退出动画
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%) translateY(-20px)';
        
        // 动画结束后移除元素
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 400);  // 与 transition 时间一致
    }, 3500);  // 显示 3.5 秒
}
*/

// ============================================================
// 【第二部分：优化后的版本】
// ============================================================
// 【优化内容】
// 1. 增加了 duration 参数，可以自定义显示时长
// 2. 添加了柯里化函数 createNotifier()
// 3. 预定义了常用的通知器，使用更方便
// 
// 【优化效果】
// ✅ 易读性提升：调用更简洁，不需要每次传 type
// ✅ 可维护性提升：参数复用，修改一处全局生效
// ✅ 性能影响：无，只是函数封装，不影响性能
// ============================================================

/**
 * 【优化1】增加 duration 参数的 showNotification
 * @param {string} message - 通知消息内容
 * @param {string} type - 通知类型：success, error, warning, info
 * @param {number} duration - 显示时长（毫秒）
 */
export function showNotification(message, type = 'info', duration = 3500) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = document.createElement('span');
    icon.className = 'nav-icon';
    
    switch (type) {
        case 'success':
            icon.textContent = '✅';
            break;
        case 'error':
            icon.textContent = '❌';
            break;
        case 'warning':
            icon.textContent = '⚠️';
            break;
        default:
            icon.textContent = 'ℹ️';
    }
    
    const messageText = document.createElement('span');
    messageText.textContent = message;
    
    notification.appendChild(icon);
    notification.appendChild(messageText);
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 12px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        z-index: 9999;
        opacity: 0;
        transform: translateX(100%) translateY(-20px);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        max-width: 320px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: 'Comic Sans MS', cursive, sans-serif;
    `;
    
    icon.style.cssText = `
        font-size: 18px;
        flex-shrink: 0;
    `;
    
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#4caf50';
            icon.style.color = '#e8f5e8';
            break;
        case 'error':
            notification.style.backgroundColor = '#f44336';
            icon.style.color = '#ffebee';
            break;
        case 'warning':
            notification.style.backgroundColor = '#ff9800';
            icon.style.color = '#fff3e0';
            break;
        default:
            notification.style.backgroundColor = '#2196f3';
            icon.style.color = '#e3f2fd';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0) translateY(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%) translateY(-20px)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 400);
    }, duration);
}

// ============================================================
// 【优化2：柯里化版本】
// ============================================================
// 【什么是柯里化？】
// 把接受多个参数的函数，变成接受一个参数的函数，返回接受余下参数的新函数
// 
// 【为什么这里用柯里化？】
// 1. 参数复用：type 和 duration 通常固定，不需要每次传
// 2. 延迟执行：先创建通知器，需要时再传 message
// 3. 函数组合：可以组合出不同类型的通知器
// ============================================================

/**
 * 【柯里化核心函数】创建通知器
 * @param {string} type - 通知类型
 * @param {number} duration - 显示时长（毫秒）
 * @returns {Function} 接收 message 的通知函数
 */
export function createNotifier(type = 'info', duration = 3500) {
    // [柯里化原理1] 返回一个内部函数
    // 这个内部函数"记住"了外部的 type 和 duration 变量
    return function(message) {
        // [柯里化原理2] 内部函数使用外部变量
        // 即使 createNotifier 执行完了，type 和 duration 还在内存里
        return showNotification(message, type, duration);
    };
}

// ============================================================
// 【优化3：预定义通知器】
// ============================================================
// 【学习重点】这是柯里化的实际应用
// 先固定 type 参数，得到专用的通知函数
// 使用时只需要传 message，更方便！
// ============================================================

/**
 * 预定义：成功通知器
 * 使用示例：notifySuccess('操作成功！')
 */
export const notifySuccess = createNotifier('success');

/**
 * 预定义：错误通知器
 * 使用示例：notifyError('操作失败！')
 */
export const notifyError = createNotifier('error');

/**
 * 预定义：警告通知器
 * 使用示例：notifyWarning('请注意！')
 */
export const notifyWarning = createNotifier('warning');

/**
 * 预定义：信息通知器
 * 使用示例：notifyInfo('提示信息')
 */
export const notifyInfo = createNotifier('info');

// ============================================================
// 【第三部分：使用对比示例】
// ============================================================
/*
// ---------------------------
// 【原写法】每次都要传 type
// ---------------------------
import { showNotification } from '@/utils/notification';

showNotification('操作成功！', 'success');
showNotification('操作失败！', 'error');
showNotification('请注意！', 'warning');

// ---------------------------
// 【优化后写法1】使用预定义通知器
// ---------------------------
import { notifySuccess, notifyError, notifyWarning } from '@/utils/notification';

notifySuccess('操作成功！');
notifyError('操作失败！');
notifyWarning('请注意！');

// ---------------------------
// 【优化后写法2】自定义时长
// ---------------------------
import { createNotifier } from '@/utils/notification';

// 创建一个快速通知器（2秒消失）
const quickNotify = createNotifier('info', 2000);
quickNotify('这是一个快速提示！');

// 创建一个长时间通知器（10秒消失）
const longNotify = createNotifier('warning', 10000);
longNotify('重要提示！请仔细阅读！');
*/
