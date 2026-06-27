// Vue Router 路由配置 - 懒加载 + meta 驱动权限控制 + Token 刷新

import Vue from 'vue';
import Router from 'vue-router';
import store from '../store';

// SVIP 页面同步加载（较小，无需懒加载）
import YmtEtj from '../components/interactive-food/YmtEtj.vue';

// ====== 懒加载路由组件 ======
const AuthPage = () => import(/* webpackChunkName: "auth" */ '../components/AuthPage.vue');
const Blog = () => import(/* webpackChunkName: "blog" */ '../components/Blog.vue');
const Create = () => import(/* webpackChunkName: "create" */ '../components/Create.vue');
const ZhihuDetail = () => import(/* webpackChunkName: "detail" */ '../components/ZhihuDetail.vue');
const Following = () => import(/* webpackChunkName: "social" */ '../components/Following.vue');
const Followers = () => import(/* webpackChunkName: "social" */ '../components/Followers.vue');
const UserDynamic = () => import(/* webpackChunkName: "social" */ '../components/UserDynamic.vue');
const Messages = () => import(/* webpackChunkName: "message" */ '../components/Messages.vue');
const Notifications = () => import(/* webpackChunkName: "message" */ '../components/Notifications.vue');
const Profile = () => import(/* webpackChunkName: "profile" */ '../components/Profile.vue');
const Search = () => import(/* webpackChunkName: "search" */ '../components/Search.vue');
const ProfileSettings = () => import(/* webpackChunkName: "profile" */ '../components/ProfileSettings.vue');
const MyCreation = () => import(/* webpackChunkName: "profile" */ '../components/MyCreation.vue');
const EditProfile = () => import(/* webpackChunkName: "profile" */ '../components/EditProfile.vue');
const TopicList = () => import(/* webpackChunkName: "topic" */ '../components/TopicList.vue');
const TopicDetail = () => import(/* webpackChunkName: "topic" */ '../components/TopicDetail.vue');
const AdminLayout = () => import(/* webpackChunkName: "admin" */ '../components/AdminLayout.vue');
const AdminDashboard = () => import(/* webpackChunkName: "admin" */ '../components/AdminDashboard.vue');
const AdminUsers = () => import(/* webpackChunkName: "admin" */ '../components/AdminUsers.vue');
const AdminBlogs = () => import(/* webpackChunkName: "admin" */ '../components/AdminBlogs.vue');
const DataDashboard = () => import(/* webpackChunkName: "profile" */ '../components/DataDashboard.vue');
const MeowChess = () => import(/* webpackChunkName: "game" */ '../components/meow-chess/MeowChess.vue');

Vue.use(Router);

