// 全局通用工具函数 - 从各组件中提取，避免重复定义

/**
 * 防抖函数 - 延迟执行，适用于搜索输入、窗口调整等
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 延迟毫秒数
 * @returns {Function} 防抖后的函数
 */
export function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * 节流函数 - 固定频率执行，适用于滚动事件等
 * @param {Function} fn - 要执行的函数
 * @param {number} limit - 间隔毫秒数
 * @returns {Function} 节流后的函数
 */
export function throttle(fn, limit = 100) {
  let inThrottle = false;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 格式化日期为中文格式
 * @param {string|Date} date - 日期
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * 格式化相对时间
 * @param {string|Date} date - 日期
 * @returns {string} 相对时间描述
 */
export function timeAgo(date) {
  if (!date) return '';
  const now = Date.now();
  const past = new Date(date).getTime();
  const diff = now - past;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return formatDate(date);
}

/**
 * 截断文本
 * @param {string} text - 原文本
 * @param {number} maxLength - 最大长度
 * @returns {string} 截断后的文本
 */
export function truncateText(text, maxLength = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * 解析 JWT Token 载荷
 * @param {string} token - JWT Token
 * @returns {object|null} 解析后的载荷或 null
 */
export function parseJwtPayload(token) {
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

/**
 * 检查 Token 是否过期
 * @param {string} token - JWT Token
 * @returns {boolean} 是否过期
 */
export function isTokenExpired(token) {
  const payload = parseJwtPayload(token);
  if (!payload || !payload.exp) return true;
  return payload.exp < Date.now() / 1000;
}

/**
 * 标准化图片 URL 路径
 * @param {string} url - 原始 URL
 * @returns {string} 标准化后的 URL
 */
export function normalizeImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  if (url.startsWith('/static/')) return url;
  if (url.startsWith('/uploads/')) return `/static${url}`;
  if (url.startsWith('uploads/')) return `/static/${url}`;
  return `/static/${url.replace(/^\/+/, '')}`;
}

/**
 * 安全地从 storage 获取数据
 * @param {string} key - 存储键名
 * @returns {string|null} 存储的值
 */
export function getStoredItem(key) {
  try {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * 获取认证 Token（优先 localStorage）
 * @returns {string|null}
 */
export function getAuthToken() {
  return getStoredItem('token');
}

/**
 * 获取存储的用户信息
 * @returns {object|null}
 */
export function getStoredUser() {
  try {
    const userStr = getStoredItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}
