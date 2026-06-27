<template>
  <nav class="mobile-nav" aria-label="移动端导航">
    <router-link to="/blog" class="mobile-nav__item" :class="{ 'mobile-nav__item--active': isActive('/blog') }" aria-label="发现">
      <span class="mobile-nav__icon">🧭</span>
      <span class="mobile-nav__label">发现</span>
    </router-link>

    <router-link to="/following" class="mobile-nav__item" :class="{ 'mobile-nav__item--active': isActive('/following') }" aria-label="关注">
      <span class="mobile-nav__icon">👥</span>
      <span class="mobile-nav__label">关注</span>
    </router-link>

    <router-link to="/create" class="mobile-nav__item mobile-nav__item--create" :class="{ 'mobile-nav__item--active': isActive('/create') }" aria-label="发布">
      <span class="mobile-nav__create-icon">➕</span>
    </router-link>

    <router-link to="/messages" class="mobile-nav__item" :class="{ 'mobile-nav__item--active': isActive('/messages') }" aria-label="私信">
      <span class="mobile-nav__icon">✉️</span>
      <span class="mobile-nav__label">私信</span>
      <span v-if="unreadCount > 0" class="mobile-nav__badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
    </router-link>

    <router-link to="/profile" class="mobile-nav__item" :class="{ 'mobile-nav__item--active': isProfileActive }" aria-label="个人中心">
      <span class="mobile-nav__icon">👤</span>
      <span class="mobile-nav__label">我的</span>
    </router-link>
  </nav>
</template>

<script>
export default {
  name: 'MobileBottomNav',

  data() {
    return {
      unreadCount: 0
    };
  },

  computed: {
    isProfileActive() {
      const p = this.$route.path;
      return p === '/profile' || p.startsWith('/profile/') || p === '/my-profile' || p === '/my-creation' || p === '/edit-profile';
    }
  },

  watch: {
    '$route'() {
      // 路由变化时刷新未读消息数
      this.fetchUnreadCount();
    }
  },

  created() {
    this.fetchUnreadCount();
    // 每 30 秒轮询未读消息数
    this._pollInterval = setInterval(() => {
      this.fetchUnreadCount();
    }, 30000);
  },

  beforeDestroy() {
    if (this._pollInterval) clearInterval(this._pollInterval);
  },

  methods: {
    isActive(path) {
      return this.$route.path === path;
    },

    async fetchUnreadCount() {
      if (!this.$store.getters.isLoggedIn) return;
      try {
        // 获取未读消息数（使用联系人列表来判断是否有未读）
        const response = await this.$http.messages.getContacts({ limit: 1 });
        if (response.success && typeof response.unreadCount === 'number') {
          this.unreadCount = response.unreadCount;
        }
      } catch {
        // 静默失败 - 未读消息数不是关键功能
      }
    }
  }
};
</script>

<style scoped>
/* 移动端底部导航栏 */
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  /* 安全区域适配 - iPhone X 及以上机型 */
  padding-bottom: env(safe-area-inset-bottom, 8px);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(254, 243, 199, 0.98) 100%);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(236, 72, 153, 0.12);
  display: none;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
  box-shadow: 0 -2px 16px rgba(0, 0, 0, 0.06);
}

/* 导航项 */
.mobile-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex: 1;
  height: 100%;
  min-width: 48px;
  /* 最小触摸目标 44px */
  min-height: 44px;
  color: #999;
  text-decoration: none;
  font-size: 0.7rem;
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
  -webkit-tap-highlight-color: transparent;
}

.mobile-nav__item:active {
  transform: scale(0.93);
}

.mobile-nav__item--active {
  color: #ec4899;
}

.mobile-nav__item--active .mobile-nav__icon {
  transform: scale(1.15);
}

.mobile-nav__icon {
  font-size: 1.35rem;
  transition: transform 0.2s ease;
}

.mobile-nav__label {
  line-height: 1;
}

/* 中间发布按钮 */
.mobile-nav__item--create {
  position: relative;
  top: -14px;
}

.mobile-nav__create-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ec4899, #db2777);
  box-shadow: 0 4px 16px rgba(236, 72, 153, 0.35);
  font-size: 1.3rem;
  transition: all 0.25s ease;
  /* 确保触摸目标足够大 */
  min-width: 44px;
  min-height: 44px;
}

.mobile-nav__item--create:active .mobile-nav__create-icon {
  transform: scale(0.9);
  box-shadow: 0 2px 8px rgba(236, 72, 153, 0.25);
}

/* 未读消息徽章 */
.mobile-nav__badge {
  position: absolute;
  top: 2px;
  right: calc(50% - 20px);
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #ef4444;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
  animation: badgePop 0.3s ease;
}

@keyframes badgePop {
  0% { transform: scale(0); }
  60% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

/* 响应式显示 */
@media (max-width: 768px) {
  .mobile-nav {
    display: flex;
  }
}

@media (min-width: 769px) {
  .mobile-nav {
    display: none;
  }
}

/* 小屏幕优化 */
@media (max-width: 360px) {
  .mobile-nav {
    height: 54px;
  }
  .mobile-nav__icon {
    font-size: 1.15rem;
  }
  .mobile-nav__label {
    font-size: 0.6rem;
  }
  .mobile-nav__create-icon {
    width: 40px;
    height: 40px;
    font-size: 1.1rem;
  }
}
</style>
