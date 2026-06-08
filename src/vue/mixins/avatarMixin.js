// 提供统一的头像处理方法，包括：
// 1. 从多种数据源提取头像URL
// 2. 处理头像URL路径
// 3. 生成默认头像（SVG格式）
// 4. 处理头像加载错误


export default {
  // 所有定义在 methods 中的方法都会被混入到使用该 Mixin 的组件中
  // 组件可以直接通过 this.methodName() 调用
  methods: {
    
    /**
     * 获取头像URL - 统一入口
     * 
     * 这个方法是头像处理的统一入口，支持多种数据源：
     * 1. 用户对象：{ avatar: '/uploads/avatars/xxx.jpg' }
     * 2. 通知对象：{ sender: { avatar: '...' } }
     * 3. 字符串：直接传入头像URL
     * 4. null/undefined：返回默认头像
     * 
     * @param {Object|string} source - 数据源
     *   - Object: 用户对象、通知对象等
     *   - string: 头像URL字符串
     *   - null/undefined: 返回默认头像
     * 
     * @param {number} size - 头像尺寸（像素）
     *   - 默认值：40
     *   - 用于生成默认头像的尺寸
     * 
     * @returns {string} 处理后的头像URL
     * 
     * // 示例1：传入用户对象
     * const user = { username: '张三', avatar: '/uploads/avatars/123.jpg' };
     * <img :src="getAvatar(user, 50)">
     * 
     * // 示例2：传入通知对象
     * const notification = {
     *   type: 'like',
     *   sender: { username: '李四', avatar: '/uploads/avatars/456.jpg' }
     * };
     * <img :src="getAvatar(notification.sender, 40)">
     * 
     * // 示例3：传入字符串URL
     * <img :src="getAvatar('/uploads/avatars/789.jpg')">
     * 
     * // 示例4：传入null（显示默认头像）
     * <img :src="getAvatar(null)">
     */
    getAvatar(source, size = 40) {
      // 如果 source 为 null、undefined 或空字符串
      if (!source) {
        // 返回默认头像，使用 'U' 作为首字母
        return this.getDefaultAvatar('U', size);
      }
      
      // typeof 返回 'string' 表示是字符串
      if (typeof source === 'string') {
        // 直接处理 URL 字符串
        return this.processAvatarUrl(source, size);
      }
      
      // typeof 返回 'object' 表示是对象（包括数组，但数组不会有 avatar 属性）
      if (typeof source === 'object') {
        // 尝试从对象中提取头像URL
        const avatar = this.extractAvatarFromObject(source);
        
        // 如果提取到了头像URL
        if (avatar) {
          // 处理并返回头像URL
          return this.processAvatarUrl(avatar, size);
        }
        
        // 如果没有提取到头像URL，生成默认头像
        // 尝试获取用户名作为默认头像的首字母
        const name = source.username || source.name || source.sender?.username || 'U';
        return this.getDefaultAvatar(name, size);
      }
      
      // 兜底处理，确保总是返回一个有效的头像URL
      return this.getDefaultAvatar('U', size);
    },
    
    /**
     * 从对象中提取头像URL
     * 
     * 项目中头像可能存储在不同的位置：
     * 1. user.avatar - 用户对象的 avatar 字段
     * 2. user.profile.avatar - 用户对象的 profile 子对象中
     * 3. notification.sender.avatar - 通知对象的发送者头像
     * 4. blog.author.avatar - 博客对象的作者头像
     * 
     * 这个方法按优先级依次检查这些位置
     * 
     * @param {Object} obj - 用户对象或通知对象
     * @returns {string|null} 头像URL或null
     * 
     * // 用户对象（直接存储）
     * { username: '张三', avatar: '/uploads/avatars/123.jpg' }
     * 
     * // 用户对象（profile 子对象）
     * { username: '李四', profile: { avatar: '/uploads/avatars/456.jpg' } }
     * 
     * // 通知对象
     * { type: 'like', sender: { username: '王五', avatar: '/uploads/avatars/789.jpg' } }
     * 
     * // 博客对象
     * { title: '文章标题', author: { username: '赵六', avatar: '/uploads/avatars/abc.jpg' } }
     */
    extractAvatarFromObject(obj) {
      // 检查对象是否为空
      if (!obj) return null;
      
      // trim() 去除首尾空格，避免空字符串被误判
      if (obj.avatar && obj.avatar.trim()) {
        return obj.avatar;
      }
      
      // 有些用户对象将头像存储在 profile 子对象中
      if (obj.profile && obj.profile.avatar && obj.profile.avatar.trim()) {
        return obj.profile.avatar;
      }
      
      // 通知对象中，发送者信息存储在 sender 字段
      if (obj.sender) {
        // 检查 sender.avatar
        if (obj.sender.avatar && obj.sender.avatar.trim()) {
          return obj.sender.avatar;
        }
        // 检查 sender.profile.avatar
        if (obj.sender.profile && obj.sender.profile.avatar && obj.sender.profile.avatar.trim()) {
          return obj.sender.profile.avatar;
        }
      }
      
      // 博客对象中，作者信息存储在 author 字段
      if (obj.author) {
        // 检查 author.avatar
        if (obj.author.avatar && obj.author.avatar.trim()) {
          return obj.author.avatar;
        }
        // 检查 author.profile.avatar
        if (obj.author.profile && obj.author.profile.avatar && obj.author.profile.avatar.trim()) {
          return obj.author.profile.avatar;
        }
      }
      
      return null;
    },
    
    /**
     * 处理头像URL路径
     * 
     * 头像URL可能有多种格式：
     * 1. 完整URL：https://example.com/avatar.jpg
     * 2. Data URI：data:image/svg+xml,...
     * 3. 相对路径：/uploads/avatars/123.jpg
     * 4. 无前缀路径：uploads/avatars/123.jpg
     * 
     * 这个方法将所有格式统一处理为可用的URL
     * 
     * @param {string} url - 原始URL
     * @param {number} size - 头像尺寸（用于默认头像）
     * @returns {string} 处理后的URL
     * 
     */
    processAvatarUrl(url, size = 40) {
      if (!url || !url.trim()) {
        return this.getDefaultAvatar('U', size);
      }
      
      const trimmedUrl = url.trim();
      
      // 以 http:// 或 https:// 开头，说明是外部链接
      if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
        return trimmedUrl;
      }
      
      // 以 data: 开头，说明是内嵌数据（如 SVG）
      if (trimmedUrl.startsWith('data:')) {
        return trimmedUrl;
      }
      
      // 以 /static/ 开头，说明路径已经正确
      if (trimmedUrl.startsWith('/static/')) {
        return trimmedUrl;
      }
      
      // 数据库存储的是 /uploads/avatars/xxx.jpg
      // 需要添加 /static 前缀变成 /static/uploads/avatars/xxx.jpg
      if (trimmedUrl.startsWith('/uploads/')) {
        return `/static${trimmedUrl}`;
      }
      
      // 有些地方可能存储为 uploads/avatars/xxx.jpg
      if (trimmedUrl.startsWith('uploads/')) {
        return `/static/${trimmedUrl}`;
      }
      
      // 兜底处理，添加 /static 前缀
      if (trimmedUrl.startsWith('/')) {
        return `/static${trimmedUrl}`;
      }
      
      return `/static/${trimmedUrl}`;
    },
    
    /**
     * 获取默认头像（SVG格式，不依赖外部服务）
     * 
     * 使用 SVG data URI 生成默认头像：
     * 1. 不依赖外部图片服务
     * 2. 根据用户名生成不同颜色
     * 3. 显示用户名首字母
     * 4. 纯前端生成，无需网络请求
     * 
     * @param {string} name - 用户名（用于生成首字母和颜色）
     * @param {number} size - 头像尺寸（像素）
     * @returns {string} SVG data URI
     * 
     * <svg>
     *   <circle />   <!-- 背景圆 -->
     *   <text />     <!-- 首字母 -->
     * </svg>
     * 
     * 根据用户名的第一个字符的 Unicode 编码选择颜色
     * 相同用户名总是生成相同颜色
     */
    getDefaultAvatar(name, size = 40) {
      // 取用户名的第一个字符，转大写
      // 如果 name 为空，使用 'U'（User 的首字母）
      const initial = (name || 'U').charAt(0).toUpperCase();
      
      // 8种不同的颜色，用于生成不同用户的头像背景
      const colors = [
        '#4CAF50',  // 绿色
        '#2196F3',  // 蓝色
        '#FF9800',  // 橙色
        '#9C27B0',  // 紫色
        '#f44336',  // 红色
        '#607D8B',  // 灰色
        '#00BCD4',  // 青色
        '#795548'   // 棕色
      ];
      
      // 使用用户名第一个字符的 Unicode 编码对颜色数组长度取模
      // 确保相同用户名总是生成相同颜色
      const colorIndex = (name || '').charCodeAt(0) % colors.length;
      
      const color = colors[colorIndex];
      
      // data:image/svg+xml, 是 SVG data URI 的前缀
      // %3C 是 < 的 URL 编码
      // %3E 是 > 的 URL 编码
      // encodeURIComponent() 用于编码特殊字符
      return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'%3E%3Ccircle cx='${size/2}' cy='${size/2}' r='${size/2}' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='${size/2}' y='${size*0.65}' font-size='${size*0.5}' text-anchor='middle' fill='white' font-family='Arial'%3E${encodeURIComponent(initial)}%3C/text%3E%3C/svg%3E`;
      
      // <svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'>
      //   <!-- 背景圆：填充颜色，半径为 size/2 -->
      //   <circle cx='20' cy='20' r='20' fill='#4CAF50' />
      //   <!-- 首字母：居中显示，白色，Arial 字体 -->
      //   <text x='20' y='26' font-size='20' text-anchor='middle' fill='white' font-family='Arial'>A</text>
      // </svg>
    },
    
    /**
     * 处理图片加载错误
     * 
     * 当头像图片加载失败时（如文件不存在、网络错误），显示默认头像
     * 
     * @param {Event} event - 错误事件对象
     *   event.target 是触发错误的 <img> 元素
     * @param {string} name - 用户名（用于生成默认头像）
     * @param {number} size - 头像尺寸
     * 
     * <img 
     *   :src="getAvatar(user)" 
     *   @error="handleAvatarError($event, user.username)"
     * >
     * 
     * 当图片加载失败时：
     * 1. 浏览器触发 error 事件
     * 2. @error 监听器调用 handleAvatarError
     * 3. 将 img.src 替换为默认头像
     */
    handleAvatarError(event, name = 'U', size = 40) {
      // 检查事件对象和目标元素是否存在
      if (event.target) {
        // 将图片的 src 属性替换为默认头像
        event.target.src = this.getDefaultAvatar(name, size);
      }
    }
  }
};

