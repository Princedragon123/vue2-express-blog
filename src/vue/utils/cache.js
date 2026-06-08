// 提供前端数据缓存功能，包括：
// 1. 设置缓存（带过期时间）
// 2. 获取缓存（自动检查过期）
// 3. 删除缓存
// 4. 清除所有/过期缓存
// A: 防止数据过时，保证数据新鲜度
// A: 只能存字符串，需要 JSON 序列化；容量有限；同步操作可能阻塞
// A: try-catch 捕获异常，清除旧缓存或提示用户

// 常量定义

// 缓存键前缀
const CACHE_PREFIX = 'blog_cache_';

// 默认缓存过期时间（秒）
const DEFAULT_EXPIRY = 3600;

// CacheManager 类
class CacheManager {
    // 设置缓存
    // - key: 缓存键名
    // - value: 缓存值（任意类型，会自动序列化）
    // - expiry: 过期时间（秒），默认 1 小时
    // - true: 设置成功
    // - false: 设置失败（localStorage 满了）
    // 1. 创建缓存对象 { value, expiry }
    // 2. 计算过期时间 = 当前时间 + expiry * 1000
    // 3. 序列化为 JSON 字符串
    // 4. 存储到 localStorage
    static set(key, value, expiry = DEFAULT_EXPIRY) {
        try {
            const cacheItem = {
                value,
                expiry: Date.now() + expiry * 1000
            };
            localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheItem));
            return true;
        } catch (error) {
            console.error('设置缓存失败:', error);
            return false;
        }
    }

    // 获取缓存
    // - key: 缓存键名
    // - 缓存值（未过期）
    // - null（不存在或已过期）
    // 1. 从 localStorage 获取字符串
    // 2. 解析为对象
    // 3. 检查是否过期
    // 4. 过期则删除并返回 null
    // 5. 未过期则返回 value
    static get(key) {
        try {
            const itemStr = localStorage.getItem(CACHE_PREFIX + key);
            if (!itemStr) {
                return null;
            }

            const item = JSON.parse(itemStr);
            
            // 检查是否过期
            if (Date.now() > item.expiry) {
                localStorage.removeItem(CACHE_PREFIX + key);
                return null;
            }

            return item.value;
        } catch (error) {
            console.error('获取缓存失败:', error);
            return null;
        }
    }

    // 删除缓存
    // - key: 缓存键名
    // - true: 删除成功
    // - false: 删除失败
    static remove(key) {
        try {
            localStorage.removeItem(CACHE_PREFIX + key);
            return true;
        } catch (error) {
            console.error('删除缓存失败:', error);
            return false;
        }
    }

    // 清除所有缓存
    // 遍历 localStorage，删除所有以 CACHE_PREFIX 开头的键
    static clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(CACHE_PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('清除缓存失败:', error);
            return false;
        }
    }

    // 清除过期缓存
    // - 应用启动时调用
    // - 或设置定时器定期清理
    // 遍历所有缓存，删除已过期的项
    static clearExpired() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(CACHE_PREFIX)) {
                    const itemStr = localStorage.getItem(key);
                    if (itemStr) {
                        const item = JSON.parse(itemStr);
                        if (Date.now() > item.expiry) {
                            localStorage.removeItem(key);
                        }
                    }
                }
            });
            return true;
        } catch (error) {
            console.error('清除过期缓存失败:', error);
            return false;
        }
    }
}

// 导出缓存管理器
// import CacheManager from '@/utils/cache';
// // 设置缓存（1小时过期）
// CacheManager.set('user_123', { name: '张三' }, 3600);
// // 获取缓存
// const user = CacheManager.get('user_123');
// // 删除缓存
// CacheManager.remove('user_123');
// // 清除所有缓存
// CacheManager.clear();
// // 清除过期缓存
// CacheManager.clearExpired();
export default CacheManager;