const routes = [
  { path: '/', redirect: '/blog' },

  // 公开路由
  { path: '/login', name: 'login', component: AuthPage, meta: { title: '登录', public: true } },
  { path: '/register', name: 'register', component: AuthPage, meta: { title: '注册', public: true } },

  // 核心业务
  { path: '/blog', name: 'Blog', component: Blog, meta: { title: '首页', requiresAuth: true } },
  { path: '/create', name: 'Create', component: Create, meta: { title: '发布文章', requiresAuth: true } },
  { path: '/zhihu-detail/:id', name: 'ZhihuDetail', component: ZhihuDetail, meta: { title: '文章详情', requiresAuth: true }, props: true },
  { path: '/edit/:id', name: 'Edit', component: Create, meta: { title: '编辑文章', requiresAuth: true }, props: true },

  // 社交
  { path: '/following', name: 'Following', component: Following, meta: { title: '我的关注', requiresAuth: true } },
  { path: '/followers', name: 'Followers', component: Followers, meta: { title: '我的粉丝', requiresAuth: true } },
  { path: '/user-dynamic', name: 'UserDynamic', component: UserDynamic, meta: { title: '用户动态', requiresAuth: true } },

  // 消息通知
  { path: '/messages', name: 'Messages', component: Messages, meta: { title: '私信', requiresAuth: true } },
  { path: '/notifications', name: 'Notifications', component: Notifications, meta: { title: '通知中心', requiresAuth: true } },

  // 用户
  { path: '/profile/:userId?', name: 'Profile', component: Profile, meta: { title: '个人主页', requiresAuth: true } },
  { path: '/my-profile', name: 'ProfileSettings', component: ProfileSettings, meta: { title: '个人设置', requiresAuth: true } },
  { path: '/my-creation', name: 'MyCreation', component: MyCreation, meta: { title: '我的创作', requiresAuth: true } },
  { path: '/edit-profile', name: 'EditProfile', component: EditProfile, meta: { title: '编辑资料', requiresAuth: true } },
  { path: '/data-dashboard', name: 'DataDashboard', component: DataDashboard, meta: { title: '数据看板', requiresAuth: true } },

  // 话题
  { path: '/topics', name: 'TopicList', component: TopicList, meta: { title: '话题广场', requiresAuth: true } },
  { path: '/topic/:id', name: 'TopicDetail', component: TopicDetail, meta: { title: '话题详情', requiresAuth: true }, props: true },

  // 搜索
  { path: '/search', name: 'Search', component: Search, meta: { title: '搜索', requiresAuth: true } },

  // 管理后台（嵌套路由）
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAdmin: true },
    redirect: '/admin',
    children: [
      { path: '', name: 'AdminDashboard', component: AdminDashboard, meta: { title: '仪表盘' } },
      { path: 'users', name: 'AdminUsers', component: AdminUsers, meta: { title: '用户管理' } },
      { path: 'blogs', name: 'AdminBlogs', component: AdminBlogs, meta: { title: '博客管理' } }
    ]
  },

  // SVIP 专属
  { path: '/ymt', name: 'ymtEtj', component: YmtEtj, meta: { title: '互动美食', requiresSvip: true, requiresAuth: true } },
  { path: '/meow-chess', name: 'MeowChess', component: MeowChess, meta: { title: '井字棋对战', requiresSvip: true, requiresAuth: true } },

  // 404 兜底
  { path: '*', redirect: '/blog' }
];

const router = new Router({
  mode: 'history',
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) return { selector: to.hash, behavior: 'smooth' };
    return { x: 0, y: 0 };
  },
  routes
});

// ====== 全局前置守卫 ======

router.beforeEach(async (to, from, next) => {
  store.dispatch('init');

  // 1. Token 过期处理
  const token = store.getters.getToken;
  if (token && store.getters.isTokenExpired) {
    const isPageJustOpened = !from.name;

    if (isPageJustOpened) {
      // 页面刚打开，Token 已过期 → 直接登出
      store.dispatch('logout');
      return next('/login');
    }

    // 页面打开期间过期 → 尝试刷新（复用 api.js 的刷新逻辑）
    try {
      // 动态导入 api 模块的刷新函数（避免循环依赖）
      const { default: apiMethods } = await import('../utils/api');
      const refreshResponse = await apiMethods.auth.getCurrentUser();
      // 如果 getCurrentUser 成功，说明 token 已被 api 拦截器刷新
      // 不需要额外操作
    } catch {
      store.dispatch('logout');
      return next('/login');
    }
  }

  // 2. 权限检查
  const isLoggedIn = store.getters.isLoggedIn;
  const userRole = store.getters.getUserRole;

  if (!isLoggedIn && !to.meta.public) {
    return next('/login');
  }

  if (isLoggedIn && to.meta.public) {
    return next(userRole === 'admin' ? '/admin' : '/blog');
  }

  // 3. SVIP 权限
  if (to.meta.requiresSvip && !['svip', 'admin'].includes(userRole)) {
    alert('权限不足：仅SVIP会员可访问此功能');
    return next('/blog');
  }

  // 4. 管理员权限（支持路由继承）
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);
  if (requiresAdmin && userRole !== 'admin') {
    alert('权限不足：仅管理员可访问后台');
    return next('/blog');
  }

  // 5. 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} | 攻略类博客`;
  }

  next();
});

// 全局后置钩子 - 埋点/监控预留
router.afterEach(() => {
  // 页面切换后可在此添加 PV 统计等
});

export default router;
