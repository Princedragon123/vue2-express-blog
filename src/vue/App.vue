<template>
  <div class="app-container" :class="{ 'app-container--fullscreen': isFullscreenPage }">
    <TopNavbar v-if="showTopNav" />
    <main :class="{ 'main--fullscreen': isFullscreenPage }">
      <router-view />
    </main>
    <MobileBottomNav v-if="showBottomNav" />
    <MusicPlayer v-if="showMusicPlayer" />
  </div>
</template>

<script>
import TopNavbar from './components/TopNavbar.vue';
import MobileBottomNav from './components/MobileBottomNav.vue';
import MusicPlayer from './components/music.vue';

export default {
  name: 'App',
  components: { TopNavbar, MobileBottomNav, MusicPlayer },

  computed: {
    isLoggedIn() {
      return this.$store.getters.isLoggedIn;
    },
    isAuthPage() {
      const path = this.$route.path;
      return path === '/login' || path === '/register';
    },
    isFullscreenPage() {
      return this.$route.path === '/ymt';
    },
    showTopNav() {
      return !this.isAuthPage && !this.isFullscreenPage;
    },
    showBottomNav() {
      return this.isLoggedIn && !this.isFullscreenPage;
    },
    showMusicPlayer() {
      return this.isLoggedIn && !this.isFullscreenPage;
    }
  },

  created() {
    // 初始化认证状态（从浏览器存储恢复）
    this.$store.dispatch('init');
  },

  watch: {
    // 路由变化时刷新认证状态
    '$route': {
      handler() {
        this.$store.dispatch('init');
        // 如果 Token 已过期且不在公开页面，触发登出
        if (this.isLoggedIn && this.$store.getters.isTokenExpired && !this.isAuthPage) {
          this.$store.dispatch('logout', this.$router);
        }
      },
      immediate: false
    }
  },

  async mounted() {
    // 登录状态下刷新用户信息
    if (this.isLoggedIn) {
      try {
        const response = await this.$http.auth.getCurrentUser();
        if (response.success && response.data) {
          const userData = response.data;
          const user = {
            id: userData._id,
            username: userData.username,
            email: userData.email,
            role: userData.role,
            avatar: userData.profile?.avatar,
            profile: userData.profile
          };
          const token = this.$store.getters.getToken;
          const rememberMe = !!localStorage.getItem('token');
          this.$store.dispatch('loginSuccess', { user, token, rememberMe });
        }
      } catch (error) {
        console.error('刷新用户信息失败:', error);
      }
    }
  }
};
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-container--fullscreen {
  max-width: 100vw;
  margin: 0;
  width: 100vw;
  height: 100vh;
}

main {
  flex: 1;
  /* 移动端：底部导航栏高度 + 安全区域 */
  padding-bottom: calc(60px + env(safe-area-inset-bottom, 8px));
}

.main--fullscreen {
  padding-bottom: 0;
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow-y: auto;
}

@media (min-width: 769px) {
  main {
    /* 桌面端无底部导航栏 */
    padding-bottom: 0;
  }
}

@media (min-width: 1024px) {
  .app-container {
    max-width: 1400px;
    margin: 0 auto;
  }
  .app-container--fullscreen {
    max-width: 100vw;
    margin: 0;
    width: 100vw;
    height: 100vh;
  }
}
</style>
