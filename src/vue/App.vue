<template>
  <div class="app-container" :class="{ 'full-screen-container': isYmtPage }">
  
    <TopNavbar v-if="!isLoginOrRegisterPage && !isYmtPage" />
    
    <main :class="{ 'full-screen': isYmtPage }">
      <router-view></router-view>
    </main>
    
    <MobileBottomNav v-if="isLoggedIn && !isYmtPage" />
    
    <MusicPlayer v-if="isLoggedIn && !isYmtPage" />
  </div>
</template>

<script>

import TopNavbar from './components/TopNavbar.vue'
import MobileBottomNav from './components/MobileBottomNav.vue'
import MusicPlayer from './components/music.vue'

export default {
  name: 'App',  
  components: {
    TopNavbar,
    MobileBottomNav,
    MusicPlayer
  },
  
  data() {
    return {
    }
  },
  

  computed: {

    isLoggedIn() {
      return this.$store.getters.isLoggedIn
    },
    
    currentUser() {
      return this.$store.getters.currentUser
    },

    isLoginOrRegisterPage() {
      const currentPath = this.$route.path
      return currentPath === '/login' || currentPath === '/register'
    },
    
    isYmtPage() {
      const currentPath = this.$route.path
      return currentPath === '/ymt'
    }
  },
  
  created() {
    this.$store.dispatch('init')
    if (this.isLoggedIn) {
      this.refreshUserInfo()
    }
  },
  
  watch: {
    '$route': 'checkLoginStatus'
  },
  
  
  methods: {
    checkLoginStatus() {
      this.$store.dispatch('init')
      const token = this.$store.getters.getToken
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          if (payload.exp && payload.exp < Date.now() / 1000) {
            this.$store.dispatch('logout', this.$router)
          }
        } catch (error) {
          this.$store.dispatch('logout', this.$router)
        }
      }
    },
    
    async refreshUserInfo() {
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
          const rememberMe = localStorage.getItem('token') !== null;
          this.$store.dispatch('loginSuccess', { user, token, rememberMe });
        }
      } catch (error) {
        console.error('刷新用户信息失败:', error);
      }
    }
  }
}
</script>

<style>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-container.full-screen-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  max-width: 100vw;
  margin: 0;
  width: 100vw;
  height: 100vh;
}

main {
  flex: 1;
  padding-bottom: 70px; /* 为移动端底部导航栏留出空间 */
}

main.full-screen {
  padding-bottom: 0;
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow-y: auto;
}

/* 响应式设计 - 断点定义 */
/* 平板端 (769px 以上) */
@media (min-width: 769px) {
  main {
    padding-bottom: 0;
  }
}

/* 电脑端 (1024px 以上) */
@media (min-width: 1024px) {
  .app-container {
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .app-container.full-screen-container {
    max-width: 100vw;
    margin: 0;
    width: 100vw;
    height: 100vh;
  }
}
</style>