// ============================================================
// router/index.js - Vue Router 路由配置
// ============================================================
// 
// 【文件职责】
// 定义前端应用的所有路由规则，包括：
// 1. 页面路径与组件的映射关系
// 2. 路由导航守卫（权限控制）
// 3. Token 过期检查
// 4. 用户角色判断
// 
// 【学习重点】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  1. 路由配置：path、name、component 三要素                              │
// │  2. 导航守卫：beforeEach 全局前置守卫                                   │
// │  3. 权限控制：公开路由 vs 私有路由                                      │
// │  4. Token 解析：JWT 结构与过期检查                                      │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【路由工作流程】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │   用户点击链接/输入URL                                                  │
// │   ────────────────────                                                  │
// │       │                                                                 │
// │       │ <router-link to="/profile">                                    │
// │       │ 或浏览器地址栏输入                                              │
// │       ▼                                                                 │
// │   触发路由导航                                                          │
// │   ──────────────                                                        │
// │       │                                                                 │
// │       │ router.push('/profile')                                        │
// │       ▼                                                                 │
// │   执行导航守卫                                                          │
// │   ──────────────                                                        │
// │       │                                                                 │
// │       │ router.beforeEach((to, from, next) => {...})                   │
// │       │                                                                 │
// │       ├── 1. 初始化认证状态                                             │
// │       │   auth.init()                                                  │
// │       │                                                                 │
// │       ├── 2. 检查Token是否过期                                          │
// │       │   checkTokenExpiration()                                       │
// │       │                                                                 │
// │       ├── 3. 判断是否为公开路由                                         │
// │       │   publicRoutes.includes(to.path)                               │
// │       │                                                                 │
// │       ├── 4. 未登录访问私有路由 → 跳转登录                              │
// │       │   next('/login')                                               │
// │       │                                                                 │
// │       ├── 5. 已登录访问登录页 → 跳转首页                                │
// │       │   next('/blog') 或 next('/admin')                              │
// │       │                                                                 │
// │       └── 6. 正常访问 → 放行                                            │
// │           next()                                                       │
// │                                                                         │
// │   匹配路由配置                                                          │
// │   ──────────────                                                        │
// │       │                                                                 │
// │       │ 找到 { path: '/profile', component: Profile }                  │
// │       ▼                                                                 │
// │   渲染组件                                                              │
// │   ──────────                                                            │
// │       │                                                                 │
// │       │ <router-view> 中渲染 Profile 组件                              │
// │       ▼                                                                 │
// │   页面显示完成                                                          │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// ============================================================

// ============================================================
// 【第一部分：导入依赖】
// ============================================================

// 导入 Vue 框架
// Vue 是渐进式 JavaScript 框架，用于构建用户界面
import Vue from 'vue';

// 导入 Vue Router 插件
// Vue Router 是 Vue.js 官方路由管理器
// 功能：
// 1. 嵌套的路由/视图表
// 2. 模块化的、基于组件的路由配置
// 3. 路由参数、查询、通配符
// 4. 导航守卫
import Router from 'vue-router';

// 导入认证状态管理工具
// auth 提供登录状态检查、Token 管理等功能
import auth from '../utils/auth';

// ============================================================
// 【第二部分：路由懒加载组件定义】
// ============================================================
// 使用动态 import() 实现路由懒加载
// 访问路由时才加载对应组件，减小首屏加载体积

// ─── 认证相关组件 ───
const Login = () => import(/* webpackChunkName: "auth" */ '../components/Login.vue');
const Register = () => import(/* webpackChunkName: "auth" */ '../components/Register.vue');

// ─── 核心功能组件 ───
const Blog = () => import(/* webpackChunkName: "blog" */ '../components/Blog.vue');
const Create = () => import(/* webpackChunkName: "create" */ '../components/Create.vue');

// ─── 用户关系组件 ───
const Following = () => import(/* webpackChunkName: "social" */ '../components/Following.vue');
const Followers = () => import(/* webpackChunkName: "social" */ '../components/Followers.vue');
const UserDynamic = () => import(/* webpackChunkName: "social" */ '../components/UserDynamic.vue');

// ─── 消息通知组件 ───
const Messages = () => import(/* webpackChunkName: "message" */ '../components/Messages.vue');
const Notifications = () => import(/* webpackChunkName: "message" */ '../components/Notifications.vue');

