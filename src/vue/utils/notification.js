// 轻量级 Toast 通知系统
// 使用 CSS 类控制样式（定义在 main.scss 中），而非内联样式

const DEFAULT_DURATION = 3500;
const ANIMATION_DURATION = 400;

// 图标映射
const ICONS = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ'
};

// 背景色映射
const COLORS = {
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6'
};

/**
 * 显示通知
 * @param {string} message - 消息内容
 * @param {string} type - 类型: success | error | warning | info
 * @param {number} duration - 显示时长(ms)
 */
export function showNotification(message, type = 'info', duration = DEFAULT_DURATION) {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;

  const icon = document.createElement('span');
  icon.textContent = ICONS[type] || ICONS.info;
  icon.style.cssText = 'font-size:18px;flex-shrink:0;';

  const text = document.createElement('span');
  text.textContent = message;

  notification.appendChild(icon);
  notification.appendChild(text);

  // 使用 CSS 变量中的样式 + 内联背景色
  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '14px 20px',
    borderRadius: '12px',
    backgroundColor: COLORS[type] || COLORS.info,
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: '9999',
    opacity: '0',
    transform: 'translateX(120%)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    maxWidth: '360px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontFamily: "'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', cursive, sans-serif"
  });

  document.body.appendChild(notification);

  // 入场动画
  requestAnimationFrame(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  });

  // 自动消失
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(120%)';
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, ANIMATION_DURATION);
  }, duration);
}

// 柯里化便捷函数
export function createNotifier(type = 'info', duration = DEFAULT_DURATION) {
  return (message) => showNotification(message, type, duration);
}

export const notifySuccess = createNotifier('success');
export const notifyError = createNotifier('error');
export const notifyWarning = createNotifier('warning');
export const notifyInfo = createNotifier('info');
