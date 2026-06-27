<template>
  <nav class="top-navbar">
    <div class="top-navbar__container">
      <!-- Logo -->
      <div class="top-navbar__brand">
        <h2
          class="top-navbar__logo"
          @dblclick="handleLogoDoubleClick"
          @mousedown="handleLogoMouseDown"
        >kk攻略博客</h2>
      </div>

      <!-- 搜索框 -->
      <div v-if="$route.path !== '/search'" class="top-navbar__search" @click="$router.push('/search')">
        <span class="top-navbar__search-icon">🔍</span>
        <input type="text" placeholder="搜索攻略、用户" readonly tabindex="-1">
      </div>
      <div v-else class="top-navbar__search top-navbar__search--minimized">
        <span class="top-navbar__search-dots">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        </span>
      </div>

      <!-- 桌面导航 -->
      <div class="top-navbar__desktop-nav">
        <router-link to="/blog" class="nav-link" :class="{ 'nav-link--active': $route.path === '/blog' }">
          <span class="nav-link__icon">🧭</span><span>发现</span>
        </router-link>
        <router-link to="/topics" class="nav-link" :class="{ 'nav-link--active': $route.path === '/topics' }">
          <span class="nav-link__icon">💬</span><span>话题圈</span>
        </router-link>
        <router-link v-if="isLoggedIn" to="/following" class="nav-link" :class="{ 'nav-link--active': $route.path === '/following' }">
          <span class="nav-link__icon">👥</span><span>关注</span>
        </router-link>
        <router-link v-if="isLoggedIn" to="/create" class="nav-link nav-link--create">
          <span class="nav-link__icon">➕</span><span>发布</span>
        </router-link>
        <router-link v-if="isLoggedIn" to="/messages" class="nav-link" :class="{ 'nav-link--active': $route.path === '/messages' }">
          <span class="nav-link__icon">✉️</span><span>私信</span>
        </router-link>
        <router-link v-if="isAdmin" to="/admin" class="nav-link" :class="{ 'nav-link--active': $route.path.startsWith('/admin') }">
          <span class="nav-link__icon">🛡️</span><span>管理</span>
        </router-link>
      </div>

      <!-- 用户头像 -->
      <div class="top-navbar__actions">
        <div v-if="isLoggedIn" class="top-navbar__avatar" @click="goToProfile">
          <img :src="userAvatar" :alt="username" class="top-navbar__avatar-img" @error="onAvatarError">
        </div>
        <!-- 汉堡菜单按钮（仅移动端） -->
        <button class="top-navbar__hamburger" @click="toggleDrawer" :aria-label="drawerOpen ? '关闭菜单' : '打开菜单'">
          <span :class="{ 'hamburger-line': true, 'hamburger-line--open': drawerOpen }"></span>
          <span :class="{ 'hamburger-line': true, 'hamburger-line--open': drawerOpen }"></span>
          <span :class="{ 'hamburger-line': true, 'hamburger-line--open': drawerOpen }"></span>
        </button>
      </div>
    </div>

    <!-- 移动端遮罩层 -->
    <div v-if="drawerOpen" class="drawer-overlay" @click="toggleDrawer" @touchmove.prevent></div>

    <!-- 移动端抽屉菜单 -->
    <div class="mobile-drawer" :class="{ 'mobile-drawer--open': drawerOpen }">
      <div class="mobile-drawer__header">
        <span class="mobile-drawer__title">菜单</span>
        <button class="mobile-drawer__close" @click="toggleDrawer">✕</button>
      </div>
      <nav class="mobile-drawer__nav">
        <router-link to="/blog" class="mobile-drawer__link" @click.native="toggleDrawer">
          <span>🧭</span><span>发现</span>
        </router-link>
        <router-link to="/topics" class="mobile-drawer__link" @click.native="toggleDrawer">
          <span>💬</span><span>话题圈</span>
        </router-link>
        <router-link to="/create" class="mobile-drawer__link mobile-drawer__link--create" @click.native="toggleDrawer">
          <span>➕</span><span>发布攻略</span>
        </router-link>
        <router-link to="/following" class="mobile-drawer__link" @click.native="toggleDrawer">
          <span>👥</span><span>我的关注</span>
        </router-link>
        <router-link to="/messages" class="mobile-drawer__link" @click.native="toggleDrawer">
          <span>✉️</span><span>我的私信</span>
        </router-link>
        <router-link to="/profile" class="mobile-drawer__link" @click.native="toggleDrawer">
          <span>👤</span><span>个人中心</span>
        </router-link>
        <router-link v-if="isAdmin" to="/admin" class="mobile-drawer__link mobile-drawer__link--admin" @click.native="toggleDrawer">
          <span>🛡️</span><span>管理后台</span>
        </router-link>
      </nav>
    </div>
  </nav>
