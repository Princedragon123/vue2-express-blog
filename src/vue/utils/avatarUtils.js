// 判断是否本地开发环境
const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
// Nginx 统一代理，静态资源直接用相对路径
const SERVER_BASE_URL = '';

// 获取用户头像
export function getAuthorAvatar(author, placeholderSize = 40) {
    if (!author) {
        return `https://ui-avatars.com/api/?name=U&background=4CAF50&color=fff&size=${placeholderSize}`;
    }
    
    if (typeof author === 'string') {
        if (author.startsWith('http://') || author.startsWith('https://')) return author;
        if (author.startsWith('/static/')) return `${SERVER_BASE_URL}${author}`;
        if (author.startsWith('/uploads/')) return `${SERVER_BASE_URL}/static${author}`;
        if (author.startsWith('uploads/')) return `${SERVER_BASE_URL}/static/${author}`;
        if (author.startsWith('data:')) return author;
        
        if (author.trim()) {
            const initial = author.charAt(0).toUpperCase();
            return `https://ui-avatars.com/api/?name=${initial}&background=4CAF50&color=fff&size=${placeholderSize}`;
        }
        return `https://ui-avatars.com/api/?name=U&background=4CAF50&color=fff&size=${placeholderSize}`;
    }
    
    if (typeof author === 'object') {
        let avatar = author.avatar || author.profile?.avatar || author.avatarUrl;
        if (avatar && avatar.trim()) {
            if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar;
            if (avatar.startsWith('/static/')) return `${SERVER_BASE_URL}${avatar}`;
            if (avatar.startsWith('/uploads/')) return `${SERVER_BASE_URL}/static${avatar}`;
            if (avatar.startsWith('uploads/')) return `${SERVER_BASE_URL}/static/${avatar}`;
            if (avatar.startsWith('data:')) return avatar;
            return `${SERVER_BASE_URL}/static${avatar.startsWith('/') ? '' : '/'}${avatar}`;
        }
        
        const username = author.username || author.name || author.id || author._id || 'U';
        const initial = username.charAt(0).toUpperCase();
        return `https://ui-avatars.com/api/?name=${initial}&background=4CAF50&color=fff&size=${placeholderSize}`;
    }
    
    return `https://ui-avatars.com/api/?name=U&background=4CAF50&color=fff&size=${placeholderSize}`;
}

// 获取用户背景图
export function getAuthorCover(coverImage, placeholderWidth = 1200, placeholderHeight = 400) {
    if (!coverImage) {
        return `https://placehold.co/${placeholderWidth}x${placeholderHeight}/4CAF50/ffffff?text=Cover`;
    }

    if (typeof coverImage === 'string') {
        if (coverImage.startsWith('http://') || coverImage.startsWith('https://')) return coverImage;
        if (coverImage.startsWith('/static/')) return `${SERVER_BASE_URL}${coverImage}`;
        if (coverImage.startsWith('/uploads/')) return `${SERVER_BASE_URL}/static${coverImage}`;
        if (coverImage.startsWith('uploads/')) return `${SERVER_BASE_URL}/static/${coverImage}`;
        if (coverImage.startsWith('data:')) return coverImage;
    }

    return `https://placehold.co/${placeholderWidth}x${placeholderHeight}/4CAF50/ffffff?text=Cover`;
}