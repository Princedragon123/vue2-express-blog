<!-- 
=============================================================================
  Profile.vue - 个人中心组件（学习版·用户信息展示知识点）
=============================================================================

【组件职责】
  这是用户个人中心页面，负责：
  1. 显示用户个人信息（头像、简介、统计数据）
  2. 显示用户发布的文章列表
  3. 显示用户点赞/收藏的文章
  4. 关注/取消关注功能
  5. 粉丝/关注列表展示

【学习重点】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  1. 路由参数：$route.params 获取用户ID                                  │
  │  2. 条件渲染：v-if/v-else 处理不同状态                                  │
  │  3. 列表渲染：v-for 循环展示文章列表                                    │
  │  4. 事件处理：@click 处理点击事件                                       │
  │  5. 生命周期：created/mounted 初始化数据                                │
  │  6. 监听器：watch 监听路由变化                                          │
  │  7. 异步请求：async/await 处理API调用                                   │
  │  8. 乐观更新：先更新UI再请求API                                         │
  │  9. 权限控制：根据用户身份显示不同内容                                  │
  │  10. 数据缓存：使用 CacheManager 缓存用户信息                           │
  └─────────────────────────────────────────────────────────────────────────┘

【数据流向】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  1. created() → 获取路由参数 userId                                     │
  │  2. mounted() → 调用 fetchUserInfo()                                   │
  │  3. fetchUserInfo() → 请求用户信息API                                   │
  │  4. 更新 userInfo → 触发视图更新                                        │
  │  5. 用户点击关注 → 乐观更新UI → 发送API请求                             │
  │  6. API成功：保持UI状态；API失败：回滚UI状态                            │
  └─────────────────────────────────────────────────────────────────────────┘

=============================================================================
  JavaScript 用户信息展示知识点
=============================================================================

【1. 路由参数获取】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【获取路由参数】                                                        │
  │  // 路由配置：/profile/:userId                                          │
  │  // URL示例：/profile/123                                               │
  │  this.userId = this.$route.params.userId  // 获取到 '123'              │
  │                                                                         │
  │  【获取查询参数】                                                        │
  │  // URL示例：/profile?tab=posts&sort=new                                │
  │  this.$route.query.tab     // 获取到 'posts'                           │
  │  this.$route.query.sort    // 获取到 'new'                             │
  │                                                                         │
  │  【监听路由变化】                                                        │
  │  watch: {                                                               │
  │    '$route.params.userId': {                                           │
  │      handler(newUserId) {                                              │
  │        this.userId = newUserId;                                        │
  │        this.fetchUserInfo();  // 路由变化时重新获取数据                │
  │      },                                                                 │
  │      immediate: true  // 组件创建时立即执行一次                         │
  │    }                                                                    │
  │  }                                                                      │
  │                                                                         │
  │  【面试题】Q: $route 和 $router 有什么区别？                             │
  │  A: $route: 当前路由信息对象（只读）                                    │
  │     $router: 路由实例，用于编程式导航（push、replace等）                │
  │                                                                         │
  │  【面试题】Q: immediate: true 有什么用？                                 │
  │  A: 让 watcher 在组件创建时立即执行一次                                 │
  │     否则只有在值变化时才会执行                                          │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【2. 乐观更新模式】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【什么是乐观更新？】                                                    │
  │  在 API 请求返回之前，先更新 UI，提升用户体验                           │
  │  如果 API 请求失败，再回滚到之前的状态                                  │
  │                                                                         │
  │  【实现步骤】                                                            │
  │  async followUser() {                                                   │
  │    // 1. 保存旧状态                                                     │
  │    const oldIsFollowing = this.isFollowing;                             │
  │    const oldFollowers = this.userInfo.followers;                        │
  │                                                                         │
  │    // 2. 乐观更新：立即修改UI                                           │
  │    this.isFollowing = true;                                             │
  │    this.userInfo.followers++;                                           │
  │                                                                         │
  │    try {                                                                │
  │      // 3. 发送API请求                                                  │
  │      const response = await this.$http.users.follow(userId);           │
  │                                                                         │
  │      if (!response.success) {                                           │
  │        // 4. 失败时回滚                                                 │
  │        this.isFollowing = oldIsFollowing;                               │
  │        this.userInfo.followers = oldFollowers;                          │
  │      }                                                                  │
  │    } catch (error) {                                                    │
  │      // 5. 异常时回滚                                                   │
  │      this.isFollowing = oldIsFollowing;                                 │
  │      this.userInfo.followers = oldFollowers;                            │
  │    }                                                                    │
  │  }                                                                      │
  │                                                                         │
  │  【面试题】Q: 乐观更新有什么优缺点？                                      │
  │  A: 优点：用户体验好，不需要等待网络请求                                │
  │     缺点：如果API失败需要回滚，状态管理复杂                             │
  │     适用：操作成功率高、失败影响小的场景                                │
  │                                                                         │
  │  【面试题】Q: 悲观更新是什么？                                           │
  │  A: 等 API 返回成功后再更新 UI                                          │
  │     优点：状态一致性好                                                  │
  │     缺点：用户体验差，需要等待                                          │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【3. Vue.set 响应式更新】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【问题：Vue 2 的响应式限制】                                            │
  │  // 直接修改对象属性，Vue 无法检测到变化                                │
  │  this.userInfo.followers = 100;  // ❌ 不会触发视图更新                │
  │                                                                         │
  │  // 直接添加新属性，Vue 无法检测到变化                                  │
  │  this.userInfo.newProp = 'value';  // ❌ 不会触发视图更新              │
  │                                                                         │
  │  【解决方案：Vue.set】                                                   │
  │  // 方式1：使用 Vue.set                                                 │
  │  this.$set(this.userInfo, 'followers', 100);  // ✅ 会触发更新         │
  │                                                                         │
  │  // 方式2：使用 Object.assign 创建新对象                                │
  │  this.userInfo = { ...this.userInfo, followers: 100 };  // ✅          │
  │                                                                         │
  │  // 方式3：使用 Vue.set 添加新属性                                      │
  │  this.$set(this.userInfo, 'newProp', 'value');  // ✅                  │
  │                                                                         │
  │  【面试题】Q: 为什么 Vue 2 无法检测到对象属性的新增？                    │
  │  A: Vue 2 使用 Object.defineProperty 劫持属性                          │
  │     只有在初始化时存在的属性才会被劫持                                  │
  │     后添加的属性没有被劫持，所以不是响应式的                            │
  │     Vue 3 使用 Proxy 解决了这个问题                                    │
  │                                                                         │
  │  【面试题】Q: $set 和 Vue.set 有什么区别？                               │
  │  A: 没有区别，this.$set 是 Vue.set 的别名                              │
  │     在组件中使用 this.$set 更方便                                      │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【4. 数据缓存策略】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【为什么需要缓存？】                                                    │
  │  1. 减少网络请求，提升加载速度                                          │
  │  2. 节省服务器资源                                                      │
  │  3. 离线时也能显示缓存数据                                              │
  │                                                                         │
  │  【缓存策略】                                                            │
  │  1. 内存缓存：存储在变量中，页面刷新后失效                              │
  │  2. localStorage：持久化存储，手动清除                                  │
  │  3. sessionStorage：会话存储，关闭标签页后失效                          │
  │  4. IndexedDB：大量数据存储                                             │
  │                                                                         │
  │  【本项目实现】                                                          │
  │  // 读取缓存                                                            │
  │  const cacheKey = `user_info_${userId}`;                               │
  │  const cached = CacheManager.get(cacheKey);                            │
  │  if (cached) {                                                          │
  │    this.userInfo = cached;                                              │
  │    return;  // 使用缓存，不发请求                                       │
  │  }                                                                      │
  │                                                                         │
  │  // 保存缓存                                                            │
  │  CacheManager.set(cacheKey, userData, 5 * 60 * 1000);  // 缓存5分钟    │
  │                                                                         │
  │  // 清除缓存（数据更新后）                                              │
  │  CacheManager.remove(cacheKey);                                        │
  │                                                                         │
  │  【面试题】Q: 什么时候需要清除缓存？                                      │
  │  A: 1. 数据被修改后（如关注用户后）                                     │
  │     2. 缓存过期后                                                       │
  │     3. 用户主动刷新时                                                   │
  │                                                                         │
  │  【面试题】Q: 如何处理缓存和服务器数据不一致？                           │
  │  A: 1. 设置合理的缓存过期时间                                           │
  │     2. 关键操作后主动清除缓存                                           │
  │     3. 提供手动刷新按钮                                                 │
  │     4. 使用 ETag 或 Last-Modified 验证缓存有效性                        │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【5. 权限控制实现】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【权限判断逻辑】                                                        │
  │  // 判断是否是当前用户                                                  │
  │  this.isCurrentUser = (this.userId === 'current' ||                    │
  │                        this.userId === currentUserId);                  │
  │                                                                         │
  │  // 根据权限显示不同内容                                                │
  │  <button v-if="!isCurrentUser" @click="followUser">关注</button>       │
  │  <button v-if="isCurrentUser" @click="editProfile">编辑资料</button>   │
  │                                                                         │
  │  【隐私设置处理】                                                        │
  │  // 用户可能设置了隐私：                                                │
  │  // - 谁可以看我的文章                                                  │
  │  // - 谁可以看我的点赞                                                  │
  │  // - 谁可以看我的收藏                                                  │
  │                                                                         │
  │  try {                                                                  │
  │    const response = await this.$http.users.getLikedPosts(userId);      │
  │  } catch (error) {                                                      │
  │    if (error.response.status === 403) {                                 │
  │      this.likesPrivacyDenied = true;  // 显示无权限提示                │
  │    }                                                                    │
  │  }                                                                      │
  │                                                                         │
  │  【面试题】Q: 前端权限控制和后端权限控制哪个更重要？                     │
  │  A: 后端权限控制更重要！                                                │
  │     前端权限控制只是为了用户体验（隐藏按钮等）                          │
  │     前端可以被绑过，真正的安全必须由后端保证                            │
  │                                                                         │
  │  【面试题】Q: 如何设计权限系统？                                         │
  │  A: 1. RBAC（基于角色的访问控制）                                       │
  │     2. 用户 → 角色 → 权限                                              │
  │     3. 每个接口检查用户是否有对应权限                                  │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【6. 关注系统设计】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【数据模型】                                                            │
  │  // 用户表                                                              │
  │  User {                                                                 │
  │    _id: String,                                                         │
  │    username: String,                                                    │
  │    following: [userId],      // 我关注的人                             │
  │    followers: [userId],      // 关注我的人                             │
  │    followingCount: Number,   // 关注数                                 │
  │    followersCount: Number    // 粉丝数                                 │
  │  }                                                                      │
  │                                                                         │
  │  // 关注关系表（更优方案）                                              │
  │  Follow {                                                               │
  │    follower: userId,     // 关注者                                     │
  │    following: userId,    // 被关注者                                   │
  │    createdAt: Date       // 关注时间                                   │
  │  }                                                                      │
  │                                                                         │
  │  【关注状态判断】                                                        │
  │  // 单向关注：我关注了他，他没关注我                                    │
  │  isFollowing = true, isMutualFollowing = false                         │
  │                                                                         │
  │  // 相互关注：我关注了他，他也关注我                                    │
  │  isFollowing = true, isMutualFollowing = true                          │
  │                                                                         │
  │  // 未关注                                                              │
  │  isFollowing = false                                                    │
  │                                                                         │
  │  【面试题】Q: 关注列表和粉丝列表如何分页？                               │
  │  A: 使用 skip 和 limit                                                 │
  │     const followers = await Follow.find({ following: userId })         │
  │       .skip((page - 1) * limit)                                        │
  │       .limit(limit)                                                    │
  │       .populate('follower');                                           │
  │                                                                         │
  │  【面试题】Q: 如何优化大用户的关注列表查询？                             │
  │  A: 1. 使用 Redis 缓存                                                 │
  │     2. 使用游标分页代替 skip                                           │
  │     3. 只存储最近 N 个关注者                                           │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