</template>

<script>
import { getAuthorAvatar } from '../utils/avatarUtils';

export default {
  name: 'TopNavbar',

  data() {
    return {
      userInfo: null,
      drawerOpen: false
    };
  },

  computed: {
    username() {
      return this.$store.getters.currentUser?.username || '游戏达人';
    },
    userAvatar() {
      const user = this.userInfo || this.$store.getters.currentUser;
      if (!user) return getAuthorAvatar(null, 40);
      return getAuthorAvatar(user.avatar || user.profile?.avatar || user, 40);
    },
    isLoggedIn() {
      return this.$store.getters.isLoggedIn;
    },
    isAdmin() {
      return this.$store.getters.currentUser?.role === 'admin';
    }
  },

  mounted() {
    if (this.isLoggedIn) {
      this.fetchUserInfo();
    }
  },

  methods: {
    toggleDrawer() {
      this.drawerOpen = !this.drawerOpen;
      // 防止背景滚动
      document.body.style.overflow = this.drawerOpen ? 'hidden' : '';
    },

    handleLogoDoubleClick(event) {
      if (event.ctrlKey && event.shiftKey) {
        this.$router.push('/ymt');
      }
    },

    handleLogoMouseDown(event) {
      if (event.ctrlKey && event.shiftKey) {
        event.preventDefault();
      }
    },

    async fetchUserInfo() {
      try {
        const response = await this.$http.auth.getCurrentUser();
        if (response.success && response.data) {
          this.userInfo = response.data;
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
      }
    },

    onAvatarError(event) {
      event.target.src = getAuthorAvatar(null, 40);
    },

    goToProfile() {
      if (this.$route.path.startsWith('/profile/')) {
        window.location.reload();
      } else {
        this.$router.push('/profile');
      }
    }
  }
};
</script>

<style scoped>
/* 顶部导航栏 */
.top-navbar {
  background: linear-gradient(135deg, #fef3c7, #fce7f3);
  box-shadow: 0 2px 12px rgba(236, 72, 153, 0.12);
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 2px solid rgba(236, 72, 153, 0.15);
  height: 56px;
  display: flex;
  align-items: center;
}

.top-navbar__container {
  width: 95%;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Logo */
.top-navbar__logo {
  margin: 0;
  font-size: 1.15rem;
  color: #ec4899;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
}

/* 搜索框 */
.top-navbar__search {
  flex: 1;
  max-width: 360px;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 20px;
  padding: 8px 14px;
  border: 1.5px solid rgba(236, 72, 153, 0.15);
  cursor: pointer;
  transition: all 0.25s ease;
}

.top-navbar__search:hover {
  border-color: #ec4899;
  background: rgba(255, 255, 255, 0.95);
}

.top-navbar__search-icon {
  margin-right: 8px;
  flex-shrink: 0;
}

.top-navbar__search input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.85rem;
  color: #999;
  pointer-events: none;
  min-width: 0;
}

.top-navbar__search--minimized {
  max-width: 60px;
  justify-content: center;
  padding: 8px;
}

.top-navbar__search-dots {
  display: flex;
  gap: 4px;
}

.top-navbar__search-dots .dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #ec4899;
  animation: dotBounce 1.4s ease-in-out infinite;
}
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes dotBounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* 桌面导航 */
.top-navbar__desktop-nav {
  display: none;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 14px;
  border-radius: 16px;
  font-size: 0.82rem;
  font-weight: 500;
  color: #555;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.nav-link:hover {
  background: rgba(236, 72, 153, 0.08);
  color: #ec4899;
}

.nav-link--active {
  background: rgba(236, 72, 153, 0.1);
  color: #ec4899;
  font-weight: 600;
}

.nav-link--create {
  background: linear-gradient(135deg, #ec4899, #db2777);
  color: #fff;
}

.nav-link--create:hover {
  background: linear-gradient(135deg, #db2777, #ec4899);
  color: #fff;
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
}

.nav-link__icon {
  font-size: 1rem;
}

/* 用户头像 */
.top-navbar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.top-navbar__avatar {
  cursor: pointer;
  flex-shrink: 0;
}

.top-navbar__avatar-img {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ec4899;
  transition: transform 0.25s ease;
}

.top-navbar__avatar:active .top-navbar__avatar-img {
  transform: scale(0.92);
}

/* 汉堡菜单按钮（移动端） */
.top-navbar__hamburger {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 40px;
  height: 40px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.6);
  border: 1.5px solid rgba(236, 72, 153, 0.2);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.top-navbar__hamburger:active {
  background: rgba(236, 72, 153, 0.1);
}

.hamburger-line {
  display: block;
  width: 100%;
  height: 2px;
  background: #ec4899;
  border-radius: 2px;
  transition: all 0.3s ease;
  transform-origin: center;
}

.hamburger-line--open:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}
.hamburger-line--open:nth-child(2) {
  opacity: 0;
  transform: scaleX(0);
}
.hamburger-line--open:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

/* 遮罩层 */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 2000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 移动端抽屉菜单 */
.mobile-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 280px;
  max-width: 80vw;
  background: linear-gradient(180deg, #fff 0%, #fef3c7 100%);
  z-index: 2001;
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  /* 安全区域适配 */
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.mobile-drawer--open {
  transform: translateX(0);
}

.mobile-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(236, 72, 153, 0.1);
}

.mobile-drawer__title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #ec4899;
}

.mobile-drawer__close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(236, 72, 153, 0.08);
  color: #ec4899;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.mobile-drawer__close:active {
  background: rgba(236, 72, 153, 0.2);
}

