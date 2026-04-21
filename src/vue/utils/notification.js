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

/**
 * 显示通知消息
 * @param {string} message - 通知消息内容
 * @param {string} type - 通知类型：success, error, warning, info
 */
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