=============================================================================
  HTML 结构知识点
=============================================================================

【1. 个人信息卡片布局】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【布局结构】                                                            │
  │  ┌──────────────────────────────────────────────────────────┐          │
  │  │  profile-cover（封面图）                                  │          │
  │  │  ┌────────────────────────────────────────────────────┐  │          │
  │  │  │  profile-avatar-container（头像容器）              │  │          │
  │  │  │  ┌──────────────────────────────────────────────┐  │  │          │
  │  │  │  │  profile-avatar（头像）                      │  │  │          │
  │  │  │  └──────────────────────────────────────────────┘  │  │          │
  │  │  └────────────────────────────────────────────────────┘  │          │
  │  └──────────────────────────────────────────────────────────┘          │
  │  ┌──────────────────────────────────────────────────────────┐          │
  │  │  profile-info（用户信息）                                 │          │
  │  │  - 用户名、简介、位置、职业、网站                        │          │
  │  │  - 关注按钮                                              │          │
  │  │  - 统计数据（文章、关注、粉丝、获赞）                    │          │
  │  └──────────────────────────────────────────────────────────┘          │
  │                                                                         │
  │  【头像定位技巧】                                                        │
  │  .profile-cover {                                                       │
  │    position: relative;        // 父元素相对定位                        │
  │    height: 200px;                                                       │
  │  }                                                                      │
  │  .profile-avatar-container {                                           │
  │    position: absolute;        // 子元素绝对定位                        │
  │    bottom: -50px;             // 向下偏移，一半在封面外                │
  │    left: 20px;                                                          │
  │  }                                                                      │
  │  .profile-avatar {                                                      │
  │    width: 100px;                                                        │
  │    height: 100px;                                                       │
  │    border: 4px solid white;   // 白色边框                              │
  │    border-radius: 50%;        // 圆形                                  │
  │  }                                                                      │
  │                                                                         │
  │  【面试题】Q: 为什么头像要一半在封面外？                                 │
  │  A: 视觉设计考虑，让封面和头像有层次感                                  │
  │     同时头像不会被封面遮挡                                              │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【2. 统计数据展示】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【HTML 结构】                                                           │
  │  <div class="profile-stats">                                            │
  │    <div class="stat-item" @click="showPosts">                           │
  │      <span class="stat-count">{{ userInfo.posts }}</span>              │
  │      <span class="stat-label">攻略</span>                              │
  │    </div>                                                               │
  │    <div class="stat-item" @click="showFollowing">                       │
  │      <span class="stat-count">{{ userInfo.following }}</span>          │
  │      <span class="stat-label">关注</span>                              │
  │    </div>                                                               │
  │    <div class="stat-item" @click="showFollowers">                       │
  │      <span class="stat-count">{{ userInfo.followers }}</span>          │
  │      <span class="stat-label">粉丝</span>                              │
  │    </div>                                                               │
  │  </div>                                                                 │
  │                                                                         │
  │  【CSS 样式】                                                            │
  │  .profile-stats {                                                       │
  │    display: flex;             // 弹性布局                              │
  │    gap: 20px;                 // 间距                                  │
  │    justify-content: center;   // 居中                                  │
  │  }                                                                      │
  │  .stat-item {                                                           │
  │    text-align: center;                                                 │
  │    cursor: pointer;          // 可点击                                 │
  │    padding: 10px 20px;                                                 │
  │    border-radius: 8px;                                                 │
  │    transition: background 0.3s;                                        │
  │  }                                                                      │
  │  .stat-item:hover {                                                    │
  │    background: #fce7f3;       // 悬停背景                              │
  │  }                                                                      │
  │  .stat-count {                                                          │
  │    display: block;            // 独占一行                              │
  │    font-size: 24px;           // 大字体                                │
  │    font-weight: bold;                                                  │
  │    color: #ec4899;            // 粉色                                  │
  │  }                                                                      │
  │  .stat-label {                                                          │
  │    font-size: 14px;                                                    │
  │    color: #666;                                                        │
  │  }                                                                      │
  │                                                                         │
  │  【面试题】Q: 如何格式化数字显示（如 1.2万）？                          │
  │  A: function formatNumber(num) {                                       │
  │       if (num >= 10000) return (num / 10000).toFixed(1) + '万';        │
  │       if (num >= 1000) return (num / 1000).toFixed(1) + 'k';           │
  │       return num.toString();                                           │
  │     }                                                                   │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【3. 标签页导航】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【HTML 结构】                                                           │
  │  <div class="profile-tabs">                                             │
  │    <button                                                              │
  │      class="tab-item"                                                   │
  │      :class="{ active: activeTab === 'posts' }"                        │
  │      @click="switchTab('posts')"                                       │
  │    >                                                                    │
  │      我的发布                                                           │
  │    </button>                                                            │
  │    <button                                                              │
  │      class="tab-item"                                                   │
  │      :class="{ active: activeTab === 'likes' }"                        │
  │      @click="switchTab('likes')"                                       │
  │    >                                                                    │
  │      我的点赞                                                           │
  │    </button>                                                            │
  │  </div>                                                                 │
  │                                                                         │
  │  【CSS 样式】                                                            │
  │  .tab-item {                                                            │
  │    padding: 12px 24px;                                                 │
  │    border: none;                                                       │
  │    background: transparent;                                            │
  │    cursor: pointer;                                                    │
  │    border-bottom: 2px solid transparent;  // 默认无边框                │
  │    transition: all 0.3s;                                               │
  │  }                                                                      │
  │  .tab-item.active {                                                    │
  │    color: #ec4899;            // 激活状态文字颜色                      │
  │    border-bottom-color: #ec4899;  // 底部边框                          │
  │    font-weight: bold;                                                  │
  │  }                                                                      │
  │                                                                         │
  │  【懒加载实现】                                                          │
  │  switchTab(tabName) {                                                  │
  │    this.activeTab = tabName;                                           │
  │    // 只有切换到该标签页时才加载数据                                   │
  │    if (tabName === 'likes' && this.likedPosts.length === 0) {         │
  │      this.fetchLikedPosts();                                           │
  │    }                                                                    │
  │  }                                                                      │
  │                                                                         │
  │  【面试题】Q: 为什么要懒加载标签页数据？                                 │
  │  A: 1. 减少初始加载时间                                                │
  │     2. 节省服务器资源                                                  │
  │     3. 用户可能不会查看所有标签页                                      │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

