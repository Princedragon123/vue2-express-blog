// ============================================================
// avatarUtils.js - 头像处理工具
// ============================================================
// 
// 【文件职责】
// 统一处理用户头像 URL，包括：
// 1. 处理各种格式的头像路径
// 2. 提供默认头像占位符
// 3. 兼容多种数据来源
// 
// 【学习重点】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  1. URL 格式处理：相对路径、绝对路径、data URI                          │
// │  2. 默认头像生成：使用 ui-avatars.com 服务                              │
// │  3. 数据兼容：支持对象和字符串两种输入                                  │
// │  4. 可选链操作符：?. 安全访问嵌套属性                                   │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【头像 URL 来源类型】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  【类型1：完整 URL】                                                     │
// │  "https://example.com/avatar.jpg"                                      │
// │  "http://cdn.example.com/images/user.png"                              │
// │  → 直接返回，无需处理                                                   │
// │                                                                         │
// │  【类型2：相对路径】                                                     │
// │  "/static/uploads/avatars/user.jpg"                                    │
// │  "/uploads/avatars/user.jpg"                                           │
// │  "uploads/avatars/user.jpg"                                            │
// │  → 添加 /static 前缀                                                    │
// │                                                                         │
// │  【类型3：Data URI】                                                     │
// │  "data:image/png;base64,iVBORw0KGgo..."                                │
// │  → 直接返回，无需处理                                                   │
// │                                                                         │
// │  【类型4：用户名】                                                       │
// │  "张三"                                                                 │
// │  → 生成首字母头像                                                       │
// │                                                                         │
// │  【类型5：空值】                                                         │
// │  null, undefined, ""                                                   │
// │  → 返回默认占位头像                                                     │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【ui-avatars.com 服务】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  【API 格式】                                                            │
// │  https://ui-avatars.com/api/?name=张三&background=4CAF50&color=fff     │
// │                                                                         │
// │  【参数说明】                                                            │
// │  - name: 显示的名称（首字母）                                           │
// │  - background: 背景颜色                                                 │
// │  - color: 文字颜色                                                      │
// │  - size: 图片尺寸                                                       │
// │                                                                         │
// │  【优点】                                                                │
// │  - 免费使用                                                             │
// │  - 无需存储                                                             │
// │  - 自动生成                                                             │
// │                                                                         │
// │  【缺点】                                                                │
// │  - 依赖外部服务                                                         │
// │  - 网络延迟                                                             │
// │  - 可能被墙                                                             │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【面试常问】
// Q1: 为什么要统一处理头像 URL？
// A: 不同来源格式不一致，统一处理确保正确显示
// 
// Q2: 可选链操作符 ?. 有什么用？
// A: 安全访问嵌套属性，避免 Cannot read property of undefined
// 
// Q3: 如何优化头像加载？
// A: 使用懒加载、CDN、WebP 格式、缓存策略
// ============================================================

/**
 * 获取作者头像 URL
 * @param {Object|string} author - 作者对象或头像 URL 字符串
 * @param {number} placeholderSize - 占位符图片尺寸
 * @returns {string} 处理后的头像 URL
 */
export function getAuthorAvatar(author, placeholderSize = 40) {
    // ========================================================
    // 情况1：author 为空
    // ========================================================
    // 返回默认占位头像
    if (!author) {
        return `https://ui-avatars.com/api/?name=U&background=4CAF50&color=fff&size=${placeholderSize}`;
    }
    
    // ========================================================
    // 情况2：author 是字符串
    // ========================================================
    if (typeof author === 'string') {
        // 完整 URL（http/https 开头）
        if (author.startsWith('http://') || author.startsWith('https://')) {
            return author;
        }
        
        // 已经是 /static/ 开头的路径
        if (author.startsWith('/static/')) {
            return author;
        }
        
        // /uploads/ 开头的路径，需要添加 /static 前缀
        if (author.startsWith('/uploads/')) {
            return `/static${author}`;
        }
        
        // uploads/ 开头的路径（无前导斜杠）
        if (author.startsWith('uploads/')) {
            return `/static/${author}`;
        }
        
        // Data URI（base64 编码的图片）
        if (author.startsWith('data:')) {
            return author;
        }
        
        // 可能是用户名，生成首字母头像
        if (author.trim()) {
            const initial = author.charAt(0).toUpperCase();
            return `https://ui-avatars.com/api/?name=${initial}&background=4CAF50&color=fff&size=${placeholderSize}`;
        }
        
        // 空字符串，返回默认头像
        return `https://ui-avatars.com/api/?name=U&background=4CAF50&color=fff&size=${placeholderSize}`;
    }
    
    // ========================================================
    // 情况3：author 是对象
    // ========================================================
    if (typeof author === 'object') {
        // 尝试多种可能的头像字段
        // 【可选链操作符】?. 安全访问嵌套属性
        let avatar = author.avatar || author.profile?.avatar || author.avatarUrl;
        
        if (avatar && avatar.trim()) {
            // 完整 URL
            if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
                return avatar;
            }
            
            // 已经是 /static/ 开头
            if (avatar.startsWith('/static/')) {
                return avatar;
            }
            
            // /uploads/ 开头
            if (avatar.startsWith('/uploads/')) {
                return `/static${avatar}`;
            }
            
            // uploads/ 开头
            if (avatar.startsWith('uploads/')) {
                return `/static/${avatar}`;
            }
            
            // Data URI
            if (avatar.startsWith('data:')) {
                return avatar;
            }
            
            // 其他路径，添加 /static 前缀
            return `/static${avatar.startsWith('/') ? '' : '/'}${avatar}`;
        }
        
        // 没有头像，使用用户名生成首字母头像
        const username = author.username || author.name || author.id || author._id || 'U';
        const initial = username.charAt(0).toUpperCase();
        return `https://ui-avatars.com/api/?name=${initial}&background=4CAF50&color=fff&size=${placeholderSize}`;
    }
    
    // ========================================================
    // 默认情况：返回默认头像
    // ========================================================
    return `https://ui-avatars.com/api/?name=U&background=4CAF50&color=fff&size=${placeholderSize}`;
}

// ============================================================
// 使用示例
// ============================================================
// import { getAuthorAvatar } from '@/utils/avatarUtils';
// 
// // 对象形式
// const user = { username: '张三', avatar: '/uploads/avatar.jpg' };
// const avatarUrl = getAuthorAvatar(user);  // "/static/uploads/avatar.jpg"
// 
// // 字符串形式
// const avatarUrl2 = getAuthorAvatar('https://example.com/avatar.jpg');
// 
// // 空值
// const avatarUrl3 = getAuthorAvatar(null);  // 默认占位头像
// ============================================================
