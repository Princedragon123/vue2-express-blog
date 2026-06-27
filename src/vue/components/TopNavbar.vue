<template>
  <nav class="nav">
    <div class="nav__inner">
      <router-link to="/blog" class="nav__logo">KK攻略</router-link>

      <!-- Search -->
      <div v-if="$route.path !== '/search'" class="nav__search" @click="$router.push('/search')">
        <svg-icon name="search" :size="16" class-name="nav__search-icon" />
        <span class="nav__search-placeholder">搜索</span>
      </div>

      <!-- Desktop links -->
      <div class="nav__links">
        <router-link to="/blog" class="nav__link" :class="{ 'nav__link--active': $route.path === '/blog' }">发现</router-link>
        <router-link to="/topics" class="nav__link" :class="{ 'nav__link--active': $route.path === '/topics' }">话题</router-link>
        <router-link v-if="isLoggedIn" to="/following" class="nav__link" :class="{ 'nav__link--active': $route.path === '/following' }">关注</router-link>
        <router-link v-if="isLoggedIn" to="/create" class="nav__link nav__link--cta">写文章</router-link>
        <router-link v-if="isLoggedIn" to="/messages" class="nav__link" :class="{ 'nav__link--active': $route.path === '/messages' }">私信</router-link>
        <router-link v-if="isAdmin" to="/admin" class="nav__link" :class="{ 'nav__link--active': $route.path.startsWith('/admin') }">管理</router-link>
      </div>

      <!-- Avatar + hamburger -->
      <div class="nav__actions">
        <div v-if="isLoggedIn" class="nav__avatar" @click="goToProfile">
          <img :src="userAvatar" :alt="username" class="nav__avatar-img" @error="onAvatarError">
        </div>
        <button class="nav__hamburger" @click="toggleDrawer" :aria-label="drawerOpen ? '关闭' : '菜单'">
          <span :class="{ 'hamburger--open': drawerOpen }" />
          <span :class="{ 'hamburger--open': drawerOpen }" />
          <span :class="{ 'hamburger--open': drawerOpen }" />
        </button>
      </div>
    </div>

    <!-- Mobile overlay -->
    <div v-if="drawerOpen" class="nav__overlay" @click="toggleDrawer" @touchmove.prevent />

    <!-- Mobile drawer -->
    <div class="nav__drawer" :class="{ 'nav__drawer--open': drawerOpen }">
      <div class="nav__drawer-header">
        <span>导航</span>
        <button class="nav__drawer-close" @click="toggleDrawer">&times;</button>
      </div>
      <div class="nav__drawer-body">
        <router-link to="/blog" class="nav__drawer-link" @click.native="toggleDrawer">发现</router-link>
        <router-link to="/topics" class="nav__drawer-link" @click.native="toggleDrawer">话题圈</router-link>
        <router-link to="/create" class="nav__drawer-link nav__drawer-link--cta" @click.native="toggleDrawer">写文章</router-link>
        <router-link to="/following" class="nav__drawer-link" @click.native="toggleDrawer">我的关注</router-link>
        <router-link to="/messages" class="nav__drawer-link" @click.native="toggleDrawer">私信</router-link>
        <router-link to="/data-dashboard" class="nav__drawer-link" @click.native="toggleDrawer">数据看板</router-link>
        <router-link v-if="isAdmin" to="/admin" class="nav__drawer-link" @click.native="toggleDrawer">管理后台</router-link>
      </div>
    </div>
  </nav>
</template>

<script>
import { getAuthorAvatar } from '../utils/avatarUtils';

