<!-- 
=============================================================================
  TopNavbar.vue - 顶部导航栏组件（学习版）
=============================================================================

【组件职责】
  这是全局顶部导航栏组件，负责：
  1. 显示网站 Logo
  2. 搜索入口
  3. 导航菜单（发现、话题圈、关注、发布、私信、管理）
  4. 用户头像入口

【学习重点】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  1. router-link：Vue Router 的导航组件                                  │
  │  2. 条件渲染：v-if 根据登录状态显示不同内容                              │
  │  3. 动态 class：:class="{ active: 条件 }"                               │
  │  4. 事件处理：@click、@error                                            │
  │  5. 认证状态判断：isLoggedIn()、isAdmin()                                │
  └─────────────────────────────────────────────────────────────────────────┘

【导航菜单说明】
  ┌──────────────┬────────────────────────────────────────────────┐
  │  菜单项       │  显示条件                                      │
  ├──────────────┼────────────────────────────────────────────────┤
  │  发现        │  始终显示                                      │
  │  话题圈      │  始终显示                                      │
  │  我的关注    │  登录后显示                                    │
  │  发布        │  登录后显示                                    │
  │  我的私信    │  登录后显示                                    │
  │  管理        │  仅管理员可见                                  │
  └──────────────┴────────────────────────────────────────────────┘

【面试常问】
  Q: router-link 和 a 标签有什么区别？
  A: router-link 是 Vue Router 提供的组件，点击时不会刷新页面，
     而是通过 JavaScript 切换路由，实现单页应用的无刷新跳转。

  Q: 为什么用 :class="{ active: 条件 }"？
  A: 动态绑定 class，当条件为 true 时添加 active 类，
     用于高亮当前激活的导航项。

=============================================================================
-->
<template>
  <nav class="top-navbar">
    <div class="container">
      <!-- 
        Logo 区域
        【作用】显示网站名称，点击可返回首页
      -->
      <div class="navbar-brand">
        <h2>kk攻略博客</h2>
      </div>
      
      <!-- 
        搜索框区域
        【v-if 条件】不在搜索页面时显示普通搜索框
        【v-else】在搜索页面时显示动态加载效果
        【@click】点击跳转到搜索页面
      -->
      <div v-if="$route.path !== '/search'" class="search-container">
        <div class="search-box" @click="$router.push('/search')">
          <span class="nav-icon">🔍</span>
          <input type="text" placeholder="搜索攻略、用户">
        </div>
      </div>
      <!-- 搜索页面时显示的搜索动态效果 -->
      <div v-else class="search-container search-container-active">
        <div class="search-box search-box-active">
          <span class="nav-icon search-icon-active">🔍</span>
          <div class="loading-dots">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
      </div>
      
      <!-- 
        导航菜单（平板和电脑端）
        【router-link】Vue Router 导航组件
        【:class="{ active: 条件 }"】动态绑定激活样式
        【v-if】根据登录状态和权限控制显示
      -->
      <div class="desktop-nav-menu">
        <!-- 发现页面 - 始终显示 -->
        <router-link to="/blog" class="nav-link" :class="{ active: $route.path === '/blog' }">
          <span class="nav-icon">🧭</span>
          <span>发现</span>
        </router-link>
        
        <!-- 话题圈 - 始终显示 -->
        <router-link to="/topics" class="nav-link" :class="{ active: $route.path === '/topics' }">
          <span class="nav-icon">💬</span>
          <span>话题圈</span>
        </router-link>
        
        <!-- 我的关注 - 登录后显示 -->
        <router-link v-if="isLoggedIn()" to="/following" class="nav-link" :class="{ active: $route.path === '/following' }">
          <span class="nav-icon">👥</span>
          <span>我的关注</span>
        </router-link>
        
        <!-- 发布 - 登录后显示 -->
        <router-link v-if="isLoggedIn()" to="/create" class="nav-link">
          <span class="nav-icon">➕</span>
          <span>发布</span>
        </router-link>
        
        <!-- 我的私信 - 登录后显示 -->
        <router-link v-if="isLoggedIn()" to="/messages" class="nav-link" :class="{ active: $route.path === '/messages' }">
          <span class="nav-icon">✉️</span>
          <span>我的私信</span>
        </router-link>
        
        <!-- 管理 - 仅管理员可见 -->
        <router-link v-if="isLoggedIn() && isAdmin()" to="/admin" class="nav-link" :class="{ active: $route.path.startsWith('/admin') }">
          <span class="nav-icon">🛡️</span>
          <span>管理</span>
        </router-link>
      </div>
      
      <!-- 
        右侧菜单
        【用户头像】点击跳转到个人中心
        【@error】头像加载失败时显示默认图片
      -->
      <div class="navbar-menu">
        <!-- 用户头像 - 登录后显示 -->
        <div v-if="isLoggedIn()" class="user-avatar" @click="goToProfile">
          <img :src="getUserAvatar()" :alt="getUsername()" class="avatar-img" @error="onAvatarError">
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
// ============================================================
// 组件导入区
// ============================================================
import auth from './../utils/auth'  // 认证状态管理工具
import { getAuthorAvatar } from './../utils/avatarUtils'  // 头像处理工具
import api from './../utils/api'  // API 请求工具

