<template>
  <article class="auth-container" aria-label="认证页面">
    <main class="auth-main" role="main">
      <div class="auth-wrapper">
        <AuthCard :subtitle="currentSubtitle">
          <!-- 模式切换标签 -->
          <nav class="auth-tabs" role="tablist">
            <button
              :class="['auth-tab', { 'auth-tab--active': mode === 'login' }]"
              type="button"
              @click="switchMode('login')"
              :aria-selected="mode === 'login'"
            >
              <svg-icon name="signIn" :size="16" class-name="auth-tab__icon" />
              <span>登录</span>
            </button>
            <button
              :class="['auth-tab', { 'auth-tab--active': mode === 'register' }]"
              type="button"
              @click="switchMode('register')"
              :aria-selected="mode === 'register'"
            >
              <svg-icon name="userPlus" :size="16" class-name="auth-tab__icon" />
              <span>注册</span>
            </button>
          </nav>

          <!-- 表单区域 -->
          <section class="auth-form-section" role="tabpanel">
            <LoginForm
              v-if="mode === 'login'"
              :is-loading="isLoading"
              :login-error="authError"
              @submit="handleLogin"
            />
            <RegisterForm
              v-else
              :is-loading="isLoading"
              :register-error="authError"
              @submit="handleRegister"
            />
          </section>
        </AuthCard>
        <AuthFooter />
      </div>
    </main>
  </article>
</template>

<script>
import AuthCard from './login/AuthCard.vue';
import LoginForm from './login/LoginForm.vue';
import RegisterForm from './register/RegisterForm.vue';
import AuthFooter from './login/AuthFooter.vue';
import { debounce } from '@/utils/validate';
import { showNotification } from '@/utils/notification';

export default {
  name: 'AuthPage',
  components: { AuthCard, LoginForm, RegisterForm, AuthFooter },

  data() {
    return {
      mode: 'login',
      isLoading: false,
      authError: ''
    };
  },

  computed: {
    currentSubtitle() {
      return this.mode === 'login'
        ? '欢迎回到kk博客，继续您的创作之旅'
        : '欢迎加入kk博客，开始您的创作之旅';
    }
  },

  watch: {
    mode(newVal) {
      // 同步 URL 路径（不触发导航守卫）
      const targetPath = newVal === 'login' ? '/login' : '/register';
      if (this.$route.path !== targetPath) {
        this.$router.replace(targetPath).catch(() => {});
      }
      this.authError = '';
    }
  },

  methods: {
    switchMode: debounce(function (mode) {
      this.mode = mode;
    }, 300),

    async handleLogin(formData) {
      this.authError = '';
      this.isLoading = true;
      try {
        const response = await this.$http.auth.login(formData);
        if (response.success && response.message === '登录成功') {
          this.$store.dispatch('loginSuccess', {
            user: response.user,
            token: response.token,
            rememberMe: formData.rememberMe
          });
          const redirectPath = (response.user && response.user.role === 'admin') ? '/admin' : '/blog';
          this.$router.replace(redirectPath);
        } else {
          this.authError = response.message || '登录失败，请检查邮箱和密码';
        }
      } catch (error) {
        console.error('登录错误:', error);
        this.authError = this.getErrorMsg(error, '登录');
      } finally {
        this.isLoading = false;
      }
    },

    async handleRegister(formData) {
      this.authError = '';
      this.isLoading = true;
      try {
        const response = await this.$http.auth.register(formData);
        if (response.success) {
          showNotification('注册成功！请登录', 'success', 2000);
          // 延迟切换到登录模式
          setTimeout(() => {
            this.mode = 'login';
            this.authError = '';
          }, 1200);
        } else {
          this.authError = response.message || '注册失败，请稍后重试';
        }
      } catch (error) {
        console.error('注册错误:', error);
        this.authError = this.getErrorMsg(error, '注册');
      } finally {
        this.isLoading = false;
      }
    },

    getErrorMsg(error, type) {
      if (error.response) {
        return error.response.data?.message || `${type}失败，请稍后重试`;
      }
      if (error.request) {
        return '网络错误，无法连接到服务器，请检查网络连接';
      }
      return '请求配置错误，请稍后重试';
    }
  }
};
</script>

<style scoped>
.auth-container {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #fef3c7 0%, #fbcfe8 50%, #e0f2fe 100%);
  overflow: hidden;
  position: relative;
}

/* 背景装饰 */
.auth-container::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background:
    radial-gradient(circle at 20% 50%, rgba(236, 72, 153, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(110, 231, 183, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 50% 80%, rgba(252, 211, 77, 0.05) 0%, transparent 50%);
  animation: authBgFloat 20s ease-in-out infinite;
  pointer-events: none;
}

@keyframes authBgFloat {
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(1%, -1%); }
  66% { transform: translate(-1%, 1%); }
}

.auth-main {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.auth-wrapper {
  width: 100%;
  max-width: 480px;
}

/* 标签切换 */
.auth-tabs {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 32px;
  background: rgba(255, 255, 255, 0.6);
  padding: 6px;
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.auth-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  color: #666;
  background: transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: none;
  font-size: 1rem;
}

.auth-tab:hover:not(.auth-tab--active) {
  background: rgba(236, 72, 153, 0.08);
  color: #ec4899;
}

.auth-tab--active {
  background: linear-gradient(135deg, #ec4899, #db2777);
  color: white;
  box-shadow: 0 4px 16px rgba(236, 72, 153, 0.35);
  transform: scale(1.02);
}

.auth-tab__icon {
  flex-shrink: 0;
}

.auth-form-section {
  animation: fadeSlideIn 0.35s ease;
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 480px) {
  .auth-main {
    padding: 16px;
    align-items: flex-start;
    padding-top: 40px;
  }
  .auth-tabs {
    margin-bottom: 24px;
  }
  .auth-tab {
    padding: 10px 16px;
    font-size: 0.9rem;
  }
}
</style>