// ─── 用户中心组件 ───
const Profile = () => import(/* webpackChunkName: "profile" */ '../components/Profile.vue');
const Search = () => import(/* webpackChunkName: "search" */ '../components/Search.vue');
const MyProfile = () => import(/* webpackChunkName: "profile" */ '../components/MyProfile.vue');
const MyCreation = () => import(/* webpackChunkName: "profile" */ '../components/MyCreation.vue');
const EditProfile = () => import(/* webpackChunkName: "profile" */ '../components/EditProfile.vue');

// ─── 话题相关组件 ───
const TopicList = () => import(/* webpackChunkName: "topic" */ '../components/TopicList.vue');
const TopicDetail = () => import(/* webpackChunkName: "topic" */ '../components/TopicDetail.vue');

// ─── 文章详情组件 ───
const ZhihuDetail = () => import(/* webpackChunkName: "detail" */ '../components/ZhihuDetail.vue');

// ─── 管理员组件 ───
const AdminDashboard = () => import(/* webpackChunkName: "admin" */ '../components/AdminDashboard.vue');
const AdminUsers = () => import(/* webpackChunkName: "admin" */ '../components/AdminUsers.vue');
const AdminBlogs = () => import(/* webpackChunkName: "admin" */ '../components/AdminBlogs.vue');

// ============================================================
// 【第三部分：注册路由插件】
// ============================================================

// 调用 Vue.use() 安装路由插件
// 这会注册 Router 组件和路由相关的全局方法
// 安装后可以在任何组件中使用：
// - this.$router：路由实例
// - this.$route：当前路由对象
Vue.use(Router);

// ============================================================
// 【第四部分：创建路由实例】
// ============================================================

