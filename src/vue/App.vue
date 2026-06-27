<template>
  <div class="app" :class="{ 'app--fullscreen': isFullscreenPage }">
    <TopNavbar v-if="showTopNav" />
    <main class="app__main" :class="{ 'app__main--fullscreen': isFullscreenPage }">
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
    isLoggedIn() { return this.$store.getters.isLoggedIn; },
    isAuthPage() {
      const p = this.$route.path;
      return p === '/login' || p === '/register';
    },
    isFullscreenPage() { return this.$route.path === '/ymt'; },
    showTopNav() { return !this.isAuthPage && !this.isFullscreenPage; },
    showBottomNav() { return this.isLoggedIn && !this.isFullscreenPage; },
    showMusicPlayer() { return this.isLoggedIn && !this.isFullscreenPage; }
  },

  created() { this.$store.dispatch('init'); },

  watch: {
    '$route': {
      handler() {
        this.$store.dispatch('init');
        if (this.isLoggedIn && this.$store.getters.isTokenExpired && !this.isAuthPage) {
          this.$store.dispatch('logout', this.$router);
        }
      }
    }
  },

  async mounted() {
    if (this.isLoggedIn) {
      try {
        const response = await this.$http.auth.getCurrentUser();
        if (response.success && response.data) {
          const d = response.data;
          this.$store.dispatch('loginSuccess', {
            user: { id: d._id, username: d.username, email: d.email, role: d.role, avatar: d.profile?.avatar, profile: d.profile },
            token: this.$store.getters.getToken,
            rememberMe: !!localStorage.getItem('token')
          });
        }
      } catch { /* silent */ }
    }
  }
};
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #faf8f5;
}

.app--fullscreen {
  max-width: 100vw;
  width: 100vw;
  height: 100vh;
}

.app__main {
  flex: 1;
  padding-bottom: calc(60px + env(safe-area-inset-bottom, 8px));
}

.app__main--fullscreen {
  padding: 0;
  width: 100vw;
  height: 100vh;
  overflow-y: auto;
}

@media (min-width: 769px) {
  .app__main { padding-bottom: 0; }
}

@media (min-width: 1024px) {
  .app { max-width: 1400px; margin: 0 auto; }
  .app--fullscreen { max-width: 100vw; margin: 0; }
}
</style>
