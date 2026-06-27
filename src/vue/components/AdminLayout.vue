<template>
  <div class="admin">
    <!-- Mobile top bar -->
    <header class="admin__mob-bar" v-if="isMobile">
      <button class="admin__mob-btn" @click="mobileOpen = true"><span /><span /><span /></button>
      <h1 class="admin__mob-title">{{ $route.meta.title || '管理' }}</h1>
    </header>

    <!-- Sidebar -->
    <aside class="admin__sidebar" :class="{ 'admin__sidebar--collapsed': !isMobile && collapsed, 'admin__sidebar--mobile': isMobile && mobileOpen }">
      <div class="admin__sidebar-head">
        <h2 class="admin__sidebar-title">管理</h2>
        <button v-if="!isMobile" class="admin__sidebar-toggle" @click="collapsed = !collapsed">{{ collapsed ? '»' : '«' }}</button>
        <button v-else class="admin__sidebar-close" @click="mobileOpen = false">&times;</button>
      </div>
      <nav class="admin__nav">
        <router-link v-for="m in menu" :key="m.path" :to="m.path" class="admin__nav-item" active-class="admin__nav-item--active" @click.native="mobileOpen = false">
          <span class="admin__nav-icon">{{ m.icon }}</span>
          <span v-show="!collapsed || isMobile" class="admin__nav-label">{{ m.title }}</span>
        </router-link>
      </nav>
      <router-link to="/blog" class="admin__back" @click.native="mobileOpen = false">&larr; 返回前台</router-link>
    </aside>

    <!-- Mobile overlay -->
    <div v-if="isMobile && mobileOpen" class="admin__overlay" @click="mobileOpen = false" />

    <!-- Main -->
    <main class="admin__main" :class="{ 'admin__main--expanded': collapsed && !isMobile }">
      <header v-if="!isMobile" class="admin__main-head">
        <h1 class="admin__main-title">{{ $route.meta.title || '管理后台' }}</h1>
      </header>
      <router-view :key="$route.fullPath" v-slot="{ Component }">
        <transition name="fade" mode="out-in"><component :is="Component" /></transition>
      </router-view>
    </main>
  </div>
</template>

<script>
export default {
  name: 'AdminLayout',
  data() { return { collapsed: false, mobileOpen: false, isMobile: window.innerWidth <= 768, menu: [{ path: '/admin', icon: '§', title: '仪表盘' }, { path: '/admin/users', icon: '◎', title: '用户管理' }, { path: '/admin/blogs', icon: '¶', title: '博客管理' }] }; },
  created() { window.addEventListener('resize', () => { this.isMobile = window.innerWidth <= 768; }); }
};
</script>

<style scoped>
.admin { display: flex; min-height: 100vh; background: #faf8f5; }
.admin__mob-bar { display: none; position: fixed; top: 0; left: 0; right: 0; height: 48px; background: #1a1a1a; color: #fff; align-items: center; padding: 0 12px; z-index: 200; gap: 12px; }
.admin__mob-btn { width: 36px; height: 36px; display: flex; flex-direction: column; gap: 4px; justify-content: center; padding: 8px; background: rgba(255,255,255,0.1); border: none; border-radius: 6px; cursor: pointer; }
.admin__mob-btn span { display: block; height: 2px; background: #fff; border-radius: 1px; }
.admin__mob-title { font-size: 1rem; font-weight: 600; margin: 0; }

.admin__sidebar { width: 220px; min-width: 220px; background: #1a1a1a; color: #fff; display: flex; flex-direction: column; position: fixed; top: 0; left: 0; bottom: 0; z-index: 150; transition: width 0.3s, transform 0.3s; }
.admin__sidebar--collapsed { width: 60px; min-width: 60px; }
.admin__sidebar-head { padding: 20px 16px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: space-between; }
.admin__sidebar-title { font-size: 1rem; font-weight: 700; margin: 0; white-space: nowrap; }
.admin__sidebar-toggle, .admin__sidebar-close { background: rgba(255,255,255,0.1); border: none; color: #fff; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; font-size: 14px; }
.admin__nav { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 4px; }
.admin__nav-item { display: flex; align-items: center; padding: 10px 14px; color: rgba(255,255,255,0.55); text-decoration: none; border-radius: 10px; transition: all 0.2s; white-space: nowrap; min-height: 44px; }
.admin__nav-item:hover { background: rgba(255,255,255,0.06); color: #fff; }
.admin__nav-item--active { background: #e11d48; color: #fff; font-weight: 600; }
.admin__nav-icon { width: 28px; text-align: center; font-size: 1rem; flex-shrink: 0; }
.admin__nav-label { margin-left: 10px; font-size: 0.85rem; }
.admin__back { display: flex; align-items: center; padding: 10px 14px; color: rgba(255,255,255,0.3); text-decoration: none; border-top: 1px solid rgba(255,255,255,0.08); font-size: 0.8rem; min-height: 44px; }
.admin__back:hover { color: rgba(255,255,255,0.7); }

.admin__overlay { display: none; }
.admin__main { flex: 1; margin-left: 220px; padding: 24px; min-height: 100vh; transition: margin-left 0.3s; }
.admin__main--expanded { margin-left: 60px; }
.admin__main-head { margin-bottom: 24px; }
.admin__main-title { font-size: 1.4rem; font-weight: 700; color: #1a1a1a; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 768px) {
  .admin__mob-bar { display: flex; }
  .admin__sidebar { transform: translateX(-100%); width: 260px; min-width: 260px; z-index: 300; }
  .admin__sidebar--mobile { transform: translateX(0); box-shadow: 4px 0 24px rgba(0,0,0,0.3); }
  .admin__overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 250; }
  .admin__main { margin-left: 0; margin-top: 48px; padding: 16px; }
}
</style>