// 创建路由实例并配置路由规则
const router = new Router({
  // 路由模式
  // 'history'：使用 HTML5 History API，URL 不带 # 号
  // 例如：https://example.com/blog
  // 
  // 其他选项：
  // 'hash'：使用 URL hash，URL 带 # 号
  // 例如：https://example.com/#/blog
  mode: 'history',
  
  // 滚动行为
  // 路由切换时控制页面滚动位置
  scrollBehavior(to, from, savedPosition) {
    // 如果用户手动滚动过，savedPosition 为 null
    // 总是滚动到顶部
    return { x: 0, y: 0 };
  },
  
  // 路由配置数组
  // 每个路由对象包含：
  // - path：URL 路径
  // - name：路由名称（用于路由跳转）
  // - component：要渲染的组件
  // - redirect：重定向目标
  routes: [
    // ─── 根路径重定向 ───
    {
      path: '/',           // 根路径
      name: 'home',        // 路由名称
      redirect: '/blog'    // 重定向到博客首页
      // 用户访问 https://example.com/ 会自动跳转到 /blog
    },
    
    // ─── 认证相关路由 ───
    {
      path: '/login',      // 登录页面路径
      name: 'login',       // 路由名称
      component: Login     // 渲染 Login 组件
    },
    {
      path: '/register',   // 注册页面路径
      name: 'register',    // 路由名称
      component: Register  // 渲染 Register 组件
    },
    
    // ─── 核心功能路由 ───
    {
      path: '/blog',       // 博客首页路径
      name: 'Blog',        // 路由名称
      component: Blog      // 渲染 Blog 组件（小红书风格）
    },
    {
      path: '/create',     // 创建博客路径
      name: 'Create',      // 路由名称
      component: Create    // 渲染 Create 组件
    },
    
    // ─── 文章详情路由（带参数）───
    {
      path: '/zhihu-detail/:id',   // 动态路由，:id 是参数
      name: 'ZhihuDetail',         // 路由名称
      component: ZhihuDetail       // 渲染 ZhihuDetail 组件
      // 访问 /zhihu-detail/123 时，id 参数值为 123
      // 在组件中通过 this.$route.params.id 获取
    },
    
    // ─── 用户关系路由 ───
    {
      path: '/following',    // 关注列表路径
      name: 'Following',     // 路由名称
      component: Following   // 渲染 Following 组件
    },
    {
      path: '/followers',    // 粉丝列表路径
      name: 'Followers',     // 路由名称
      component: Followers   // 渲染 Followers 组件
    },
    {
      path: '/user-dynamic',     // 用户动态路径
      name: 'UserDynamic',       // 路由名称
      component: UserDynamic     // 渲染 UserDynamic 组件
    },
    
    // ─── 消息通知路由 ───
    {
      path: '/messages',       // 私信页面路径
      name: 'Messages',        // 路由名称
      component: Messages      // 渲染 Messages 组件
    },
    {
      path: '/notifications',    // 通知页面路径
      name: 'Notifications',     // 路由名称
      component: Notifications   // 渲染 Notifications 组件
    },
    
    // ─── 用户中心路由 ───
    {
      path: '/profile/:userId?',   // 用户资料路径，userId 可选
      name: 'Profile',             // 路由名称
      component: Profile           // 渲染 Profile 组件
      // :userId? 中的 ? 表示参数可选
      // /profile → 查看自己的资料
      // /profile/123 → 查看 ID 为 123 的用户资料
    },
    {
      path: '/edit/:id',     // 编辑博客路径
      name: 'Edit',          // 路由名称
      component: Create      // 复用 Create 组件（编辑模式）
      // 编辑和创建使用同一个组件，通过 id 参数区分
    },
    
    // ─── 话题相关路由 ───
    {
      path: '/topics',       // 话题列表路径
      name: 'TopicList',     // 路由名称
      component: TopicList   // 渲染 TopicList 组件
    },
    {
      path: '/topic/:id',    // 话题详情路径
      name: 'TopicDetail',   // 路由名称
      component: TopicDetail // 渲染 TopicDetail 组件
    },
    
    // ─── 搜索路由 ───
    {
      path: '/search',       // 搜索页面路径
      name: 'Search',        // 路由名称
      component: Search      // 渲染 Search 组件
    },
    
    // ─── 个人中心路由 ───
    {
      path: '/my-profile',     // 我的信息路径
      name: 'MyProfile',       // 路由名称
      component: MyProfile     // 渲染 MyProfile 组件
    },
    {
      path: '/my-creation',    // 我的创作路径
      name: 'MyCreation',      // 路由名称
      component: MyCreation    // 渲染 MyCreation 组件
    },
    {
      path: '/edit-profile',   // 编辑资料路径
      name: 'EditProfile',     // 路由名称
      component: EditProfile   // 渲染 EditProfile 组件
    },
    
    // ─── 管理员路由 ───
    {
      path: '/admin',            // 管理员首页路径
      name: 'AdminDashboard',    // 路由名称
      component: AdminDashboard  // 渲染 AdminDashboard 组件
    },
    {
      path: '/admin/users',    // 用户管理路径
      name: 'AdminUsers',      // 路由名称
      component: AdminUsers    // 渲染 AdminUsers 组件
    },
    {
      path: '/admin/blogs',    // 博客管理路径
      name: 'AdminBlogs',      // 路由名称
      component: AdminBlogs    // 渲染 AdminBlogs 组件
    },
    
    // ─── 404 兜底路由 ───
    {
      path: '*',           // 匹配所有未定义的路径
      redirect: '/blog'    // 重定向到博客首页
      // 当用户访问不存在的路径时，自动跳转到首页
    }
  ]
});

// ============================================================
// 【第五部分：Token 过期检查函数】
// ============================================================

/**
 * 检查 Token 是否过期
 * 
 * 【JWT Token 结构】
 * JWT Token 由三部分组成：Header.Payload.Signature
 * 
 * 示例：
 * eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1NiIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwODY0MDB9.abc123def456
 * 
 * 解码后的 Payload：
 * {
 *   "id": "123456",        // 用户 ID
 *   "role": "user",        // 用户角色
 *   "iat": 1600000000,     // 签发时间
 *   "exp": 1600086400      // 过期时间
 * }
 */
const checkTokenExpiration = () => {
  // 获取存储的 Token
  const token = auth.getToken();
  
  // 如果 Token 存在
  if (token) {
    try {
      // JWT Token 格式：Header.Payload.Signature
      // 用点号分割，取第二部分（Payload）
      const tokenParts = token.split('.');
      
      // 验证 Token 格式是否正确（应该有3部分）
      if (tokenParts.length === 3) {
        // Base64 解码 Payload 部分
        // atob() 是浏览器内置的 Base64 解码函数
        const payload = JSON.parse(atob(tokenParts[1]));
        
        // 获取当前时间戳（秒）
        const now = Date.now() / 1000;
        
        // 检查 Token 是否过期
        // payload.exp 是 Token 过期时间（秒级时间戳）
        // 如果过期时间小于当前时间，说明 Token 已过期
        if (payload.exp && payload.exp < now) {
          // Token 已过期，执行登出操作
          auth.logout();
        }
      }
    } catch (error) {
      // Token 解析失败（格式错误或被篡改）
      console.error('Token解析错误:', error);
      // 安全起见，执行登出
      auth.logout();
    }
  }
};

