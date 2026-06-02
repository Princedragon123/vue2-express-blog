<template>
  <div class="auth-container">
    <div class="container-fluid min-vh-100 d-flex align-items-center justify-content-center">
      <div class="row w-100 justify-content-center">
        <div class="col-md-8 col-lg-6 col-xl-5">
          <AuthCard :subtitle="currentSubtitle">
            <div class="nav nav-pills justify-content-center mb-5" id="auth-tabs" role="tablist">
              <button 
                :class="['nav-link', 'px-4', 'py-2', { active: mode === 'login' }]" 
                id="login-tab" 
                type="button"
                @click="switchMode('login')"
                :aria-selected="mode === 'login'"
              >
                <svg-icon name="signIn" :size="16" class-name="me-2"></svg-icon>登录
              </button>
              <button 
                :class="['nav-link', 'px-4', 'py-2', { active: mode === 'register' }]" 
                id="register-tab" 
                type="button"
                @click="switchMode('register')"
                :aria-selected="mode === 'register'"
              >
                <svg-icon name="userPlus" :size="16" class-name="me-2"></svg-icon>注册
              </button>
            </div>

            <div class="tab-content" id="auth-tabs-content">
              <div class="tab-pane fade show active" id="auth-form" role="tabpanel">
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
              </div>
            </div>
          </AuthCard>

          <AuthFooter />
        </div>
      </div>
    </div>
  </div>
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
  components: {
    AuthCard,
    LoginForm,
    RegisterForm,
    AuthFooter
  },
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
      const targetPath = newVal === 'login' ? '/login' : '/register';
      if (this.$route.path !== targetPath) {
        this.$router.replace(targetPath);
      }
      this.authError = '';
    }
  },
  methods: {
       // ✅ 修复后的防抖切换方法
    switchMode: debounce(function(mode) {
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
          this.$router.push(redirectPath);
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
    // 抽离错误信息处理，避免重复代码
    getErrorMsg(error, type) {
      if (error.response) {
        return error.response.data.message || `${type}失败，请稍后重试`;
      } else if (error.request) {
        return '网络错误，无法连接到服务器，请检查网络连接';
      } else {
        return '请求配置错误，请稍后重试';
      }
    }
  }
};
</script>

<style scoped>
.auth-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--background-light) 0%, var(--background-dark) 100%);
  overflow: hidden;
}

.nav-pills {
  gap: 1rem;
  background: rgba(255, 255, 255, 0.5);
  padding: 0.5rem;
  border-radius: 1rem;
}

.nav-pills .nav-link {
  border-radius: 0.75rem;
  font-weight: 600;
  color: var(--text-primary);
  transition: all 0.3s ease;
  padding: 0.75rem 1.5rem;
}

.nav-pills .nav-link.active {
  background: var(--primary-pink);
  color: white;
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
}

.nav-pills .nav-link:hover:not(.active) {
  background: rgba(236, 72, 153, 0.1);
  color: var(--primary-pink);
}
</style>