=============================================================================
  CSS 样式知识点
=============================================================================

【1. 封面图与头像叠加效果】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【实现效果】                                                            │
  │  ┌────────────────────────────────────────┐                            │
  │  │  封面图（背景）                         │                            │
  │  │                                        │                            │
  │  │      ┌─────────┐                       │                            │
  │  │      │  头像   │  ← 一半在封面外       │                            │
  │  │      └─────────┘                       │                            │
  │  └────────────────────────────────────────┘                            │
  │                                                                         │
  │  【CSS 实现】                                                            │
  │  .profile-cover {                                                       │
  │    position: relative;        // 为头像提供定位基准                    │
  │    height: 200px;                                                       │
  │    overflow: visible;         // 允许头像溢出显示                      │
  │  }                                                                      │
  │  .cover-img {                                                           │
  │    width: 100%;               // 全宽                                  │
  │    height: 100%;                                                        │
  │    object-fit: cover;         // 保持比例裁剪                          │
  │  }                                                                      │
  │  .profile-avatar-container {                                           │
  │    position: absolute;        // 绝对定位                              │
  │    bottom: -50px;             // 向下偏移                              │
  │    left: 20px;                                                          │
  │  }                                                                      │
  │  .profile-avatar {                                                      │
  │    width: 100px;                                                        │
  │    height: 100px;                                                       │
  │    border-radius: 50%;        // 圆形                                  │
  │    border: 4px solid white;   // 白色边框                              │
  │    box-shadow: 0 4px 12px rgba(0,0,0,0.1);  // 阴影                    │
  │  }                                                                      │
  │                                                                         │
  │  【面试题】Q: object-fit: cover 和 background-size: cover 区别？        │
  │  A: object-fit 用于 img/video 元素                                     │
  │     background-size 用于背景图片                                       │
  │     效果相同，但使用场景不同                                            │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【2. 关注按钮状态样式】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【三种状态】                                                            │
  │  1. 未关注：粉色背景，白色文字                                          │
  │  2. 已关注：白色背景，粉色边框                                          │
  │  3. 相互关注：特殊样式                                                  │
  │                                                                         │
  │  【CSS 实现】                                                            │
  │  .btn-follow {                // 未关注                                │
  │    background: linear-gradient(135deg, #ec4899, #f472b6);              │
  │    color: white;                                                        │
  │    border: none;                                                        │
  │  }                                                                      │
  │  .btn-unfollow {             // 已关注                                 │
  │    background: white;                                                   │
  │    color: #ec4899;                                                      │
  │    border: 2px solid #ec4899;                                          │
  │  }                                                                      │
  │  .btn-unfollow:hover {       // 悬停时显示"取消关注"                   │
  │    background: #fce7f3;                                                 │
  │  }                                                                      │
  │                                                                         │
  │  【动态类名绑定】                                                        │
  │  <button                                                                │
  │    :class="[                                                            │
  │      'btn-primary',                                                     │
  │      isFollowing ? 'btn-unfollow' : 'btn-follow'                       │
  │    ]"                                                                   │
  │  >                                                                      │
  │    {{ isMutualFollowing ? '相互关注' : isFollowing ? '已关注' : '关注' }}│
  │  </button>                                                              │
  │                                                                         │
  │  【面试题】Q: 如何实现悬停时显示"取消关注"？                             │
  │  A: 使用 CSS :hover 伪类 + attr() 函数                                 │
  │     <button data-text="取消关注">已关注</button>                       │
  │     .btn-unfollow:hover::after {                                       │
  │       content: attr(data-text);                                        │
  │     }                                                                   │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【3. 模态框样式】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【粉丝/关注列表模态框】                                                 │
  │  .modal-overlay {             // 遮罩层                                │
  │    position: fixed;                                                     │
  │    top: 0;                                                              │
  │    left: 0;                                                             │
  │    width: 100%;                                                         │
  │    height: 100%;                                                        │
  │    background: rgba(0, 0, 0, 0.5);  // 半透明黑色                      │
  │    display: flex;                                                       │
  │    justify-content: center;                                            │
  │    align-items: center;                                                │
  │    z-index: 1000;             // 最上层                                │
  │  }                                                                      │
  │  .modal-content {             // 模态框内容                            │
  │    background: white;                                                   │
  │    border-radius: 12px;                                                 │
  │    max-width: 500px;                                                    │
  │    max-height: 80vh;                                                    │
  │    overflow-y: auto;          // 内容过多时滚动                        │
  │    animation: slideUp 0.3s ease;  // 弹出动画                          │
  │  }                                                                      │
  │  @keyframes slideUp {                                                  │
  │    from {                                                               │
  │      opacity: 0;                                                        │
  │      transform: translateY(20px);                                      │
  │    }                                                                    │
  │    to {                                                                 │
  │      opacity: 1;                                                        │
  │      transform: translateY(0);                                         │
  │    }                                                                    │
  │  }                                                                      │
  │                                                                         │
  │  【面试题】Q: 如何点击遮罩层关闭模态框？                                 │
  │  A: <div class="modal-overlay" @click="closeModal">                    │
  │       <div class="modal-content" @click.stop>  // 阻止冒泡             │
  │         ...                                                             │
  │       </div>                                                            │
  │     </div>                                                              │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【4. 空状态设计】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【空状态组件】                                                          │
  │  <div class="empty-state">                                              │
  │    <span class="nav-icon">📄</span>                                     │
  │    <h3>暂无发布</h3>                                                   │
  │    <p>快去发布你的第一篇攻略吧</p>                                      │
  │    <button class="btn-primary" @click="goToCreate">发布攻略</button>   │
  │  </div>                                                                 │
  │                                                                         │
  │  【CSS 样式】                                                            │
  │  .empty-state {                                                         │
  │    text-align: center;                                                 │
  │    padding: 60px 20px;                                                 │
  │    color: #999;                                                        │
  │  }                                                                      │
  │  .empty-state .nav-icon {                                              │
  │    font-size: 4rem;           // 大图标                               │
  │    opacity: 0.5;              // 半透明                               │
  │  }                                                                      │
  │  .empty-state h3 {                                                     │
  │    margin: 20px 0 10px;                                                │
  │    color: #666;                                                        │
  │  }                                                                      │
  │  .empty-state p {                                                      │
  │    margin-bottom: 20px;                                                │
  │  }                                                                      │
  │                                                                         │
  │  【面试题】Q: 为什么要设计空状态？                                       │
  │  A: 1. 避免空白页面让用户困惑                                          │
  │     2. 引导用户进行下一步操作                                          │
  │     3. 提升用户体验                                                    │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