// ============================================================
// 【第六部分：获取当前用户角色函数】
// ============================================================

/**
 * 从 Token 中获取当前用户角色
 * 
 * @returns {string|null} 用户角色（'user' 或 'admin'），未登录返回 null
 */
const getCurrentUserRole = () => {
  // 获取 Token
  const token = auth.getToken();
  
  // 没有 Token，返回 null
  if (!token) return null;
  
  try {
    // 解析 Token 的 Payload 部分
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // 返回角色信息
    return payload.role;
  } catch (error) {
    console.error('解析token失败:', error);
    return null;
  }
};

// ============================================================
// 【第七部分：全局导航守卫】
// ============================================================

/**
 * 全局前置守卫
 * 
 * 【导航守卫执行时机】
 * 当路由跳转时，beforeEach 会先执行，然后决定是否放行
 * 
 * 【参数说明】
 * @param {Object} to - 目标路由对象
 *   to.path   - 目标路径
 *   to.name   - 目标路由名称
 *   to.params - 路由参数
 *   to.query  - 查询参数
 * 
 * @param {Object} from - 来源路由对象
 *   from.path - 来源路径
 * 
 * @param {Function} next - 放行函数
 *   next()        - 放行，继续导航
 *   next('/path') - 中断当前导航，跳转到指定路径
 *   next(false)   - 中断当前导航
 */
router.beforeEach((to, from, next) => {
  // ─── 步骤1：初始化认证状态 ───
  // 从 localStorage 读取用户信息，初始化 auth 模块
  auth.init();
  
  // ─── 步骤2：检查 Token 是否过期 ───
  // 每次路由跳转都检查，确保 Token 有效
  checkTokenExpiration();
  
  // ─── 步骤3：定义公开路由 ───
  // 公开路由：无需登录即可访问的页面
  const publicRoutes = [
    '/login',           // 登录页
    '/register',        // 注册页
    '/blog',            // 博客首页（游客可浏览）
    '/search'           // 搜索页（游客可使用）
  ];
  
  // ─── 步骤4：判断是否为公开路由 ───
  const isPublicRoute = publicRoutes.includes(to.path);
  
  // ─── 步骤5：权限控制逻辑 ───
  
  // 情况1：未登录访问私有路由
  // 条件：未登录 && 不是公开路由
  if (!auth.isLoggedIn() && !isPublicRoute) {
    // 跳转到登录页
    next('/login');
  } 
  // 情况2：已登录访问登录/注册页
  // 条件：已登录 && 访问登录或注册页
  else if (auth.isLoggedIn() && (to.path === '/login' || to.path === '/register')) {
    // 获取用户角色
    const userRole = getCurrentUserRole();
    
    // 根据角色跳转到不同首页
    // 管理员跳转到管理后台
    // 普通用户跳转到博客首页
    next(userRole === 'admin' ? '/admin' : '/blog');
  } 
  // 情况3：正常访问
  else {
    // 放行，继续导航
    next();
  }
});

// ============================================================
// 【第八部分：导出路由实例】
// ============================================================

// 导出路由实例
// 在 main.js 中导入并挂载到 Vue 实例：
// new Vue({
//   router,  // 挂载路由
//   render: h => h(App)
// }).$mount('#app');
export default router;

