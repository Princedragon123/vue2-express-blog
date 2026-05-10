<template>
  <div class="login-container">
    <div class="container-fluid min-vh-100 d-flex align-items-center justify-content-center">
      <div class="row w-100 justify-content-center">
        <div class="col-md-8 col-lg-6 col-xl-5">
          <AuthCard subtitle="欢迎回到kk博客，继续您的创作之旅">
            <div class="nav nav-pills justify-content-center mb-5" id="auth-tabs" role="tablist">
              <button class="nav-link active px-4 py-2 cel-button" id="login-tab" type="button">
                <i class="fas fa-sign-in-alt me-2"></i>登录
              </button>
              <button class="nav-link px-4 py-2 cel-button" id="register-tab" type="button" @click="goToRegister">
                <i class="fas fa-user-plus me-2"></i>注册
              </button>
            </div>

            <div class="tab-content" id="auth-tabs-content">
              <div class="tab-pane fade show active" id="login" role="tabpanel" aria-labelledby="login-tab">
                <LoginForm
                  :is-loading="isLoading"
                  :login-error="loginError"
                  @submit="handleLogin"
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
import AuthFooter from './login/AuthFooter.vue';

export default {
  name: 'Login',
  components: {
    AuthCard,
    LoginForm,
    AuthFooter
  },
  data() {
    return {
      isLoading: false,
      loginError: ''
    };
  },
  methods: {
    async handleLogin(formData) {
      this.loginError = '';
      this.isLoading = true;
      try {
        const response = await this.$http.auth.login(formData);

        if (response.success && response.message === '登录成功') {
          const auth = require('../utils/auth').default;
          auth.loginSuccess(response.user, response.token, formData.rememberMe);

          const redirectPath = (response.user && response.user.role === 'admin') ? '/admin' : '/blog';
          this.$router.push(redirectPath);
        } else {
          this.loginError = response.message || '登录失败，请检查邮箱和密码';
        }
      } catch (error) {
        console.error('登录错误:', error);
        if (error.response) {
          this.loginError = error.response.data.message || '登录失败，请检查邮箱和密码';
        } else if (error.request) {
          this.loginError = '网络错误，无法连接到服务器，请检查网络连接';
        } else {
          this.loginError = '请求配置错误，请稍后重试';
        }
      } finally {
        this.isLoading = false;
      }
    },

    goToRegister() {
      if (this.$route.path !== '/register') {
        this.$router.push('/register');
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--background-light) 0%, var(--background-dark) 100%);
  overflow: hidden;
}

.nav-pills .nav-link {
  border-radius: 0.75rem;
  font-weight: 600;
  color: var(--text-primary);
  transition: all 0.3s ease;
  padding: 0.75rem 1.5rem;
}

.nav-pills .nav-link:hover {
  background: rgba(236, 72, 153, 0.1);
  color: var(--primary-pink);
  transform: translateY(-2px);
}

.nav-pills .nav-link.active {
  background: linear-gradient(135deg, var(--primary-pink), var(--secondary-pink));
  color: white;
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
}

.cel-button {
  background: var(--background-light);
  border: 2px solid var(--primary-pink);
  border-radius: 10px;
  color: var(--text-primary);
  font-weight: bold;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.cel-button:hover {
  background: var(--primary-pink);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(236, 72, 153, 0.4);
}

.cel-button.active {
  background: var(--primary-pink);
  color: white;
}

.tab-content .tab-pane {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .nav-pills {
    flex-direction: column;
    gap: 0.5rem;
  }

  .nav-pills .nav-link {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .nav-pills .nav-link {
    padding: 10px 20px !important;
  }
}
</style>
