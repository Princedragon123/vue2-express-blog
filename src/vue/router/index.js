// router/index.js - Vue Router 路由配置

import Vue from 'vue';
import Router from 'vue-router';
import store from '../store';
import YmtEtj from '../components/interactive-food/YmtEtj.vue';

const AuthPage = () => import(/* webpackChunkName: "auth" */ '../components/AuthPage.vue');

const Blog = () => import(/* webpackChunkName: "blog" */ '../components/Blog.vue');
const Create = () => import(/* webpackChunkName: "create" */ '../components/Create.vue');

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

const ZhihuDetail = () => import(/* webpackChunkName: "detail" */ '../components/ZhihuDetail.vue');

const AdminDashboard = () => import(/* webpackChunkName: "admin" */ '../components/AdminDashboard.vue');
const AdminUsers = () => import(/* webpackChunkName: "admin" */ '../components/AdminUsers.vue');
const AdminBlogs = () => import(/* webpackChunkName: "admin" */ '../components/AdminBlogs.vue');

const MeowChess = () => import(/* webpackChunkName: "game" */ '../components/meow-chess/MeowChess.vue');

Vue.use(Router);

const router = new Router({
  mode: 'history',
  scrollBehavior() {
    return { x: 0, y: 0 };
  },
  routes: [
    { path: '/', name: 'home', redirect: '/blog' },
    { path: '/login', name: 'login', component: AuthPage },
    { path: '/register', name: 'register', component: AuthPage },
    { path: '/blog', name: 'Blog', component: Blog },
    { path: '/create', name: 'Create', component: Create },
    { path: '/zhihu-detail/:id', name: 'ZhihuDetail', component: ZhihuDetail },
    { path: '/following', name: 'Following', component: Following },
    { path: '/followers', name: 'Followers', component: Followers },
    { path: '/user-dynamic', name: 'UserDynamic', component: UserDynamic },
    { path: '/messages', name: 'Messages', component: Messages },
    { path: '/notifications', name: 'Notifications', component: Notifications },
    { path: '/profile/:userId?', name: 'Profile', component: Profile },
    { path: '/edit/:id', name: 'Edit', component: Create },
    { path: '/topics', name: 'TopicList', component: TopicList },
    { path: '/topic/:id', name: 'TopicDetail', component: TopicDetail },
    { path: '/search', name: 'Search', component: Search },
    { path: '/my-profile', name: 'ProfileSettings', component: ProfileSettings },
    { path: '/my-creation', name: 'MyCreation', component: MyCreation },
    { path: '/edit-profile', name: 'EditProfile', component: EditProfile },
    { path: '/admin', name: 'AdminDashboard', component: AdminDashboard },
    { path: '/admin/users', name: 'AdminUsers', component: AdminUsers },
    { path: '/admin/blogs', name: 'AdminBlogs', component: AdminBlogs },
    { path: '/ymt', name: 'ymtEtj', component: YmtEtj },
    { path: '/meow-chess', name: 'MeowChess', component: MeowChess },
    { path: '*', redirect: '/blog' }
  ]
});

// 全局路由守卫（最终权限版 ✅）

// Token 刷新锁：防止多个路由同时触发多次刷新
let isRefreshing = false;

// 等待刷新完成的队列（并发路由跳转时排队）
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

router.beforeEach(async (to, from, next) => {
  store.dispatch('init');

  // 1. Token 过期 → 尝试自动续期（而不是直接踢去登录页）
  const token = store.getters.getToken;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp < Date.now() / 1000) {
        // Token 过期了！先尝试续期，不要直接踢人
        if (isRefreshing) {
          // 已经在刷新中 → 排队等待
          return new Promise(resolve => {
            subscribeTokenRefresh(newToken => {
              resolve(next()); // 刷新完成后放行
            });
          });
        }

        isRefreshing = true;
        try {
          const res = await fetch('/api/auth/refresh-token', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();

          if (data.success && data.token) {
            // 续期成功！更新 Token 并放行
            store.dispatch('loginSuccess', {
              user: data.user,
              token: data.token,
              rememberMe: localStorage.getItem('token') !== null
            });
            onRefreshed(data.token);
            isRefreshing = false;
            return next(); // 继续原来的跳转
          } else {
            // 续期失败（账号可能被封/删了）→ 才踢去登录页
            store.dispatch('logout');
            isRefreshing = false;
            return next('/login');
          }
        } catch (err) {
          // 网络错误等 → 踢去登录页
          console.error('Token 刷新失败:', err);
          store.dispatch('logout');
          isRefreshing = false;
          return next('/login');
        }
      }
    } catch (error) {
      // Token 格式错误 → 踢去登录页
      store.dispatch('logout');
      return next('/login');
    }
  }

  // 2. 公开路由（仅登录/注册页游客可访问）
  const publicRoutes = ['/login', '/register'];
  const isPublic = publicRoutes.includes(to.path);
  const isLoggedIn = store.getters.isLoggedIn;
  const userRole = store.getters.getUserRole;

  // 未登录访问私有路由 → 跳登录
  if (!isLoggedIn && !isPublic) {
    return next('/login');
  }

  // 已登录访问登录/注册页 → 跳对应首页
  if (isLoggedIn && (to.path === '/login' || to.path === '/register')) {
    return next(userRole === 'admin' ? '/admin' : '/blog');
  }

  // 3. 🔴 SVIP 专属页面：仅 svip / admin 可访问
  const svipRoutes = ['/ymt', '/meow-chess'];
  if (svipRoutes.includes(to.path) && !['svip', 'admin'].includes(userRole)) {
    alert('权限不足：仅SVIP会员可访问');
    return next('/blog');
  }

  // 4. 🔴 管理员页面：仅 admin 可访问
  if (to.path.startsWith('/admin') && userRole !== 'admin') {
    alert('权限不足：仅管理员可访问后台');
    return next('/blog');
  }

  // 所有校验通过 → 放行
  next();
});

export default router;