// ============================================================
// 【面试常问问题】
// ============================================================
// 
// Q1: Vue Router 的两种模式有什么区别？
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  【hash 模式】                                                          │
// │  URL: https://example.com/#/blog                                       │
// │  原理: 使用 URL 的 hash（#）模拟完整路径                                │
// │  优点: 不需要服务器配置支持                                             │
// │  缺点: URL 不美观，# 号后面的内容不会被发送到服务器                     │
// │                                                                         │
// │  【history 模式】                                                       │
// │  URL: https://example.com/blog                                         │
// │  原理: 使用 HTML5 History API（pushState, replaceState）               │
// │  优点: URL 美观，像正常路径                                             │
// │  缺点: 需要服务器配置支持（否则刷新会 404）                             │
// │                                                                         │
// │  【服务器配置示例（Nginx）】                                            │
// │  location / {                                                          │
// │    try_files $uri $uri/ /index.html;                                   │
// │  }                                                                      │
// │  // 所有路径都返回 index.html，由前端路由处理                           │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// Q2: 导航守卫有哪些类型？
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  【全局守卫】                                                           │
// │  router.beforeEach    - 全局前置守卫（本文件使用）                      │
// │  router.beforeResolve - 全局解析守卫                                    │
// │  router.afterEach     - 全局后置钩子                                    │
// │                                                                         │
// │  【路由独享守卫】                                                       │
// │  const routes = [{                                                      │
// │    path: '/admin',                                                     │
// │    beforeEnter: (to, from, next) => {                                  │
// │      // 只有访问 /admin 时才执行                                       │
// │    }                                                                    │
// │  }]                                                                     │
// │                                                                         │
// │  【组件内守卫】                                                         │
// │  export default {                                                       │
// │    beforeRouteEnter(to, from, next) {                                  │
// │      // 进入路由前调用，组件还未创建                                    │
// │    },                                                                   │
// │    beforeRouteUpdate(to, from, next) {                                 │
// │      // 路由参数变化时调用                                              │
// │    },                                                                   │
// │    beforeRouteLeave(to, from, next) {                                  │
// │      // 离开路由前调用                                                  │
// │    }                                                                    │
// │  }                                                                      │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// Q3: 如何实现路由懒加载？
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  【传统方式】（本文件使用）                                              │
// │  import Blog from '../components/Blog.vue';                            │
// │  { path: '/blog', component: Blog }                                    │
// │  // 所有组件打包到一个 JS 文件，首屏加载慢                              │
// │                                                                         │
// │  【懒加载方式】                                                         │
// │  const Blog = () => import('../components/Blog.vue');                  │
// │  { path: '/blog', component: Blog }                                    │
// │  // 按需加载，访问 /blog 时才下载该组件代码                             │
// │                                                                         │
// │  【分组懒加载】                                                         │
// │  const Blog = () => import(/* webpackChunkName: "blog" */              │
// │    '../components/Blog.vue');                                          │
// │  // 将多个组件打包到一个 chunk                                          │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// Q4: 动态路由和路由参数如何使用？
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  【定义动态路由】                                                       │
// │  {                                                                      │
// │    path: '/profile/:userId?',  // ? 表示参数可选                       │
// │    component: Profile                                                   │
// │  }                                                                      │
// │                                                                         │
// │  【获取路由参数】                                                       │
// │  // 在组件中                                                            │
// │  this.$route.params.userId  // 获取 userId 参数                        │
// │  this.$route.query.q       // 获取查询参数 ?q=xxx                      │
// │                                                                         │
// │  【编程式导航】                                                         │
// │  this.$router.push('/profile/123')           // 路径方式               │
// │  this.$router.push({ name: 'Profile', params: { userId: 123 } })       │
// │  this.$router.push({ path: '/search', query: { q: 'vue' } })           │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// Q5: Token 过期后如何处理？
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  【方案一：路由守卫检查】（本文件使用）                                  │
// │  router.beforeEach((to, from, next) => {                               │
// │    checkTokenExpiration();  // 每次路由跳转检查                        │
// │    next();                                                              │
// │  });                                                                    │
// │                                                                         │
// │  【方案二：请求拦截器检查】                                             │
// │  axios.interceptors.request.use(config => {                            │
// │    if (isTokenExpired()) {                                             │
// │      auth.logout();                                                    │
// │      router.push('/login');                                            │
// │    }                                                                    │
// │    return config;                                                       │
// │  });                                                                    │
// │                                                                         │
// │  【方案三：响应拦截器处理】                                             │
// │  axios.interceptors.response.use(                                      │
// │    response => response,                                               │
// │    error => {                                                          │
// │      if (error.response.status === 401) {                              │
// │        // Token 无效或过期                                             │
// │        auth.logout();                                                  │
// │        router.push('/login');                                          │
// │      }                                                                  │
// │    }                                                                    │
// │  );                                                                     │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// ============================================================
