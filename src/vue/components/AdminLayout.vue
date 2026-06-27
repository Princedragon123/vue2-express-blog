<template>
  <div class="admin-layout">
    <!-- 移动端顶部栏 -->
    <header class="admin-layout__mobile-header" v-if="isMobile">
      <button class="admin-layout__menu-btn" @click="toggleMobileSidebar" aria-label="菜单">
        <span :class="{ 'hamburger--open': mobileSidebarOpen }" class="hamburger-icon">
          <span></span><span></span><span></span>
        </span>
      </button>
      <h1 class="admin-layout__mobile-title">{{ $route.meta.title || '管理后台' }}</h1>
    </header>

    <!-- 侧边栏 - 桌面端固定 / 移动端覆盖层 -->
    <aside class="admin-layout__sidebar" :class="{
      'admin-layout__sidebar--collapsed': isCollapsed && !isMobile,
      'admin-layout__sidebar--mobile-open': isMobile && mobileSidebarOpen
    }">
      <div class="sidebar__header">
        <h2 class="sidebar__title">管理后台</h2>
        <button v-if="!isMobile" class="sidebar__toggle-btn" @click="toggleSidebar">
          {{ isCollapsed ? '»' : '«' }}
        </button>
        <button v-else class="sidebar__close-btn" @click="toggleMobileSidebar">✕</button>
      </div>

      <nav class="sidebar__nav">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="sidebar__nav-item"
          active-class="sidebar__nav-item--active"
          :title="isCollapsed && !isMobile ? item.title : ''"
          @click.native="closeMobileSidebar"
        >
          <span class="sidebar__nav-icon">{{ item.icon }}</span>
          <span v-show="!isCollapsed || isMobile" class="sidebar__nav-label">{{ item.title }}</span>
        </router-link>
      </nav>

      <div class="sidebar__footer">
        <router-link to="/blog" class="sidebar__back-link" title="返回前台" @click.native="closeMobileSidebar">
          <span class="sidebar__nav-icon">←</span>
          <span v-show="!isCollapsed || isMobile" class="sidebar__nav-label">返回前台</span>
        </router-link>
      </div>
    </aside>

    <!-- 移动端遮罩 -->
    <div v-if="isMobile && mobileSidebarOpen" class="admin-layout__overlay" @click="toggleMobileSidebar"></div>

    <!-- 主内容区 -->
    <main class="admin-layout__main" :class="{
      'admin-layout__main--desktop': !isMobile && !isCollapsed,
      'admin-layout__main--desktop-collapsed': !isMobile && isCollapsed,
      'admin-layout__main--mobile': isMobile
    }">
      <!-- 页面标题（桌面端） -->
      <header v-if="!isMobile" class="admin-layout__page-header">
        <h1>{{ $route.meta.title || '管理后台' }}</h1>
        <p v-if="$route.meta.subtitle">{{ $route.meta.subtitle }}</p>
      </header>

      <!-- 子路由 -->
      <router-view :key="$route.fullPath" v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script>
export default {
  name: 'AdminLayout',

  data() {
    return {
      isCollapsed: false,
      mobileSidebarOpen: false,
      isMobile: false,
      menuItems: [
        { path: '/admin', icon: '📊', title: '仪表盘' },
        { path: '/admin/users', icon: '👥', title: '用户管理' },
        { path: '/admin/blogs', icon: '📝', title: '博客管理' }
      ]
    };
  },

  created() {
    this.isMobile = window.innerWidth <= 768;
    window.addEventListener('resize', this.handleResize);
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
  },

  methods: {
    handleResize() {
      this.isMobile = window.innerWidth <= 768;
    },
    toggleSidebar() {
      this.isCollapsed = !this.isCollapsed;
    },
    toggleMobileSidebar() {
      this.mobileSidebarOpen = !this.mobileSidebarOpen;
    },
    closeMobileSidebar() {
      if (this.isMobile) this.mobileSidebarOpen = false;
    }
  }
};
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #f5f6f8;
}

/* 移动端顶部栏 */
.admin-layout__mobile-header {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 48px;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  color: #fff;
  align-items: center;
  padding: 0 12px;
  z-index: 200;
  gap: 12px;
}

.admin-layout__menu-btn {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.hamburger-icon {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 18px;
}

.hamburger-icon span {
  display: block;
  height: 2px;
  background: #fff;
  border-radius: 1px;
  transition: all 0.25s ease;
}

.hamburger--open span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
.hamburger--open span:nth-child(2) { opacity: 0; }
.hamburger--open span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }

.admin-layout__mobile-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

/* 侧边栏 */
.admin-layout__sidebar {
  width: 220px;
  min-width: 220px;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 150;
  transition: all 0.3s ease;
}

.admin-layout__sidebar--collapsed {
  width: 60px;
  min-width: 60px;
}

.sidebar__header {
  padding: 20px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar__title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  white-space: nowrap;
}

.sidebar__toggle-btn,
.sidebar__close-btn {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.sidebar__toggle-btn:hover,
.sidebar__close-btn:hover { background: rgba(255, 255, 255, 0.25); }

/* 导航 */
.sidebar__nav {
  flex: 1;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar__nav-item {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  color: rgba(255, 255, 255, 0.65);
  text-decoration: none;
  border-radius: 10px;
  transition: all 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  /* 最小触摸目标 */
  min-height: 44px;
}

.sidebar__nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.sidebar__nav-item--active {
  background: linear-gradient(135deg, #ec4899, #db2777);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
}

.sidebar__nav-icon {
  font-size: 18px;
  flex-shrink: 0;
  width: 32px;
  text-align: center;
}

.sidebar__nav-label { margin-left: 10px; font-size: 14px; }

.sidebar__footer {
  padding: 12px 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar__back-link {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  color: rgba(255, 255, 255, 0.4);
  text-decoration: none;
  border-radius: 10px;
  transition: all 0.2s ease;
  min-height: 44px;
}

.sidebar__back-link:hover { background: rgba(255, 255, 255, 0.06); color: rgba(255, 255, 255, 0.8); }

/* 遮罩层 */
.admin-layout__overlay {
  display: none;
}

/* 主内容 */
.admin-layout__main {
  flex: 1;
  min-height: 100vh;
  padding: 24px;
  transition: margin-left 0.3s ease;
}

.admin-layout__main--desktop { margin-left: 220px; }
.admin-layout__main--desktop-collapsed { margin-left: 60px; }
.admin-layout__main--mobile { margin-left: 0; margin-top: 48px; padding: 16px; }

.admin-layout__page-header {
  margin-bottom: 24px;
}

.admin-layout__page-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 4px;
}

.admin-layout__page-header p {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

/* 路由切换动画 */
.page-fade-enter-active,
.page-fade-leave-active { transition: opacity 0.2s ease; }
.page-fade-enter-from,
.page-fade-leave-to { opacity: 0; }

/* 移动端 */
@media (max-width: 768px) {
  .admin-layout__mobile-header { display: flex; }

  .admin-layout__sidebar {
    transform: translateX(-100%);
    width: 260px;
    min-width: 260px;
    box-shadow: none;
    z-index: 300;
  }

  .admin-layout__sidebar--mobile-open {
    transform: translateX(0);
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);
  }

  .admin-layout__overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 250;
    animation: fadeIn 0.2s ease;
  }

  .admin-layout__main--mobile {
    padding: 12px;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
