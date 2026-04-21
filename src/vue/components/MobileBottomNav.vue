<!-- MobileBottomNav.vue - 移动端底部导航栏组件 -->
<template>
  <nav class="mobile-bottom-nav" :class="currentStyle">
    <router-link to="/blog" class="nav-item" :class="{ active: $route.path === '/blog' }" aria-label="发现" tabindex="0">
      <span class="nav-icon">🧭</span>
      <span>发现</span>
    </router-link>
    <router-link to="/following" class="nav-item" :class="{ active: $route.path === '/following' }" aria-label="我的关注" tabindex="0">
      <span class="nav-icon">👥</span>
      <span>我的关注</span>
    </router-link>
    <router-link to="/create" class="nav-item create-btn" :class="{ active: $route.path === '/create' }" aria-label="发布" tabindex="0">
      <span class="nav-icon">➕</span>
      <span>发布</span>
    </router-link>
    <router-link to="/messages" class="nav-item notification-btn" :class="{ active: $route.path === '/messages' }" aria-label="我的私信" tabindex="0">
      <span class="nav-icon">✉️</span>
      <span>我的私信</span>
      <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</span>
    </router-link>
    <router-link to="/profile" class="nav-item" :class="{ active: $route.path === '/profile' }" aria-label="个人中心" tabindex="0">
      <span class="nav-icon">👤</span>
      <span>个人中心</span>
    </router-link>
  </nav>
</template>

<script>
export default {
  name: 'MobileBottomNav',
  data() {
    return {
      currentStyle: 'style-spring-garden', // 默认风格
      unreadCount: 0 // 未读消息数量，默认为0
    }
  },
  created() {
    // 从localStorage获取保存的风格，如果没有则使用默认值
    const savedStyle = localStorage.getItem('currentStyle')
    if (savedStyle) {
      this.currentStyle = savedStyle
    }
    
    // 监听风格变化事件
    window.addEventListener('styleChanged', this.handleStyleChange)
  },
  beforeDestroy() {
    // 移除事件监听
    window.removeEventListener('styleChanged', this.handleStyleChange)
  },
  methods: {
    handleStyleChange(event) {
      // 更新当前风格
      this.currentStyle = event.detail.style
      // 保存到localStorage
      localStorage.setItem('currentStyle', event.detail.style)
    }
  }
}
</script>

<style scoped>
/* 底部导航栏 - 可爱风格 */
.mobile-bottom-nav {
  position: fixed;
  position: -webkit-sticky;
  bottom: 0;
  left: 0;
  right: 0;
  height: 65px;
  background: linear-gradient(135deg, #fef3c7, #fbcfe8);
  border-top: 0;
  display: none;
  justify-content: space-around;
  align-items: center;
  padding: 0 0.5rem 10px;
  z-index: 1000;
  box-shadow: 0 -2px 10px rgba(236, 72, 153, 0.2);
  /* 可爱风格：圆润边角 */
  border-radius: 20px 20px 0 0;
  /* 可爱风格：柔和的顶部边框 */
  border-top: 1px solid rgba(236, 72, 153, 0.3);
  /* 防止滑动时位置偏移 */
  transform: translateZ(0);
  will-change: transform;
  /* 确保导航栏不会被其他元素遮挡 */
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}

/* 导航项 */
.mobile-bottom-nav .nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #495057;
  text-decoration: none;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.3s ease;
  flex: 1;
  max-width: 20%; /* 5个项目，每个20%宽度 */
  height: 100%;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* 导航项悬停效果 */
.mobile-bottom-nav .nav-item:hover {
  background-color: #fff0f5;
  color: var(--primary-pink);
  box-shadow: 0 3px 6px rgba(236, 72, 153, 0.2);
}

/* 导航图标 */
.mobile-bottom-nav .nav-item .nav-icon {
  font-size: 1.5rem;
  transition: all 0.3s ease;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  color: #6c757d;
}

/* 导航项悬停时图标颜色 */
.mobile-bottom-nav .nav-item:hover .nav-icon {
  color: var(--primary-pink);
}

.mobile-bottom-nav .create-btn .nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  transition: all 0.3s ease;
}

.mobile-bottom-nav .create-btn:hover .nav-icon {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 6px 20px rgba(236, 72, 153, 0.5),
              0 0 0 3px rgba(255, 255, 255, 0.3) inset;
}

/* 激活状态 */
.mobile-bottom-nav .nav-item.active {
  background-color: #fff0f5;
  color: var(--primary-pink);
  box-shadow: 0 2px 5px rgba(236, 72, 153, 0.2);
}

.mobile-bottom-nav .nav-item.active .nav-icon {
  color: var(--primary-pink);
  transform: scale(1.2);
  /* 可爱风格：发光效果 */
  text-shadow: 0 0 10px rgba(236, 72, 153, 0.5);
}

/* 导航文字 */
.mobile-bottom-nav .nav-item span {
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
}

/* 响应式显示控制 - 根据屏幕宽度显示，适配手机边框长度 */
@media (max-width: 768px) {
  .mobile-bottom-nav {
    display: flex !important;
  }
  
  /* 确保内容不被底部导航栏遮挡 */
  main {
    padding-bottom: 75px !important;
  }
}

/* 确保在所有屏幕尺寸下默认隐藏，仅在小屏幕显示 */
@media (min-width: 769px) {
  .mobile-bottom-nav {
    display: none !important;
  }
}

/* 小屏幕手机优化 */
@media (max-width: 375px) {
  .mobile-bottom-nav {
    height: 60px;
    padding: 0 0.1rem 0;
  }
  
  .mobile-bottom-nav .nav-item {
    font-size: 0.65rem;
  }
  
  .mobile-bottom-nav .nav-item .nav-icon {
    font-size: 1.2rem;
  }
  
  .mobile-bottom-nav .create-btn .nav-icon {
    width: 55px;
    height: 55px;
    font-size: 2.2rem;
  }
}

/* 超小屏幕手机优化（320px以下） */
@media (max-width: 320px) {
  .mobile-bottom-nav {
    height: 55px;
    padding: 0 0.1rem 6px;
  }
  
  .mobile-bottom-nav .nav-item {
    font-size: 0.6rem;
  }
  
  .mobile-bottom-nav .nav-item .nav-icon {
    font-size: 1.1rem;
  }
  
  .mobile-bottom-nav .create-btn .nav-icon {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
  }
}

/* 主题风格 - 春日花园 */
.style-spring-garden .mobile-bottom-nav {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  border-top: 3px solid var(--background-dark);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='20' viewBox='0 0 1200 20'%3E%3Cpath d='M0,10 C300,5 900,15 1200,10 L1200,20 L0,20 Z' fill='%23fbcfe8' opacity='0.3'/%3E%3C/svg%3E");
}

.style-spring-garden .mobile-bottom-nav .nav-item.active,
.style-spring-garden .mobile-bottom-nav .nav-item.active i {
  color: var(--text-primary);
}

.style-spring-garden .mobile-bottom-nav .create-btn i {
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%);
}

</style>