=============================================================================
  面试题汇总
=============================================================================

【路由相关】
  Q1: 如何实现路由守卫？
  A: router.beforeEach((to, from, next) => {
       if (to.meta.requiresAuth && !isAuthenticated()) {
         next('/login');
       } else {
         next();
       }
     });

  Q2: 如何实现路由懒加载？
  A: const Profile = () => import('./views/Profile.vue')
     这样只有访问该路由时才加载组件

【状态管理相关】
  Q3: 关注状态应该存在哪里？
  A: 1. 组件内部：简单场景
     2. Vuex/Pinia：多个组件共享
     3. 服务器：持久化存储

  Q4: 如何处理关注/取消关注的并发问题？
  A: 1. 使用防抖，避免快速点击
     2. 使用 loading 状态禁用按钮
     3. 后端使用乐观锁或队列

【性能优化】
  Q5: 如何优化大量粉丝列表的渲染？
  A: 1. 虚拟滚动
     2. 分页加载
     3. 图片懒加载
     4. 使用 Object.freeze 冻结数据

  Q6: 如何避免重复请求用户信息？
  A: 1. 使用缓存
     2. 使用 Vuex 存储已加载的用户
     3. 请求前检查是否正在请求

=============================================================================
-->
<template>
  <div class="profile-page">
    
    <!-- 通知提示 -->
    <!-- :class 动态绑定多个class -->
    <div class="notification" :class="[notification.type, { 'show': notification.show }]">
      <i class="fas" :class="notification.type === 'success' ? 'fa-check-circle' : notification.type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'"></i>
      <span>{{ notification.message }}</span>
    </div>
    
    <!-- 主内容区 -->
    <main class="main-content">
      <div class="container">
        <!-- 错误提示 -->
        <div v-if="error" class="error-message">
          <p>{{ error }}</p>
          <button class="btn-primary" @click="fetchUserInfo">重新加载</button>
        </div>
        
        <!-- 加载状态 -->
        <div v-else-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>
        
        <!-- 个人信息头部 -->
        <div v-else class="profile-header">
          <div class="profile-cover" 
               @mousemove="handleCoverMouseMove" 
               @mouseleave="handleCoverMouseLeave"
               :style="coverStyle">
            <!-- 使用背景图方式 -->
            <div class="cover-background" :style="coverImageStyle"></div>
          </div>
          <div class="profile-avatar-container">
            <!-- @error 图片加载失败时的处理 -->
            <img v-lazy="getAuthorAvatar(userInfo.avatar, 100)" alt="用户头像" class="profile-avatar" @error="onAvatarError">
          </div>
          <div class="profile-info">
              <div class="profile-name">{{ userInfo.username }}</div>
              <div class="profile-bio">{{ userInfo.bio }}</div>
              <!-- 显示用户的个人信息 -->
              <div class="profile-details" v-if="userInfo.location || userInfo.website || userInfo.occupation">
                <div class="detail-item" v-if="userInfo.location">
                  <span class="nav-icon">📍</span>
                  <span>{{ userInfo.location }}</span>
                </div>
                <div class="detail-item" v-if="userInfo.occupation">
                  <span class="nav-icon">💼</span>
                  <span>{{ userInfo.occupation }}</span>
                </div>
                <div class="detail-item" v-if="userInfo.website">
                  <span class="nav-icon">🌐</span>
                  <a :href="userInfo.website" target="_blank" rel="noopener noreferrer">{{ userInfo.website }}</a>
                </div>
              </div>
              <div class="profile-actions">
              <!-- 关注按钮 -->
              <!-- 条件渲染：只有非当前用户才显示关注按钮 -->
              <button 
                v-if="!isCurrentUser"
                :class="['btn-primary', isFollowing ? 'btn-unfollow' : 'btn-follow']"
                @click="isFollowing ? unfollowUser() : followUser()"
              >
                {{ isMutualFollowing ? '相互关注' : isFollowing ? '已关注' : '关注' }}
              </button>
            </div>
            
            <!-- 确认对话框 -->
            <div v-if="showConfirmDialog" class="confirm-dialog-overlay" @click="showConfirmDialog = false">
              <div class="confirm-dialog" @click.stop>
                <h3>确认操作</h3>
                <p>确定要跳转到我的创作页面吗？</p>
                <div class="confirm-dialog-buttons">
                  <button class="btn-secondary" @click="showConfirmDialog = false">取消</button>
                  <button class="btn-primary" @click="navigateToCreation">确定</button>
                </div>
              </div>
            </div>
            
            <!-- 统计数据 -->
            <div class="profile-stats">
              <div class="stat-item">
                <span class="stat-count">{{ userInfo.posts }}</span>
                <span class="stat-label">攻略</span>
              </div>
              <!-- @click 点击查看关注列表 -->
              <div class="stat-item" @click="showFollowingList">
                <span class="stat-count">{{ userInfo.following }}</span>
                <span class="stat-label">关注</span>
              </div>
              <!-- @click 点击查看粉丝列表 -->
              <div class="stat-item" @click="showFollowersList">
                <span class="stat-count">{{ userInfo.followers }}</span>
                <span class="stat-label">粉丝</span>
              </div>
              <div class="stat-item">
                <span class="stat-count">{{ userInfo.likes }}</span>
                <span class="stat-label">获赞</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 标签页导航 - 仅在获取用户信息成功后显示 -->
        <div v-if="!error && !isLoading" class="profile-tabs">
          <!-- 
            :class="{ active: activeTab === 'posts' }"
            动态绑定class，当 activeTab 等于 'posts' 时添加 active 类
          -->
          <button 
            class="tab-item" 
            :class="{ active: activeTab === 'posts' }"
            @click="switchTab('posts')"
          >
            <span class="nav-icon">📝</span>
            <span>{{ isCurrentUser ? '我的发布' : '发布的攻略' }}</span>
          </button>
          <!-- 点赞和收藏标签 - 对所有用户可见 -->
          <button 
            class="tab-item"
            :class="{ active: activeTab === 'likes' }"
            @click="switchTab('likes')"
          >
            <span class="nav-icon">❤️</span>
            <span>{{ isCurrentUser ? '我的点赞' : '他的点赞' }}</span>
          </button>
          <button 
            class="tab-item"
            :class="{ active: activeTab === 'bookmarks' }"
            @click="switchTab('bookmarks')"
          >
            <span class="nav-icon">📌</span>
            <span>{{ isCurrentUser ? '我的收藏' : '他的收藏' }}</span>
          </button>
          <!-- 仅当前用户显示设置标签 -->
          <button 
            v-if="isCurrentUser"
            class="tab-item"
            @click="$router.push('/my-profile')"
          >
            <span class="nav-icon">⚙️</span>
            <span>设置</span>
          </button>
        </div>
        
        <!-- 标签页内容 -->
        <div v-if="!error && !isLoading" class="profile-tab-content">
          <!-- 发布的攻略内容 -->
          <div v-if="activeTab === 'posts'" class="my-posts">
            <!-- 隐私权限提示 -->
            <div v-if="postsPrivacyDenied" class="empty-state">
              <span class="nav-icon">🔒</span>
              <h3>无法查看</h3>
              <p>由于对方隐私设置，你没有权限查看该用户的文章</p>
            </div>
            <!-- 文章列表 -->
            <div v-else-if="userPosts.length > 0" class="blog-cards-grid">
              <!-- v-for 循环渲染文章卡片 -->
              <div class="blog-card" v-for="blog in userPosts" :key="blog._id || blog.id" @click="goToBlogDetail(blog._id || blog.id)">
                <div class="card-image">
                  <img v-lazy="blog.image" :alt="blog.title" class="card-img">
                </div>
                <div class="card-content">
                  <h3 class="card-title">{{ blog.title }}</h3>
                  <div class="card-stats">
                    <div class="stat-item">
                      <span class="nav-icon">❤️</span>
                      <span>{{ blog.likes }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="nav-icon">💬</span>
                      <span>{{ blog.comments }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="nav-icon">📌</span>
                      <span>{{ blog.bookmarks }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 空发布状态 -->
            <div v-else class="empty-state">
              <span class="nav-icon">📄</span>
              <h3>暂无发布</h3>
              <p>{{ isCurrentUser ? '快去发布你的第一篇攻略吧' : '该用户还没有发布任何攻略' }}</p>
              <button v-if="isCurrentUser" class="btn-primary" @click="$router.push('/create')">
                发布攻略
              </button>
            </div>
          </div>
          
          <!-- 点赞内容 -->
          <div v-else-if="activeTab === 'likes'" class="my-likes">
            <!-- 隐私权限提示 -->
            <div v-if="likesPrivacyDenied" class="empty-state">
              <span class="nav-icon">🔒</span>
              <h3>无法查看</h3>
              <p>由于对方隐私设置，你没有权限查看该用户的点赞记录</p>
            </div>
            <div v-else-if="likedPosts.length > 0" class="blog-cards-grid">
              <!-- 点赞的攻略卡片 -->
              <div class="blog-card" v-for="blog in likedPosts" :key="blog._id || blog.id" @click="goToBlogDetail(blog._id || blog.id)">
                <div class="card-image">
                  <img v-lazy="blog.image" :alt="blog.title" class="card-img">
                </div>
                <div class="card-content">
                  <h3 class="card-title">{{ blog.title }}</h3>
                  <div class="card-meta">
                    <span class="author-name">{{ blog.author }}</span>
                    <span class="post-date">{{ formatDate(blog.date) }}</span>
                  </div>
                  <div class="card-stats">
                    <div class="stat-item">
                      <span class="nav-icon">❤️</span>
                      <span>{{ blog.likes }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="nav-icon">💬</span>
                      <span>{{ blog.comments }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 空点赞状态 -->
            <div v-else class="empty-state">
              <span class="nav-icon">❤️</span>
              <h3>暂无点赞</h3>
              <p>{{ isCurrentUser ? '快去点赞你喜欢的攻略吧' : '该用户还没有点赞任何攻略' }}</p>
              <button class="btn-primary" @click="$router.push('/blog')">
                浏览攻略
              </button>
            </div>
          </div>
          
          <!-- 收藏内容 -->
          <div v-else-if="activeTab === 'bookmarks'" class="my-bookmarks">
            <!-- 隐私权限提示 -->
            <div v-if="bookmarksPrivacyDenied" class="empty-state">
              <span class="nav-icon">🔒</span>
              <h3>无法查看</h3>
              <p>由于对方隐私设置，你没有权限查看该用户的收藏记录</p>
            </div>
            <div v-else-if="bookmarkedPosts.length > 0" class="blog-cards-grid">
              <!-- 收藏的攻略卡片 -->
              <div class="blog-card" v-for="blog in bookmarkedPosts" :key="blog._id || blog.id" @click="goToBlogDetail(blog._id || blog.id)">
                <div class="card-image">
                  <img v-lazy="blog.image" :alt="blog.title" class="card-img">
                </div>
                <div class="card-content">
                  <h3 class="card-title">{{ blog.title }}</h3>
                  <div class="card-meta">
                    <span class="author-name">{{ blog.author }}</span>
                    <span class="post-date">{{ formatDate(blog.date) }}</span>
                  </div>
                  <div class="card-stats">
                    <div class="stat-item">
                      <span class="nav-icon">❤️</span>
                      <span>{{ blog.likes }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="nav-icon">💬</span>
                      <span>{{ blog.comments }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 空收藏状态 -->
            <div v-else class="empty-state">
              <span class="nav-icon">📌</span>
              <h3>暂无收藏</h3>
              <p>{{ isCurrentUser ? '快去收藏你喜欢的攻略吧' : '该用户还没有收藏任何攻略' }}</p>
              <button class="btn-primary" @click="$router.push('/blog')">
                浏览攻略
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
    
    <!-- 底部导航栏 -->
    <MobileBottomNav />
    
    <!-- 粉丝/关注列表模态框 -->
    <div v-if="showSocialListModal" class="modal-overlay" @click="closeSocialListModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ socialListTitle }}</h3>
          <button class="modal-close-btn" @click="closeSocialListModal">
            <span class="nav-icon">❌</span>
          </button>
        </div>
        <div class="modal-body">
          <!-- 加载状态 -->
          <div v-if="socialListLoading" class="loading-state">
            <div class="spinner"></div>
            <p>加载中...</p>
          </div>
          
          <!-- 错误提示 -->
          <div v-else-if="socialListError" class="error-message">
            <p>{{ socialListError }}</p>
            <button class="btn-primary" @click="fetchSocialList">重新加载</button>
          </div>
          
          <!-- 列表内容 -->
          <div v-else>
            <div v-if="socialList.length === 0" class="empty-state">
              <span class="nav-icon">{{ socialListType === 'followers' ? '👥' : '➕' }}</span>
              <p>{{ socialListType === 'followers' ? '暂无粉丝' : '暂无关注' }}</p>
            </div>
            
            <div class="user-list">
              <div class="user-item" v-for="user in socialList" :key="user._id">
                <div class="user-info">
                  <img v-lazy="getAuthorAvatar(user.profile?.avatar, 40) || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20portrait&image_size=square'" alt="用户头像" class="user-avatar">
                  <div class="user-details">
                    <div class="user-name">{{ user.username }}</div>
                    <div class="user-bio">{{ user.profile?.bio || '' }}</div>
                  </div>
                </div>
                <button 
                  v-if="user._id !== userInfo._id"
                  :class="['btn-primary', user.isFollowing ? 'btn-unfollow' : 'btn-follow']"
                  @click="toggleFollow(user)"
                >
                  {{ user.isFollowing && user.isMutualFollowing ? '相互关注' : user.isFollowing ? '已关注' : '关注' }}
                </button>
              </div>
            </div>
            
            <!-- 加载更多 -->
            <div v-if="hasMore && socialList.length > 0" class="load-more-container">
              <button class="btn-primary" @click="loadMore" :disabled="socialListLoading">
                <span v-if="socialListLoading" class="nav-icon">🔄</span>
                {{ socialListLoading ? '加载中...' : '加载更多' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import MobileBottomNav from './MobileBottomNav.vue';
import CacheManager from '../utils/cache';
import { getAuthorAvatar } from '../utils/avatarUtils';
import { showNotification } from '../utils/notification';

export default {
  name: 'Profile',
  
  // ============================================================
  // components 组件注册
  // ============================================================
  components: {
    MobileBottomNav
  },
  
  // ============================================================
  // metaInfo 元信息（SEO优化）
  // ============================================================
  metaInfo() {
    return {
      title: `${this.userInfo.username || '用户'}的个人资料`,
      meta: [
        { name: 'description', content: this.userInfo.bio || `${this.userInfo.username || '用户'}的个人博客资料页` },
        { name: 'keywords', content: `${this.userInfo.username || '用户'},个人资料,博客` }
      ]
    };
  },
  
  // ============================================================
  // data 数据区
  // ============================================================
  data() {
    return {
      // 【userId】
      // 类型：String | null
      // 作用：存储当前查看的用户ID
      // 来源：从路由参数获取，'current' 表示当前登录用户
      userId: null,
      
      // 【userInfo】
      // 类型：Object
      // 作用：存储用户详细信息
      // 数据结构：{ _id, username, avatar, bio, posts, following, followers, likes }
      userInfo: {
        _id: '',
        username: '用户名',
        avatar: '/static/images/default-avatar.png',
        bio: '分享我的攻略经验，记录生活中的美好瞬间',
        posts: 0,
        following: 0,
        followers: 0,
        likes: 0
      },
      
      // 【userPosts】
      // 类型：Array
      // 作用：存储用户发布的文章列表
      userPosts: [],
      
      // 【isLoading】
      // 类型：Boolean
      // 作用：标记是否正在加载数据
      isLoading: false,
      
      // 【error】
      // 类型：String | null
      // 作用：存储错误信息
      error: null,
      
      // 【isCurrentUser】
      // 类型：Boolean
      // 作用：标记当前查看的是否是自己的主页
      isCurrentUser: true,
      
      // 【isFollowing】
      // 类型：Boolean
      // 作用：标记当前用户是否已关注该用户
      isFollowing: false,
      
      // 【isMutualFollowing】
      // 类型：Boolean
      // 作用：标记是否相互关注
      isMutualFollowing: false,
      
      // 【showConfirmDialog】
      // 类型：Boolean
      // 作用：控制确认对话框的显示
      showConfirmDialog: false,
      
      // 【activeTab】
      // 类型：String
      // 作用：当前激活的标签页
      // 可能的值：'posts', 'likes', 'bookmarks'
      activeTab: 'posts',
      
      // 点赞和收藏数据
      likedPosts: [],
      bookmarkedPosts: [],
      
      // 粉丝/关注列表相关
      showSocialListModal: false,
      socialListType: 'followers',
      socialListTitle: '',
      socialList: [],
      socialListLoading: false,
      socialListError: null,
      currentPage: 1,
      hasMore: true,
      
      // 通知相关数据
      notification: {
        show: false,
        message: '',
        type: 'success'
      },
      
      // 隐私权限状态
      likesPrivacyDenied: false,
      bookmarksPrivacyDenied: false,
      postsPrivacyDenied: false,
      
      // 封面图鼠标跟随效果
      coverMouseX: 0.5,
      coverMouseY: 0.5
    };
  },
  
  // ============================================================
  // computed 计算属性
  // ============================================================
  computed: {
    // 封面图背景样式
    coverStyle() {
      return {
        '--mouse-x': this.coverMouseX,
        '--mouse-y': this.coverMouseY
      };
    },
    
    // 封面图片样式
    coverImageStyle() {
      const coverImage = this.userInfo.coverImage || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=profile%20cover%20image%20for%20blog%20user&image_size=landscape_16_9';
      return {
        backgroundImage: `url(${coverImage})`,
        backgroundPosition: `calc((var(--mouse-x) - 0.5) * 20% + 50%) calc((var(--mouse-y) - 0.5) * 20% + 50%)`,
        backgroundSize: 'cover'
      };
    }
  },
  
  // ============================================================
  // created 生命周期钩子
  // ============================================================
  // 【作用】组件创建时执行
  // 【时机】在 mounted 之前执行
  // 【用途】获取路由参数
  // ============================================================
  created() {
    this.userId = this.$route.params.userId || 'current';
  },
  
  // ============================================================
  // mounted 生命周期钩子
  // ============================================================
  // 【作用】组件挂载后执行
  // 【时机】DOM 渲染完成后执行
  // 【用途】发起API请求获取数据
  // ============================================================
  mounted() {
    this.fetchUserInfo();
  },
  
  // ============================================================
  // watch 监听器
  // ============================================================
  // 【作用】监听数据变化并执行相应操作
  // 【场景】路由参数变化时重新获取数据
  // ============================================================
  watch: {
    '$route.params.userId': {
      handler(newUserId) {
        this.userId = newUserId || 'current';
        this.fetchUserInfo();
      },
      immediate: true
    },
    '$route': {
      handler(newRoute) {
        this.userId = newRoute.params.userId || 'current';
        this.fetchUserInfo();
      },
      immediate: true
    }
  },
  
  // ============================================================
  // methods 方法区
  // ============================================================
  methods: {
    // 获取作者头像 URL
    getAuthorAvatar(author, size = 40) {
      return getAuthorAvatar(author, size);
    },
    
    // ============================================================
    // 封面图片鼠标跟随效果
    // ============================================================
    // 【作用】实现封面图片跟随鼠标位置微偏移的视差效果
    // 【原理】计算鼠标在元素上的百分比位置，动态调整背景位置
    // ============================================================
    handleCoverMouseMove(e) {
      const cover = e.currentTarget;
      const rect = cover.getBoundingClientRect();
      
      // 计算鼠标位置的百分比（0-1 之间）
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      
      // 更新响应式数据
      this.coverMouseX = x;
      this.coverMouseY = y;
    },
    
    handleCoverMouseLeave(e) {
      // 恢复中心位置
      this.coverMouseX = 0.5;
      this.coverMouseY = 0.5;
    },
    
    // ============================================================
    // 格式化日期
    // ============================================================
    // 【作用】将日期字符串格式化为可读格式
    // 【参数】dateString：日期字符串
    // 【返回值】格式化后的日期字符串
    // ============================================================
    formatDate(dateString) {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    },
    
    // ============================================================
    // 切换标签页
    // ============================================================
    // 【作用】切换当前显示的标签页内容
    // 【参数】tabName：标签页名称
    // ============================================================
    switchTab(tabName) {
      if (!this.isCurrentUser && tabName === 'settings') {
        return;
      }
      
      this.activeTab = tabName;
      
      // 懒加载：切换到对应标签页时才加载数据
      if (tabName === 'likes' && this.likedPosts.length === 0) {
        this.fetchLikedPosts();
      } else if (tabName === 'bookmarks' && this.bookmarkedPosts.length === 0) {
        this.fetchBookmarkedPosts();
      }
    },
    
    // 确认创建
    confirmCreate() {
      this.showConfirmDialog = true;
    },
    
    // 导航到创作页面
    navigateToCreation() {
      this.showConfirmDialog = false;
      this.$router.push('/my-creation');
    },
    
    // ============================================================
    // 获取用户点赞的文章
    // ============================================================
    async fetchLikedPosts() {
      try {
        this.likesPrivacyDenied = false;
        const response = await this.$http.users.getLikedPosts(this.userInfo._id);
        
        if (response.success) {
          this.likedPosts = response.data.map(blog => {
            let author = blog.author || '未知作者';
            if (typeof author === 'object' && author.username) {
              author = author.username;
            }
            
            return {
              ...blog,
              author: author,
              date: blog.date || blog.createdAt
            };
          });
        } else {
          this.likedPosts = [];
        }
      } catch (error) {
        console.error('获取点赞文章失败:', error);
        if (error.response && error.response.status === 403 && !this.isCurrentUser) {
          this.likesPrivacyDenied = true;
        }
        this.likedPosts = [];
      }
    },
    
    // ============================================================
    // 获取用户收藏的文章
    // ============================================================
    async fetchBookmarkedPosts() {
      try {
        this.bookmarksPrivacyDenied = false;
        const response = await this.$http.users.getBookmarkedPosts(this.userInfo._id);
        
        if (response.success) {
          this.bookmarkedPosts = response.data.map(blog => {
            let author = blog.author || '未知作者';
            if (typeof author === 'object' && author.username) {
              author = author.username;
            }
            
            return {
              ...blog,
              author: author,
              date: blog.date || blog.createdAt
            };
          });
        } else {
          this.bookmarkedPosts = [];
        }
      } catch (error) {
        console.error('获取收藏文章失败:', error);
        if (error.response && error.response.status === 403 && !this.isCurrentUser) {
          this.bookmarksPrivacyDenied = true;
        }
        this.bookmarkedPosts = [];
      }
    },
    
    // 获取认证令牌
    getAuthToken() {
      return localStorage.getItem('token') || sessionStorage.getItem('token');
    },
    
    // 获取模拟用户数据
    getMockUserData() {
      const validUserId = this.userId === 'current' || !this.userId || this.userId === 'undefined' || this.userId === 'null' 
        ? '699c78d38830cdbab2e8a637' 
        : this.userId;
      
      return {
        _id: validUserId,
        username: '游戏达人',
        avatar: '/static/uploads/avatars/游戏达人.jpg',
        coverImage: '/static/images/default-cover.jpg',
        bio: '专注于分享各种游戏攻略和心得，欢迎关注！',
        posts: 23,
        following: 48,
        followers: 156,
        likes: 523
      };
    },
    
    // ============================================================
    // 获取用户信息（核心方法）
    // ============================================================
    // 【作用】获取用户详细信息
    // 【流程】
    // 1. 初始化状态
    // 2. 获取认证令牌
    // 3. 获取当前用户信息
    // 4. 获取目标用户信息
    // 5. 处理用户数据
    // 6. 检查关注状态
    // ============================================================
    async fetchUserInfo() {
      if (!this.userId) {
        this.userId = this.$route.params.userId || 'current';
      }
      
      this.isLoading = true;
      this.error = null;
      
      try {
        const token = this.getAuthToken();
        
        if (!token && this.userId === 'current') {
          this.userInfo = this.getMockUserData();
          this.userPosts = [];
          this.isCurrentUser = false;
          this.isFollowing = false;
          return;
        }
        
        let userData;
        let currentUserId = '';
        
        try {
          const meResponse = await this.$http.auth.getCurrentUser();
          if (meResponse.success && meResponse.data) {
            currentUserId = meResponse.data.id || meResponse.data._id;
          }
        } catch (error) {
          console.error('获取当前用户信息失败:', error);
        }
        
        try {
          const targetUserId = this.userId === 'current' ? currentUserId : this.userId;
          
          if (!targetUserId) {
            this.userInfo = this.getMockUserData();
            this.userPosts = [];
            this.isCurrentUser = false;
            this.isFollowing = false;
            return;
          }
          
          const userResponse = await this.$http.users.getInfo(targetUserId);
          
          if (userResponse && userResponse.success) {
            userData = userResponse.data;
          } else {
            this.userInfo = this.getMockUserData();
            this.userPosts = [];
            this.isCurrentUser = false;
            this.isFollowing = false;
            return;
          }
        } catch (error) {
          console.error('获取用户详细信息失败:', error);
          this.userInfo = this.getMockUserData();
          this.userPosts = [];
          this.isCurrentUser = false;
          this.isFollowing = false;
          return;
        }
        
        if (userData) {
          const user = userData.user || {};
          const profile = user.profile || {};
          const latestBlogs = userData.latestBlogs || [];
          
          let avatar = profile.avatar || '/static/images/default-avatar.png';
          
          if (avatar && !avatar.startsWith('http://') && !avatar.startsWith('https://') && !avatar.startsWith('/static/')) {
            if (avatar.startsWith('/uploads/')) {
              avatar = `/static${avatar}`;
            } else if (avatar.startsWith('uploads/')) {
              avatar = `/static/${avatar}`;
            } else {
              avatar = `/static${avatar.startsWith('/') ? '' : '/'}${avatar}`;
            }
          }
          
          const newUserInfo = {
            _id: user._id || '',
            username: user.username || '未知用户',
            avatar: avatar,
            coverImage: profile.coverImage || '/static/images/default-cover.jpg',
            bio: profile.bio || '',
            location: profile.location || '',
            occupation: profile.occupation || '',
            website: profile.website || '',
            posts: userData.totalPostsCount || latestBlogs.length || 0,  // 使用文章总数
            following: user.followingCount || 0,
            followers: user.followersCount || 0,
            likes: user.stats?.likesCount || 0
          };
          
          this.userInfo = { ...newUserInfo };
          
          this.userPosts = latestBlogs.map(blog => ({
            ...blog
          }));
          
          this.isCurrentUser = this.userId === 'current' || this.userId === currentUserId;
          
          this.postsPrivacyDenied = this.isCurrentUser ? false : (userData.postsPrivacyDenied || false);
          this.likesPrivacyDenied = this.isCurrentUser ? false : false;
          this.bookmarksPrivacyDenied = this.isCurrentUser ? false : false;
          
          if (!this.isCurrentUser) {
            try {
              const targetUserId = this.userId === 'current' ? currentUserId : this.userId;
              const checkResponse = await this.$http.users.checkFollow(targetUserId);
              if (checkResponse && checkResponse.success) {
                this.$set(this, 'isFollowing', checkResponse.data.isFollowing);
                this.$set(this, 'isMutualFollowing', checkResponse.data.isMutualFollowing || false);
              }
            } catch (checkError) {
              console.error('调用 checkFollow API 失败:', checkError);
              this.$set(this, 'isFollowing', false);
              this.$set(this, 'isMutualFollowing', false);
            }
          } else {
            this.$set(this, 'isFollowing', false);
            this.$set(this, 'isMutualFollowing', false);
          }
        } else {
          this.userInfo = this.getMockUserData();
          this.userPosts = [];
          this.isCurrentUser = false;
          this.isFollowing = false;
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        this.userInfo = this.getMockUserData();
        this.userPosts = [];
        this.isCurrentUser = false;
        this.isFollowing = false;
      } finally {
        this.isLoading = false;
      }
    },
    
    // ============================================================
    // 关注用户
    // ============================================================
    // 【作用】关注指定用户
    // 【乐观更新】先更新UI，再请求API
    // ============================================================
    async followUser() {
      try {
        if (this.isCurrentUser) {
          showNotification('不能关注自己', 'error');
          return;
        }
        
        const targetUserId = this.userId === 'current' ? this.userInfo._id : this.userId;
        
        // 乐观更新：立即显示已关注
        const oldIsFollowing = this.isFollowing;
        const oldIsMutualFollowing = this.isMutualFollowing;
        const oldFollowers = this.userInfo.followers;
        
        this.$set(this, 'isFollowing', true);
        this.$set(this, 'isMutualFollowing', false);
        this.$set(this.userInfo, 'followers', oldFollowers + 1);
        
        const response = await this.$http.users.follow(targetUserId);
        
        if (response.success) {
          const cacheKey = `user_info_${this.userId}`;
          CacheManager.remove(cacheKey);
          
          if (response.data) {
            this.$set(this, 'isFollowing', response.data.isFollowing);
            this.$set(this, 'isMutualFollowing', response.data.isMutualFollowing || false);
          }
          
          await this.fetchUserInfo();
          showNotification(response.message || '关注成功', 'success');
        } else {
          // 回滚到旧状态
          this.$set(this, 'isFollowing', oldIsFollowing);
          this.$set(this, 'isMutualFollowing', oldIsMutualFollowing);
          this.$set(this.userInfo, 'followers', oldFollowers);
          showNotification(`关注失败: ${response.message || '未知错误'}`, 'error');
        }
      } catch (error) {
        console.error('关注用户失败:', error);
        
        if (error.response && error.response.status === 401) {
          this.$router.push('/login');
          return;
        }
        
        showNotification('关注用户失败，请稍后重试', 'error');
      }
    },
    
    // 跳转到博客详情页
    goToBlogDetail(blogId) {
      this.$router.push(`/zhihu-detail/${blogId}`);
    },
    
    // ============================================================
    // 取消关注用户
    // ============================================================
    async unfollowUser() {
      try {
        if (this.isCurrentUser) {
          showNotification('不能取消关注自己', 'error');
          return;
        }
        
        const targetUserId = this.userId === 'current' ? this.userInfo._id : this.userId;
        
        // 乐观更新
        const oldIsFollowing = this.isFollowing;
        const oldIsMutualFollowing = this.isMutualFollowing;
        const oldFollowers = this.userInfo.followers;
        
        this.$set(this, 'isFollowing', false);
        this.$set(this, 'isMutualFollowing', false);
        this.$set(this.userInfo, 'followers', Math.max(0, oldFollowers - 1));
        
        const response = await this.$http.users.unfollow(targetUserId);
        
        if (response.success) {
          const cacheKey = `user_info_${this.userId}`;
          CacheManager.remove(cacheKey);
          
          if (response.data) {
            this.$set(this, 'isFollowing', response.data.isFollowing);
            this.$set(this, 'isMutualFollowing', response.data.isMutualFollowing || false);
          }
          
          await this.fetchUserInfo();
          showNotification(response.message || '取消关注成功', 'success');
        } else {
          this.$set(this, 'isFollowing', oldIsFollowing);
          this.$set(this, 'isMutualFollowing', oldIsMutualFollowing);
          this.$set(this.userInfo, 'followers', oldFollowers);
          showNotification(`取消关注失败: ${response.message || '未知错误'}`, 'error');
        }
      } catch (error) {
        console.error('取消关注失败:', error);
        
        if (error.response && error.response.status === 401) {
          this.$router.push('/login');
          return;
        }
        
        showNotification('取消关注失败，请稍后重试', 'error');
      }
    },
    
    // 检查关注状态
    async checkFollowStatus() {
      const targetUserId = this.userId === 'current' ? this.userInfo._id : this.userId;
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token || !targetUserId) return;
      
      try {
        const response = await this.$http.users.checkFollow(targetUserId);
        if (response && response.success) {
          this.$set(this, 'isFollowing', response.data.isFollowing);
          this.$set(this, 'isMutualFollowing', response.data.isMutualFollowing || false);
        }
      } catch (error) {
        console.error('检查关注状态失败:', error);
      }
    },
    
    // 显示粉丝列表
    showFollowersList() {
      this.socialListType = 'followers';
      this.socialListTitle = `${this.userInfo.username}的粉丝`;
      this.showSocialListModal = true;
      this.fetchSocialList();
    },
    
    // 显示关注列表
    showFollowingList() {
      this.socialListType = 'following';
      this.socialListTitle = `${this.userInfo.username}的关注`;
      this.showSocialListModal = true;
      this.fetchSocialList();
    },
    
    // 关闭列表模态框
    closeSocialListModal() {
      this.showSocialListModal = false;
      this.socialList = [];
      this.currentPage = 1;
      this.hasMore = true;
    },
    
    // 获取粉丝/关注列表
    async fetchSocialList() {
      this.socialListLoading = true;
      this.socialListError = null;
      
      try {
        if (!this.userInfo._id) {
          this.userInfo._id = '699c78d38830cdbab2e8a637';
        }
        
        const apiMethod = this.socialListType === 'followers' ? this.$http.users.getFollowers : this.$http.users.getFollowing;
        const response = await apiMethod(this.userInfo._id, {
          page: this.currentPage,
          limit: 10
        });
        
        if (response.success) {
          let users = response.data;
          
          users = users.map(user => {
            return {
              ...user,
              isFollowing: user.isFollowing || false,
              isMutualFollowing: user.isMutualFollowing || false
            };
          });
          
          if (this.currentPage === 1) {
            this.socialList = users;
          } else {
            this.socialList = [...this.socialList, ...users];
          }
          
          this.hasMore = users.length === 10;
        } else {
          this.socialListError = response.message || `获取${this.socialListType === 'followers' ? '粉丝' : '关注'}列表失败`;
        }
      } catch (error) {
        console.error(`获取${this.socialListType === 'followers' ? '粉丝' : '关注'}列表失败:`, error);
        
        if (error.response && error.response.status === 401) {
          this.$router.push('/login');
          return;
        }
        
        this.socialListError = `获取${this.socialListType === 'followers' ? '粉丝' : '关注'}列表失败，请稍后重试`;
      } finally {
        this.socialListLoading = false;
      }
    },
    
    // 加载更多
    loadMore() {
      if (!this.socialListLoading && this.hasMore) {
        this.currentPage += 1;
        this.fetchSocialList();
      }
    },
    
    // 关注/取消关注用户
    async toggleFollow(user) {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        this.showNotification('请先登录', 'error');
        return;
      }
      
      try {
        const apiMethod = user.isFollowing ? this.$http.users.unfollow : this.$http.users.follow;
        const response = await apiMethod(user._id);
        
        if (response.success) {
          user.isFollowing = !user.isFollowing;
          user.isMutualFollowing = user.isFollowing ? true : false;
          
          if (this.socialListType === 'following' && !user.isFollowing) {
            this.userInfo.following -= 1;
          } else if (this.socialListType === 'followers' && user.isFollowing) {
            this.userInfo.followers += 1;
          }
          
          this.showNotification(user.isFollowing ? '关注成功' : '取消关注成功', 'success');
        } else {
          this.showNotification(`操作失败: ${response.message}`, 'error');
        }
      } catch (error) {
        console.error('操作失败:', error);
        this.showNotification('操作失败，请稍后重试', 'error');
        
        if (error.response && error.response.status === 401) {
          this.$router.push('/login');
        }
      }
    },
    
    // 显示通知
    showNotification(message, type = 'success') {
      this.notification = {
        show: true,
        message: message,
        type: type
      };
      
      setTimeout(() => {
        this.notification.show = false;
      }, 3000);
    },
    
    // 处理头像加载失败（防止无限重试）
    onAvatarError(event) {
      // 如果已经是默认图片，就不再重试，避免无限循环
      if (event.target.src.includes('default-avatar.png')) {
        return;
      }
      // 使用本地默认头像，避免外部图片加载失败
      event.target.src = '/static/images/default-avatar.png';
    }
  }
}
</script>

<style scoped>
/* 个人中心页面 */
.profile-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--background-light) 0%, var(--background-dark) 100%);
  position: relative;
  font-family: var(--font-family);
}

/* 通知提示 */
.notification {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(-100%);
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  z-index: 1000;
  transition: transform 0.3s ease;
}

.notification.show {
  transform: translateX(-50%) translateY(0);
}

.notification.success {
  background: linear-gradient(135deg, #00b894, #00cec9);
  color: white;
}

.notification.error {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
}

.notification.info {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

/* 主内容区 */
.main-content {
  padding: 20px;
  padding-bottom: 80px;
}

/* 个人信息头部 */
.profile-header {
  background: white;
  border-radius: 20px;
  overflow: visible; /* 改为 visible，让头像可以超出容器 */
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  position: relative; /* 添加相对定位 */
  z-index: 1; /* 降低层级 */
}

.profile-cover {
  position: relative;
  height: 200px;
  overflow: visible; /* 改为 visible，让头像可以超出 */
  z-index: 1; /* 降低层级 */
  /* CSS 变量默认值 */
  --mouse-x: 0.5;
  --mouse-y: 0.5;
}

.cover-background {
  width: 100%;
  height: 100%;
  /* 背景图样式由内联样式动态控制 */
  transition: background-position 0.2s ease-out;
  will-change: background-position;
}

/* 移动端禁用效果 */
@media (hover: none) and (pointer: coarse) {
  .cover-background {
    background-position: center center !important;
  }
}

.profile-avatar-container {
  position: absolute;
  left: 50%;
  transform: translate(-50%,-50%);
  z-index: 20; /* 提高层级，让头像显示在最上层 */
}

.profile-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 4px solid white;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.profile-info {
  padding: 70px 20px 20px; /* 增加顶部 padding，给头像留空间 */
  text-align: center;
  position: relative;
  z-index: 1;
}

.profile-name {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}

.profile-bio {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
}

.profile-details {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
}

.profile-actions {
  margin-bottom: 20px;
}

.btn-follow {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  border: none;
  padding: 10px 30px;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-follow:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.btn-unfollow {
  background: #f0f0f0;
  color: #666;
  border: none;
  padding: 10px 30px;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-unfollow:hover {
  background: #e0e0e0;
}

/* 统计数据 */
.profile-stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 20px 0;
}

.stat-item {
  text-align: center;
  cursor: pointer;
}

.stat-count {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

/* 标签页导航 */
.profile-tabs {
  display: flex;
  background: white;
  border-radius: 15px;
  padding: 10px;
  margin-bottom: 20px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.tab-item {
  flex: 1;
  padding: 12px;
  border: none;
  background: transparent;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.tab-item.active {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
}

.tab-item:hover:not(.active) {
  background: #f5f5f5;
}

/* 文章卡片网格 */
.blog-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.blog-card {
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.blog-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.card-image {
  position: relative;
  height: 160px;
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-category-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 12px;
}

.card-content {
  padding: 15px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
  margin-bottom: 10px;
}

.card-stats {
  display: flex;
  gap: 15px;
}

.card-stats .stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 15px;
}

.empty-state .nav-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 8px;
}

.empty-state p {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 错误提示 */
.error-message {
  text-align: center;
  padding: 40px 20px;
  background: white;
  border-radius: 15px;
}

.error-message p {
  color: #e74c3c;
  margin-bottom: 16px;
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

/* 用户列表 */
.user-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 10px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-name {
  font-weight: 600;
  color: #333;
}

.user-bio {
  font-size: 12px;
  color: #999;
}

/* 加载更多 */
.load-more-container {
  text-align: center;
  margin-top: 20px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 确认对话框 */
.confirm-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.confirm-dialog {
  background: white;
  border-radius: 15px;
  padding: 30px;
  text-align: center;
  max-width: 400px;
}

.confirm-dialog h3 {
  margin-bottom: 16px;
}

.confirm-dialog p {
  margin-bottom: 24px;
  color: #666;
}

.confirm-dialog-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.btn-secondary {
  background: #f0f0f0;
  color: #666;
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
}

/* 响应式 */
@media (max-width: 768px) {
  .profile-stats {
    gap: 20px;
  }
  
  .stat-count {
    font-size: 20px;
  }
  
  .profile-tabs {
    flex-wrap: wrap;
  }
  
  .tab-item {
    flex: 1 1 45%;
    font-size: 12px;
  }
  
  .blog-cards-grid {
    grid-template-columns: 1fr;
  }
}
</style>
