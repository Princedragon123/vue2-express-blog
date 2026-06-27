<template>
  <nav class="mb-nav" aria-label="移动端导航">
    <router-link to="/blog" class="mb-nav__item" :class="{ 'mb-nav__item--active': $route.path === '/blog' }" aria-label="发现">
      <svg-icon name="compass" :size="20" />
      <span class="mb-nav__label">发现</span>
    </router-link>
    <router-link to="/following" class="mb-nav__item" :class="{ 'mb-nav__item--active': $route.path === '/following' }" aria-label="关注">
      <svg-icon name="users" :size="20" />
      <span class="mb-nav__label">关注</span>
    </router-link>
    <router-link to="/create" class="mb-nav__item mb-nav__item--cta" aria-label="发布">
      <span class="mb-nav__cta-icon">+</span>
    </router-link>
    <router-link to="/messages" class="mb-nav__item" :class="{ 'mb-nav__item--active': $route.path === '/messages' }" aria-label="私信">
      <svg-icon name="mail" :size="20" />
      <span class="mb-nav__label">私信</span>
      <span v-if="unreadCount > 0" class="mb-nav__badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
    </router-link>
    <router-link to="/profile" class="mb-nav__item" :class="{ 'mb-nav__item--active': isProfileActive }" aria-label="我的">
      <svg-icon name="user" :size="20" />
      <span class="mb-nav__label">我的</span>
    </router-link>
  </nav>
</template>

<script>
export default {
  name: 'MobileBottomNav',
  data() { return { unreadCount: 0 }; },
  computed: {
    isProfileActive() {
      const p = this.$route.path;
      return p === '/profile' || p.startsWith('/profile/') || p === '/my-profile' || p === '/my-creation' || p === '/edit-profile' || p === '/data-dashboard';
    }
  },
  watch: { '$route'() { this.fetchUnreadCount(); } },
  created() {
    this.fetchUnreadCount();
    this._poll = setInterval(() => this.fetchUnreadCount(), 30000);
  },
  beforeDestroy() { if (this._poll) clearInterval(this._poll); },
  methods: {
    async fetchUnreadCount() {
      if (!this.$store.getters.isLoggedIn) return;
      try { const r = await this.$http.messages.getContacts({ limit: 1 }); if (r.success && typeof r.unreadCount === 'number') this.unreadCount = r.unreadCount; } catch {}
    }
  }
};
</script>

<style scoped>
.mb-nav {
  display: none;
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: 60px;
  padding-bottom: env(safe-area-inset-bottom, 8px);
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid #e5e7eb;
  justify-content: space-around;
  align-items: center;
  z-index: 100;
}
.mb-nav__item {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  flex: 1; min-width: 48px; min-height: 44px;
  color: #9ca3af; text-decoration: none;
  font-size: 0.65rem; font-weight: 500;
  transition: color 0.2s;
  position: relative;
  -webkit-tap-highlight-color: transparent;
}
.mb-nav__item--active { color: #e11d48; }
.mb-nav__item:active { transform: scale(0.93); }

.mb-nav__cta-icon {
  display: flex; align-items: center; justify-content: center;
  width: 44px; height: 44px;
  border-radius: 50%;
  background: #e11d48;
  color: #fff;
  font-size: 1.4rem;
  font-weight: 300;
  box-shadow: 0 4px 12px rgba(225,29,72,0.3);
  margin-top: -14px;
}
.mb-nav__item--cta:active .mb-nav__cta-icon { transform: scale(0.9); }

.mb-nav__badge {
  position: absolute; top: 0; right: calc(50% - 18px);
  min-width: 16px; height: 16px;
  padding: 0 4px; border-radius: 8px;
  background: #e11d48; color: #fff;
  font-size: 0.6rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }

@media (max-width: 768px) { .mb-nav { display: flex; } }
</style>
