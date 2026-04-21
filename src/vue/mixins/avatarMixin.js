// ============================================================
// avatarMixin.js - 头像处理混入（学习版·代码复用）
// ============================================================
// 
// 【文件职责】
// 提供统一的头像处理方法，包括：
// 1. 从多种数据源提取头像URL
// 2. 处理头像URL路径
// 3. 生成默认头像（SVG格式）
// 4. 处理头像加载错误
// 
// 【学习重点】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  1. Vue Mixin：代码复用机制，将通用方法混入多个组件                     │
// │  2. 头像处理：从用户对象、通知对象中提取头像URL                        │
// │  3. 默认头像：SVG data URI，无需外部图片资源                           │
// │  4. 错误处理：图片加载失败时显示默认头像                               │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【Vue Mixin 原理】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  【什么是 Mixin？】                                                      │
// │  Mixin 是一种代码复用机制，可以将组件中可复用的功能提取出来。           │
// │                                                                         │
// │  【Mixin 合并策略】                                                      │
// │  ┌─────────────────────────────────────────────────────────────────┐   │
// │  │  组件定义          Mixin 定义         合并结果                   │   │
// │  │  ──────────        ──────────         ──────────                │   │
// │  │  data() {}    +    data() {}    →    合并（组件优先）           │   │
// │  │  methods: {}  +    methods: {}  →    合并（组件优先）           │   │
// │  │  created()    +    created()    →    先执行 Mixin，再执行组件   │   │
// │  │  mounted()    +    mounted()    →    先执行 Mixin，再执行组件   │   │
// │  └─────────────────────────────────────────────────────────────────┘   │
// │                                                                         │
// │  【使用示例】                                                            │
// │  // 定义 Mixin                                                          │
// │  const avatarMixin = {                                                  │
// │    methods: {                                                           │
// │      getAvatar(source) { ... }                                          │
// │    }                                                                    │
// │  }                                                                      │
// │                                                                         │
// │  // 在组件中使用                                                        │
// │  export default {                                                       │
// │    mixins: [avatarMixin],  // 混入 avatarMixin 的所有方法              │
// │    methods: {                                                           │
// │      // 组件自己的方法                                                  │
// │    }                                                                    │
// │  }                                                                      │
// │                                                                         │
// │  // 现在组件可以直接调用 this.getAvatar(source)                         │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【头像处理流程】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │   组件调用 getAvatar(user)                                              │
// │   ──────────────────────────                                            │
// │       │                                                                 │
// │       │ this.getAvatar(user, 40)                                       │
// │       ▼                                                                 │
// │   判断数据类型                                                          │
// │   ────────────                                                          │
// │       │                                                                 │
// │       ├── 字符串 → processAvatarUrl(url)                               │
// │       │                                                                 │
// │       ├── 对象 → extractAvatarFromObject(obj)                          │
// │       │            │                                                    │
// │       │            ├── obj.avatar 存在 → 返回                          │
// │       │            ├── obj.profile.avatar 存在 → 返回                  │
// │       │            ├── obj.sender.avatar 存在 → 返回                   │
// │       │            └── 都不存在 → 返回 null                            │
// │       │                                                                 │
// │       └── null/undefined → getDefaultAvatar('U')                       │
// │                                                                         │
// │   处理 URL 路径                                                         │
// │   ──────────────                                                        │
// │       │                                                                 │
// │       ├── http:// 或 https:// → 直接返回                               │
// │       ├── data: → 直接返回（data URI）                                 │
// │       ├── /static/... → 直接返回                                       │
// │       ├── /uploads/... → 添加 /static 前缀                             │
// │       └── uploads/... → 添加 /static/ 前缀                             │
// │                                                                         │
// │   返回最终 URL                                                          │
// │   ─────────────                                                         │
// │       │                                                                 │
// │       └── 用于 <img :src="getAvatar(user)">                            │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// ============================================================

// ============================================================
// 【导出 Mixin 对象】
// ============================================================