.mobile-drawer__nav {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mobile-drawer__link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 500;
  color: #444;
  transition: all 0.2s ease;
  text-decoration: none;
  /* 最小触摸目标 44px */
  min-height: 48px;
}

.mobile-drawer__link:active {
  background: rgba(236, 72, 153, 0.08);
  transform: scale(0.98);
}

.mobile-drawer__link--create {
  background: linear-gradient(135deg, #ec4899, #db2777);
  color: #fff;
  font-weight: 600;
  justify-content: center;
  margin: 8px 0;
}

.mobile-drawer__link--create:active {
  background: linear-gradient(135deg, #db2777, #ec4899);
  transform: scale(0.97);
}

.mobile-drawer__link--admin {
  margin-top: auto;
  border: 1.5px dashed rgba(236, 72, 153, 0.3);
  color: #ec4899;
}

/* 响应式 */
@media (min-width: 1024px) {
  .top-navbar__desktop-nav { display: flex; }
  .top-navbar__search { max-width: 360px; }
  .top-navbar__hamburger { display: none; }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .top-navbar__desktop-nav { display: flex; }
  .top-navbar__search { max-width: 180px; }
  .top-navbar__hamburger { display: none; }
  .nav-link span:not(.nav-link__icon) { display: none; }
  .nav-link { padding: 8px 10px; }
}

@media (max-width: 767px) {
  .top-navbar__desktop-nav { display: none; }
  .top-navbar__search { max-width: 100px; margin: 0 4px; }
  .top-navbar__search input { font-size: 0.75rem; }
  .top-navbar__logo { font-size: 1rem; }
  .top-navbar__hamburger { display: flex; }
}
</style>