export default {
  name: 'TopNavbar',
  data() { return { userInfo: null, drawerOpen: false }; },
  computed: {
    username() { return this.$store.getters.currentUser?.username || ''; },
    userAvatar() {
      const u = this.userInfo || this.$store.getters.currentUser;
      return getAuthorAvatar(u?.avatar || u?.profile?.avatar || u, 40);
    },
    isLoggedIn() { return this.$store.getters.isLoggedIn; },
    isAdmin() { return this.$store.getters.currentUser?.role === 'admin'; }
  },
  mounted() { if (this.isLoggedIn) this.fetchUserInfo(); },
  methods: {
    toggleDrawer() { this.drawerOpen = !this.drawerOpen; document.body.style.overflow = this.drawerOpen ? 'hidden' : ''; },
    async fetchUserInfo() {
      try { const r = await this.$http.auth.getCurrentUser(); if (r.success) this.userInfo = r.data; } catch {}
    },
    onAvatarError(e) { e.target.src = getAuthorAvatar(null, 40); },
    goToProfile() { this.$router.push(this.$route.path.startsWith('/profile') ? '/profile' : '/profile'); }
  }
};
</script>

<style scoped>
.nav {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 56px;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
}
.nav__inner {
  width: 92%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 16px;
}
.nav__logo {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.01em;
  white-space: nowrap;
}
.nav__logo:hover { color: #e11d48; }

/* Search */
.nav__search {
  flex: 1;
  max-width: 320px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #f3f4f6;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s;
}
.nav__search:hover { background: #e5e7eb; }
.nav__search-icon { color: #9ca3af; flex-shrink: 0; }
.nav__search-placeholder { color: #9ca3af; font-size: 0.85rem; }

/* Desktop links */
.nav__links { display: none; align-items: center; gap: 4px; margin-left: auto; }
.nav__link {
  padding: 7px 14px;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #3d3d3d;
  transition: all 0.2s;
  white-space: nowrap;
}
.nav__link:hover { background: #f3f4f6; color: #1a1a1a; }
.nav__link--active { color: #e11d48; background: #fff1f2; }
.nav__link--cta {
  background: #e11d48;
  color: #fff;
  font-weight: 600;
  padding: 7px 18px;
}
.nav__link--cta:hover { background: #f43f5e; color: #fff; }

/* Avatar */
.nav__actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.nav__avatar { cursor: pointer; flex-shrink: 0; }
.nav__avatar-img {
  width: 32px; height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e5e7eb;
  transition: border-color 0.2s;
}
.nav__avatar:hover .nav__avatar-img { border-color: #e11d48; }

/* Hamburger */
.nav__hamburger {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 36px; height: 36px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  justify-content: center;
}
.nav__hamburger span {
  display: block;
  height: 2px;
  background: #3d3d3d;
  border-radius: 2px;
  transition: all 0.25s;
}
.nav__hamburger .hamburger--open:nth-child(1) { transform: translateY(6px) rotate(45deg); }
.nav__hamburger .hamburger--open:nth-child(2) { opacity: 0; }
.nav__hamburger .hamburger--open:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }

/* Overlay */
.nav__overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.3);
  z-index: 200;
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

/* Drawer */
.nav__drawer {
  position: fixed;
  top: 0; right: 0; bottom: 0;
  width: 280px; max-width: 80vw;
  background: #fff;
  z-index: 201;
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: -4px 0 24px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  padding-top: env(safe-area-inset-top, 0);
  padding-bottom: env(safe-area-inset-bottom, 0);
}
.nav__drawer--open { transform: translateX(0); }
.nav__drawer-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
  font-weight: 600;
}
.nav__drawer-close {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem; color: #6b7280;
}
.nav__drawer-body { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 4px; }
.nav__drawer-link {
  display: flex; align-items: center;
  padding: 14px 16px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  color: #3d3d3d;
  transition: all 0.15s;
  min-height: 48px;
}
.nav__drawer-link:active { background: #f3f4f6; }
.nav__drawer-link--cta { background: #e11d48; color: #fff; justify-content: center; margin: 8px 0; font-weight: 600; }
.nav__drawer-link--cta:active { background: #f43f5e; }

@media (min-width: 768px) {
  .nav__links { display: flex; }
  .nav__hamburger { display: none; }
}
@media (max-width: 767px) {
  .nav__links { display: none; }
  .nav__search { max-width: 120px; }
}
</style>