export default {
  // ============================================================
  // 【methods：混入的方法】
  // ============================================================
  // 所有定义在 methods 中的方法都会被混入到使用该 Mixin 的组件中
  // 组件可以直接通过 this.methodName() 调用
  methods: {
    
    // ============================================================
    // 【核心方法：getAvatar】
    // ============================================================
    /**
     * 获取头像URL - 统一入口
     * 
     * 【设计思路】
     * 这个方法是头像处理的统一入口，支持多种数据源：
     * 1. 用户对象：{ avatar: '/uploads/avatars/xxx.jpg' }
     * 2. 通知对象：{ sender: { avatar: '...' } }
     * 3. 字符串：直接传入头像URL
     * 4. null/undefined：返回默认头像
     * 
     * 【参数说明】
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
     * 【使用示例】
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
      // ─── 步骤1：检查数据源是否为空 ───
      // 如果 source 为 null、undefined 或空字符串
      if (!source) {
        // 返回默认头像，使用 'U' 作为首字母
        return this.getDefaultAvatar('U', size);
      }
      
      // ─── 步骤2：检查是否为字符串类型 ───
      // typeof 返回 'string' 表示是字符串
      if (typeof source === 'string') {
        // 直接处理 URL 字符串
        return this.processAvatarUrl(source, size);
      }
      
      // ─── 步骤3：检查是否为对象类型 ───
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
      
      // ─── 步骤4：其他情况返回默认头像 ───
      // 兜底处理，确保总是返回一个有效的头像URL
      return this.getDefaultAvatar('U', size);
    },
    
    // ============================================================
    // 【辅助方法：extractAvatarFromObject】
    // ============================================================
    /**
     * 从对象中提取头像URL
     * 
     * 【设计思路】
     * 项目中头像可能存储在不同的位置：
     * 1. user.avatar - 用户对象的 avatar 字段
     * 2. user.profile.avatar - 用户对象的 profile 子对象中
     * 3. notification.sender.avatar - 通知对象的发送者头像
     * 4. blog.author.avatar - 博客对象的作者头像
     * 
     * 这个方法按优先级依次检查这些位置
     * 
     * 【参数说明】
     * @param {Object} obj - 用户对象或通知对象
     * @returns {string|null} 头像URL或null
     * 
     * 【对象结构示例】
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
      
      // ─── 优先级1：直接检查 obj.avatar ───
      // trim() 去除首尾空格，避免空字符串被误判
      if (obj.avatar && obj.avatar.trim()) {
        return obj.avatar;
      }
      
      // ─── 优先级2：检查 obj.profile.avatar ───
      // 有些用户对象将头像存储在 profile 子对象中
      if (obj.profile && obj.profile.avatar && obj.profile.avatar.trim()) {
        return obj.profile.avatar;
      }
      
      // ─── 优先级3：检查 obj.sender（通知对象）───
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
      
      // ─── 优先级4：检查 obj.author（博客对象）───
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
      
      // ─── 都没有找到，返回 null ───
      return null;
    },
    
    // ============================================================
    // 【辅助方法：processAvatarUrl】
    // ============================================================
    /**
     * 处理头像URL路径
     * 
     * 【设计思路】
     * 头像URL可能有多种格式：
     * 1. 完整URL：https://example.com/avatar.jpg
     * 2. Data URI：data:image/svg+xml,...
     * 3. 相对路径：/uploads/avatars/123.jpg
     * 4. 无前缀路径：uploads/avatars/123.jpg
     * 
     * 这个方法将所有格式统一处理为可用的URL
     * 
     * 【参数说明】
     * @param {string} url - 原始URL
     * @param {number} size - 头像尺寸（用于默认头像）
     * @returns {string} 处理后的URL
     * 
     * 【URL 格式转换】
     * ┌─────────────────────────────────────────────────────────────────────┐
     * │  输入                              输出                            │
     * │  ──────────────────────────────────────────────────────────────    │
     * │  https://example.com/avatar.jpg  → https://example.com/avatar.jpg  │
     * │  http://example.com/avatar.jpg   → http://example.com/avatar.jpg   │
     * │  data:image/svg+xml,...          → data:image/svg+xml,...          │
     * │  /static/uploads/avatars/123.jpg → /static/uploads/avatars/123.jpg │
     * │  /uploads/avatars/123.jpg        → /static/uploads/avatars/123.jpg │
     * │  uploads/avatars/123.jpg         → /static/uploads/avatars/123.jpg │
     * │  /avatars/123.jpg                → /static/avatars/123.jpg         │
     * │  null/undefined/空字符串         → 默认头像                        │
     * └─────────────────────────────────────────────────────────────────────┘
     */
    processAvatarUrl(url, size = 40) {
      // ─── 步骤1：检查URL是否为空 ───
      if (!url || !url.trim()) {
        return this.getDefaultAvatar('U', size);
      }
      
      // ─── 步骤2：去除首尾空格 ───
      const trimmedUrl = url.trim();
      
      // ─── 步骤3：检查是否为完整URL ───
      // 以 http:// 或 https:// 开头，说明是外部链接
      if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
        return trimmedUrl;
      }
      
      // ─── 步骤4：检查是否为 Data URI ───
      // 以 data: 开头，说明是内嵌数据（如 SVG）
      if (trimmedUrl.startsWith('data:')) {
        return trimmedUrl;
      }
      
      // ─── 步骤5：检查是否已有 /static 前缀 ───
      // 以 /static/ 开头，说明路径已经正确
      if (trimmedUrl.startsWith('/static/')) {
        return trimmedUrl;
      }
      
      // ─── 步骤6：处理 /uploads 开头的路径 ───
      // 数据库存储的是 /uploads/avatars/xxx.jpg
      // 需要添加 /static 前缀变成 /static/uploads/avatars/xxx.jpg
      if (trimmedUrl.startsWith('/uploads/')) {
        return `/static${trimmedUrl}`;
      }
      
      // ─── 步骤7：处理 uploads 开头的路径（无斜杠）───
      // 有些地方可能存储为 uploads/avatars/xxx.jpg
      if (trimmedUrl.startsWith('uploads/')) {
        return `/static/${trimmedUrl}`;
      }
      
      // ─── 步骤8：处理其他以 / 开头的路径 ───
      // 兜底处理，添加 /static 前缀
      if (trimmedUrl.startsWith('/')) {
        return `/static${trimmedUrl}`;
      }
      
      // ─── 步骤9：其他情况，添加完整前缀 ───
      return `/static/${trimmedUrl}`;
    },
    
    // ============================================================
    // 【辅助方法：getDefaultAvatar】
    // ============================================================
    /**
     * 获取默认头像（SVG格式，不依赖外部服务）
     * 
     * 【设计思路】
     * 使用 SVG data URI 生成默认头像：
     * 1. 不依赖外部图片服务
     * 2. 根据用户名生成不同颜色
     * 3. 显示用户名首字母
     * 4. 纯前端生成，无需网络请求
     * 
     * 【参数说明】
     * @param {string} name - 用户名（用于生成首字母和颜色）
     * @param {number} size - 头像尺寸（像素）
     * @returns {string} SVG data URI
     * 
     * 【SVG 结构解析】
     * <svg>
     *   <circle />   <!-- 背景圆 -->
     *   <text />     <!-- 首字母 -->
     * </svg>
     * 
     * 【颜色生成算法】
     * 根据用户名的第一个字符的 Unicode 编码选择颜色
     * 相同用户名总是生成相同颜色
     */
    getDefaultAvatar(name, size = 40) {
      // ─── 步骤1：获取首字母 ───
      // 取用户名的第一个字符，转大写
      // 如果 name 为空，使用 'U'（User 的首字母）
      const initial = (name || 'U').charAt(0).toUpperCase();
      
      // ─── 步骤2：定义颜色数组 ───
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
      
      // ─── 步骤3：计算颜色索引 ───
      // 使用用户名第一个字符的 Unicode 编码对颜色数组长度取模
      // 确保相同用户名总是生成相同颜色
      const colorIndex = (name || '').charCodeAt(0) % colors.length;
      
      // ─── 步骤4：获取颜色 ───
      const color = colors[colorIndex];
      
      // ─── 步骤5：生成 SVG data URI ───
      // data:image/svg+xml, 是 SVG data URI 的前缀
      // %3C 是 < 的 URL 编码
      // %3E 是 > 的 URL 编码
      // encodeURIComponent() 用于编码特殊字符
      return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'%3E%3Ccircle cx='${size/2}' cy='${size/2}' r='${size/2}' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='${size/2}' y='${size*0.65}' font-size='${size*0.5}' text-anchor='middle' fill='white' font-family='Arial'%3E${encodeURIComponent(initial)}%3C/text%3E%3C/svg%3E`;
      
      // ─── SVG 代码解析（解码后）───
      // <svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'>
      //   <!-- 背景圆：填充颜色，半径为 size/2 -->
      //   <circle cx='20' cy='20' r='20' fill='#4CAF50' />
      //   
      //   <!-- 首字母：居中显示，白色，Arial 字体 -->
      //   <text x='20' y='26' font-size='20' text-anchor='middle' fill='white' font-family='Arial'>A</text>
      // </svg>
    },
    
    // ============================================================
    // 【辅助方法：handleAvatarError】
    // ============================================================
    /**
     * 处理图片加载错误
     * 
     * 【使用场景】
     * 当头像图片加载失败时（如文件不存在、网络错误），显示默认头像
     * 
     * 【参数说明】
     * @param {Event} event - 错误事件对象
     *   event.target 是触发错误的 <img> 元素
     * @param {string} name - 用户名（用于生成默认头像）
     * @param {number} size - 头像尺寸
     * 
     * 【使用示例】
     * <img 
     *   :src="getAvatar(user)" 
     *   @error="handleAvatarError($event, user.username)"
     * >
     * 
     * 【工作原理】
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

// ============================================================
// 【面试常问问题】
// ============================================================
// 
// Q1: 什么是 Vue Mixin？有什么优缺点？
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  【定义】                                                               │
// │  Mixin 是一种代码复用机制，可以将组件中可复用的功能提取出来。           │
// │                                                                         │
// │  【优点】                                                               │
// │  1. 代码复用：多个组件共享相同的方法                                    │
// │  2. 维护方便：修改一处，所有使用的地方都生效                            │
// │  3. 关注点分离：将通用功能与业务逻辑分离                                │
// │                                                                         │
// │  【缺点】                                                               │
// │  1. 命名冲突：Mixin 和组件可能有同名方法                                │
// │  2. 隐式依赖：组件依赖 Mixin 的方法，但不明显                           │
// │  3. 调试困难：问题可能出现在 Mixin 中，难以追踪                         │
// │                                                                         │
// │  【Vue 3 替代方案】                                                     │
// │  Vue 3 推荐使用 Composition API（组合式函数）替代 Mixin：               │
// │                                                                         │
// │  // 组合式函数                                                          │
// │  export function useAvatar() {                                         │
// │    const getAvatar = (source, size = 40) => { ... }                    │
// │    return { getAvatar }                                                │
// │  }                                                                      │
// │                                                                         │
// │  // 在组件中使用                                                        │
// │  import { useAvatar } from './useAvatar'                               │
// │  const { getAvatar } = useAvatar()                                     │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// Q2: 如何处理图片加载失败？
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  【方案一：@error 事件】（本文件使用）                                  │
// │  <img :src="avatarUrl" @error="handleAvatarError">                     │
// │  // 当图片加载失败时，触发 error 事件                                   │
// │                                                                         │
// │  【方案二：onerror 属性】                                               │
// │  <img :src="avatarUrl" onerror="this.src='default.jpg'">               │
// │  // 内联处理，简单但不灵活                                              │
// │                                                                         │
// │  【方案三：CSS 背景图】                                                 │
// │  .avatar {                                                              │
// │    background-image: url('default.jpg');                               │
// │  }                                                                      │
// │  <img class="avatar" :src="avatarUrl">                                 │
// │  // 图片加载失败时显示背景图                                            │
// │                                                                         │
// │  【方案四：Object URL】                                                 │
// │  // 预加载图片，失败时使用默认图                                        │
// │  const img = new Image()                                               │
// │  img.onerror = () => { /* 使用默认图 */ }                              │
// │  img.src = avatarUrl                                                   │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// Q3: SVG data URI 有什么优势？
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  【优势】                                                               │
// │  1. 无需网络请求：直接嵌入 HTML，减少 HTTP 请求                         │
// │  2. 可定制：动态生成不同颜色、文字                                      │
// │  3. 矢量图形：任意缩放不失真                                            │
// │  4. 文件小：简单图形的 SVG 体积很小                                     │
// │                                                                         │
// │  【格式】                                                               │
// │  data:image/svg+xml,<SVG代码>                                          │
// │  // 或使用 Base64 编码                                                  │
// │  data:image/svg+xml;base64,<Base64编码的SVG>                           │
// │                                                                         │
// │  【注意事项】                                                           │
// │  1. SVG 代码中的特殊字符需要 URL 编码                                   │
// │  2. 某些浏览器对 data URI 大小有限制                                    │
// │  3. 不适合复杂图形（代码太长）                                          │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// Q4: 为什么使用可选链操作符（?.）？
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  【可选链操作符 ?.】                                                    │
// │  用于安全访问深层属性，避免 "Cannot read property of undefined" 错误    │
// │                                                                         │
// │  【示例】                                                               │
// │  // 传统写法                                                            │
// │  const username = obj && obj.sender && obj.sender.username             │
// │                                                                         │
// │  // 可选链写法                                                          │
// │  const username = obj?.sender?.username                                │
// │  // 如果 obj 或 obj.sender 为 undefined，返回 undefined 而不是报错    │
// │                                                                         │
// │  【本文件使用】                                                         │
// │  source.sender?.username                                               │
// │  // 如果 sender 不存在，返回 undefined                                 │
// │  // 不会抛出 "Cannot read property 'username' of undefined" 错误       │
// │                                                                         │
// │  【浏览器支持】                                                         │
// │  现代浏览器都支持，IE 不支持                                            │
// │  如果需要兼容 IE，需要 Babel 转译                                       │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// Q5: 如何设计一个通用的头像组件？
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  【组件设计】                                                           │
// │  <template>                                                             │
// │    <img                                                                 │
// │      :src="avatarUrl"                                                  │
// │      :style="{ width: size + 'px', height: size + 'px' }"              │
// │      @error="handleError"                                              │
// │    />                                                                   │
// │  </template>                                                            │
// │                                                                         │
// │  <script>                                                               │
// │  export default {                                                       │
// │    name: 'Avatar',                                                     │
// │    props: {                                                            │
// │      source: { type: [Object, String], default: null },                │
// │      size: { type: Number, default: 40 },                              │
// │      name: { type: String, default: 'U' }                              │
// │    },                                                                   │
// │    computed: {                                                          │
// │      avatarUrl() {                                                     │
// │        return this.getAvatar(this.source, this.size)                   │
// │      }                                                                  │
// │    },                                                                   │
// │    methods: {                                                           │
// │      handleError() {                                                   │
// │        // 替换为默认头像                                                │
// │      }                                                                  │
// │    }                                                                    │
// │  }                                                                      │
// │  </script>                                                              │
// │                                                                         │
// │  【使用方式】                                                           │
// │  <Avatar :source="user" :size="50" :name="user.username" />            │
// │  <Avatar :source="notification.sender" />                              │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// ============================================================
