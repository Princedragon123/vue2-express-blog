<template>
  <div class="auth">
    <div class="auth__card">
      <div class="auth__header">
        <h1 class="auth__logo">KK攻略</h1>
        <p class="auth__subtitle">{{ mode === 'login' ? '欢迎回来，继续你的创作之旅' : '加入我们，开始你的创作之旅' }}</p>
      </div>

      <div class="auth__tabs">
        <button :class="['auth__tab', { 'auth__tab--active': mode === 'login' }]" @click="switchMode('login')">登录</button>
        <button :class="['auth__tab', { 'auth__tab--active': mode === 'register' }]" @click="switchMode('register')">注册</button>
      </div>

      <div class="auth__form" :key="mode">
        <LoginForm v-if="mode === 'login'" :is-loading="isLoading" :login-error="authError" @submit="handleLogin" />
        <RegisterForm v-else :is-loading="isLoading" :register-error="authError" @submit="handleRegister" />
      </div>
    </div>
    <p class="auth__footer">&copy; 2026 KK攻略博客</p>
  </div>
</template>

<script>
import LoginForm from './login/LoginForm.vue';
import RegisterForm from './register/RegisterForm.vue';
import { debounce } from '@/utils/validate';
import { showNotification } from '@/utils/notification';

export default {
  name: 'AuthPage',
  components: { LoginForm, RegisterForm },
  data() { return { mode: 'login', isLoading: false, authError: '' }; },
  computed: {
    currentSubtitle() {
      return this.mode === 'login' ? '欢迎回到kk博客，继续您的创作之旅' : '欢迎加入kk博客，开始您的创作之旅';
    }
  },
  watch: {
    mode(newVal) {
      const target = newVal === 'login' ? '/login' : '/register';
      if (this.$route.path !== target) this.$router.replace(target).catch(() => {});
      this.authError = '';
    }
  },
  methods: {
    switchMode: debounce(function (mode) { this.mode = mode; }, 300),
    async handleLogin(formData) {
      this.authError = ''; this.isLoading = true;
      try {
        const r = await this.$http.auth.login(formData);
        if (r.success && r.message === '登录成功') {
          this.$store.dispatch('loginSuccess', { user: r.user, token: r.token, rememberMe: formData.rememberMe });
          this.$router.replace(r.user?.role === 'admin' ? '/admin' : '/blog');
        } else { this.authError = r.message || '登录失败，请检查邮箱和密码'; }
      } catch (e) { this.authError = this.getErrorMsg(e, '登录'); }
      finally { this.isLoading = false; }
    },
    async handleRegister(formData) {
      this.authError = ''; this.isLoading = true;
      try {
        const r = await this.$http.auth.register(formData);
        if (r.success) {
          showNotification('注册成功！请登录', 'success', 2000);
          setTimeout(() => { this.mode = 'login'; this.authError = ''; }, 1200);
        } else { this.authError = r.message || '注册失败，请稍后重试'; }
      } catch (e) { this.authError = this.getErrorMsg(e, '注册'); }
      finally { this.isLoading = false; }
    },
    getErrorMsg(e, type) {
      if (e.response) return e.response.data?.message || `${type}失败，请稍后重试`;
      if (e.request) return '网络错误，无法连接服务器';
      return '请求配置错误，请稍后重试';
    }
  }
};
</script>

<style scoped>
.auth {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: #faf8f5;
}

.auth__card {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 20px;
  padding: 48px 36px 36px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.05);
  animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

.auth__header { text-align: left; margin-bottom: 32px; }
.auth__logo { font-size: 1.5rem; font-weight: 700; color: #1a1a1a; margin: 0 0 6px; letter-spacing: -0.02em; }
.auth__subtitle { font-size: 0.9rem; color: #9ca3af; margin: 0; }

.auth__tabs {
  display: flex;
  gap: 4px;
  background: #f3f4f6;
  border-radius: 9999px;
  padding: 4px;
  margin-bottom: 28px;
}
.auth__tab {
  flex: 1;
  padding: 10px;
  border-radius: 9999px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #6b7280;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}
.auth__tab--active {
  background: #fff;
  color: #1a1a1a;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.auth__footer { margin-top: 24px; font-size: 0.8rem; color: #d1d5db; }

@media (max-width: 480px) {
  .auth { padding: 20px 16px; justify-content: flex-start; padding-top: 60px; }
  .auth__card { padding: 32px 24px 28px; border-radius: 16px; }
}
</style>