export default {
  name: 'TopNavbar',  // 组件名称
  
  // ============================================================
  // data 数据区
  // ============================================================
  data() {
    return {
      // 【userInfo】
      // 类型：Object | null
      // 初始值：null
      // 作用：存储从服务器获取的完整用户信息
      // 使用场景：显示用户头像、用户名
      // 注意：优先使用此数据，比 auth.state.user 更新
      userInfo: null
    };
  },
  
  // ============================================================
  // mounted 生命周期钩子
  // ============================================================
  // 【作用】组件挂载后获取用户信息
  // 【时机】DOM 渲染完成后执行
  // ============================================================
  mounted() {
    if (this.isLoggedIn()) {
      this.fetchUserInfo();
    }
  },
  
  // ============================================================
  // methods 方法区
  // ============================================================
  methods: {
    // ============================================================
    // 获取用户信息
    // ============================================================
    // 【作用】从服务器获取最新的用户信息
    // 【场景】确保头像等信息是最新的
    // ============================================================
    async fetchUserInfo() {
      try {
        const response = await api.auth.getCurrentUser();
        if (response.success && response.data) {
          this.userInfo = response.data;
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
      }
    },
    
    // ============================================================
    // 获取用户头像
    // ============================================================
    // 【作用】返回用户头像 URL
    // 【返回值】String（头像 URL）
    // 【逻辑】优先使用 userInfo，其次使用 auth 中的用户信息
    // ============================================================
    getUserAvatar() {
      // 优先使用最新获取的用户信息
      let user = this.userInfo || auth.getCurrentUser();
      // 使用getAuthorAvatar函数处理头像
      return getAuthorAvatar(user, 40);
    },
    
    // ============================================================
    // 处理头像加载失败
    // ============================================================
    // 【作用】头像加载失败时显示默认图片
    // 【参数】event：错误事件对象
    // 【场景】网络问题、图片不存在等情况
    // ============================================================
    onAvatarError(event) {
      // 设置默认头像
      event.target.src = 'https://picsum.photos/40/40';
    },
    
    // ============================================================
    // 获取用户名
    // ============================================================
    // 【作用】返回当前登录用户的用户名
    // 【返回值】String（用户名）
    // 【默认值】'游戏达人'（未登录或获取失败时）
    // ============================================================
    getUsername() {
      // 从认证状态管理中获取用户信息
      const user = auth.getCurrentUser();
      if (user) {
        try {
          return user.username || user.name || '游戏达人';
        } catch (error) {
          console.error('解析用户信息失败:', error);
        }
      }
      return '游戏达人';
    },
    
    // ============================================================
    // 跳转到个人主页
    // ============================================================
    // 【作用】点击头像跳转到个人主页
    // 【逻辑】如果已经在个人主页，就刷新页面；否则跳转路由
    // ============================================================
    goToProfile() {
      // 检查当前路由
      if (this.$route.path.startsWith('/profile/')) {
        // 已经在个人主页，刷新页面
        window.location.reload();
      } else {
        // 不在个人主页，跳转路由
        this.$router.push('/profile/current');
      }
    },
    
    // ============================================================
    // 判断是否为管理员
    // ============================================================
    // 【作用】检查当前用户是否具有管理员权限
    // 【返回值】Boolean
    // 【使用场景】控制管理菜单的显示
    // ============================================================
    isAdmin() {
      // 从认证状态管理中获取用户信息
      const user = auth.getCurrentUser();
      if (user) {
        try {
          // 检查用户角色是否为 admin
          return user.role === 'admin';
        } catch (error) {
          console.error('解析用户信息失败:', error);
        }
      }
      return false;
    },
    
    // ============================================================
    // 判断是否已登录
    // ============================================================
    // 【作用】检查用户是否已登录
    // 【返回值】Boolean
    // 【使用场景】控制登录后才显示的功能
    // ============================================================
    isLoggedIn() {
      // 使用认证状态管理的isAuthenticated状态
      return auth.state.isAuthenticated;
    }
  }
}
</script>

<style scoped>
/* 顶部导航栏 - 春日花园风格 */
.top-navbar {
  background: linear-gradient(135deg, #fef3c7, #fbcfe8);
  box-shadow: 0 2px 10px rgba(236, 72, 153, 0.2);
  padding: 10px 0;
  position: sticky;
  top: 0;
  z-index: 1000;
  /* 可爱风格：柔和的底部边框 */
  border-bottom: 1px solid rgba(236, 72, 153, 0.3);
  /* 可爱风格：圆润的顶部边角 */
  border-radius: 0 0 20px 20px;
}

.container {
  width: 95%;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Logo - 可爱风格 */
.navbar-brand h2 {
  margin: 0;
  font-size: 1.4rem;
  color: var(--primary-pink);
  font-weight: 600;
  /* 可爱风格：柔和的文字阴影 */
  text-shadow: 0 2px 4px rgba(236, 72, 153, 0.3);
  /* 可爱风格：文字装饰 */
  letter-spacing: 0.5px;
}

/* 搜索框 - 可爱风格 */
.search-container {
  flex: 1;
  max-width: 500px;
  margin: 0 15px;
  transition: all 0.3s ease;
}

.search-container:not(.search-container-active) {
  animation: searchContainerExpand 0.5s ease forwards;
}

.search-container-active {
  max-width: 100px;
  transition: all 0.3s ease;
  animation: searchContainerShrink 0.5s ease forwards;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  padding: 8px 16px;
  border: 1px solid rgba(236, 72, 153, 0.2);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  min-width: 80px;
}

.search-box:not(.search-box-active) {
  animation: searchBoxExpand 0.5s ease forwards;
}

.search-box-active {
  background-color: rgba(236, 72, 153, 0.1);
  border-color: rgba(236, 72, 153, 0.4);
  width: 60px;
  height: 40px;
  padding: 0 12px;
  justify-content: center;
  transition: all 0.3s ease;
  animation: searchBoxShrink 0.5s ease forwards;
}

.search-box i {
  color: var(--primary-pink);
  margin-right: 10px;
  font-size: 0.95rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.search-box input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.9rem;
  color: #333;
}

.search-box input::placeholder {
  color: #8e8e8e;
}

@keyframes searchContainerShrink {
  from {
    max-width: 500px;
  }
  to {
    max-width: 100px;
  }
}

@keyframes searchContainerExpand {
  from {
    max-width: 100px;
  }
  to {
    max-width: 500px;
  }
}

@keyframes searchBoxShrink {
  from {
    width: 100%;
    max-width: 500px;
  }
  to {
    width: 60px;
  }
}

@keyframes searchBoxExpand {
  from {
    width: 60px;
  }
  to {
    width: 100%;
    max-width: 500px;
  }
}

.search-icon-active {
  color: var(--primary-pink);
  font-size: 1.1rem;
  margin-right: 8px;
  animation: searchIconPulse 1.5s ease-in-out infinite;
}

@keyframes searchIconPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.loading-dots {
  display: flex;
  align-items: center;
  gap: 3px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--primary-pink);
  animation: dotBounce 1.5s ease-in-out infinite;
  opacity: 0;
}

.dot:nth-child(1) {
  animation-delay: 0.1s;
  animation-fill-mode: forwards;
}

.dot:nth-child(2) {
  animation-delay: 0.3s;
  animation-fill-mode: forwards;
}

.dot:nth-child(3) {
  animation-delay: 0.5s;
  animation-fill-mode: forwards;
}

@keyframes dotBounce {
  0% {
    transform: translateY(0);
    opacity: 0.3;
  }
  50% {
    transform: translateY(-5px);
    opacity: 1;
  }
  100% {
    transform: translateY(0);
    opacity: 0.3;
  }
}

/* 桌面端导航菜单（平板和电脑） - 和谐风格 */
.desktop-nav-menu {
  display: none;
  flex: 1;
  max-width: 800px;
  margin: 0 20px;
  justify-content: space-around;
  align-items: center;
}

.desktop-nav-menu .nav-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-decoration: none;
  color: #495057;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 10px 0;
  width: 100px;
  border-radius: 20px;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.desktop-nav-menu .nav-link .nav-icon {
  font-size: 1rem;
  color: #6c757d;
}

.search-box .nav-icon {
  color: var(--primary-pink);
  margin-right: 10px;
  font-size: 0.95rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.desktop-nav-menu .nav-link:hover {
  background-color: #fff0f5;
  color: var(--primary-pink);
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(236, 72, 153, 0.2);
}

.desktop-nav-menu .nav-link:hover .nav-icon {
  color: var(--primary-pink);
}

.desktop-nav-menu .nav-link.active {
  background-color: #fff0f5;
  color: var(--primary-pink);
  box-shadow: 0 2px 5px rgba(236, 72, 153, 0.2);
}

.desktop-nav-menu .nav-link.active .nav-icon {
  color: var(--primary-pink);
}

/* 创作按钮特殊样式 - 春日花园风格 */
.desktop-nav-menu .create-btn {
  background: linear-gradient(135deg, var(--primary-pink), var(--secondary-pink));
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 3px 10px rgba(236, 72, 153, 0.4);
  border-radius: 20px;
  width: 100px;
}

.desktop-nav-menu .create-btn:hover {
  background: linear-gradient(135deg, var(--secondary-pink), var(--primary-pink));
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.5);
  transform: translateY(-2px);
}

.desktop-nav-menu .create-btn .nav-icon {
  color: #fff;
}

/* 右侧菜单 */
.navbar-menu {
  display: flex;
  align-items: center;
  gap: 15px;
}

/* 用户头像 - 可爱风格 */
.user-avatar {
  cursor: pointer;
  position: relative;
}

.avatar-img {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--primary-pink);
  box-shadow: 0 3px 8px rgba(236, 72, 153, 0.2);
  transition: all 0.3s ease;
  transform: translateY(0);
}

.user-avatar:hover .avatar-img {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 5px 12px rgba(236, 72, 153, 0.3);
}

/* 汉堡菜单 - 可爱风格 */
.hamburger-menu {
  display: none;
  background: rgba(255, 255, 255, 0.8);
  /* 可爱风格：柔和的边框 */
  border: 1px solid rgba(255, 107, 157, 0.2);
  /* 可爱风格：更圆润的边角 */
  border-radius: 12px;
  font-size: 1.25rem;
  color: var(--primary-pink);
  cursor: pointer;
  padding: 8px 12px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.hamburger-menu:hover {
  background: var(--light-pink);
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(255, 107, 157, 0.2);
}

/* 响应式设计 */
/* 手机端 (默认) */

/* 平板端 (768px - 1023px) - 汉堡菜单模式 */
@media (min-width: 768px) and (max-width: 1023px) {
  .desktop-nav-menu {
    display: flex;
    max-width: 400px;
  }
  
  .hamburger-menu {
    display: none;
  }
  
  .search-container {
    display: block;
    max-width: 180px;
    margin: 0 15px;
  }
  
  .navbar-brand h2 {
    font-size: 1.3rem;
  }
  
  /* 平板端导航按钮只显示图标，不显示文字 */
  .desktop-nav-menu .nav-link span:not(.nav-icon) {
    display: none;
  }
  
  .desktop-nav-menu .nav-link {
    width: 60px;
    justify-content: center;
  }
}

/* 电脑端 (1024px 以上) */
@media (min-width: 1024px) {
  .desktop-nav-menu {
    display: flex;
    max-width: 700px;
  }
  
  .hamburger-menu {
    display: none;
  }
  
  .search-container {
    display: block;
    max-width: 500px;
  }
  
  .navbar-brand h2 {
    font-size: 1.4rem;
  }
}

/* 小屏幕手机 (767px 以下) - 汉堡菜单+logo+搜索框+用户头像模式 */
@media (max-width: 767px) {
  .search-container {
    display: block;
    max-width: 90px;
    margin: 0 15px;
  }
  
  .search-box {
    padding: 6px 10px;
    min-width: 70px;
  }
  
  .search-box input {
    font-size: 0.8rem;
  }
  
  .hamburger-menu {
    display: block;
  }
  
  .navbar-brand h2 {
    font-size: 1.2rem;
  }
  
  .container {
    width: 95%;
  }
  
  /* 确保用户头像始终显示 */
  .user-avatar {
    display: flex;
  }
  
  .avatar-img {
    width: 36px;
    height: 36px;
  }
}
</style>
