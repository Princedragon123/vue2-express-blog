<template>
  <div class="register-container">
    <div class="container-fluid min-vh-100 d-flex align-items-center justify-content-center">
      <div class="row w-100 justify-content-center">
        <div class="col-md-8 col-lg-6 col-xl-5">
          <AuthCard subtitle="欢迎加入魔法校园，开始您的创作之旅">
            <div class="nav nav-pills justify-content-center mb-5" id="auth-tabs" role="tablist">
              <button class="nav-link px-4 py-2 cel-button" id="login-tab" type="button" @click="goToLogin">
                <i class="fas fa-sign-in-alt me-2"></i>登录
              </button>
              <button class="nav-link active px-4 py-2 cel-button" id="register-tab" type="button">
                <i class="fas fa-user-plus me-2"></i>注册
              </button>
            </div>

            <div class="tab-content" id="auth-tabs-content">
              <div class="tab-pane fade show active" id="register" role="tabpanel" aria-labelledby="register-tab">
                <RegisterForm
                  :is-loading="isLoading"
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
import RegisterForm from './register/RegisterForm.vue';
import AuthFooter from './login/AuthFooter.vue';

export default {
  name: 'Register',
  components: {
    AuthCard,
    RegisterForm,
    AuthFooter
  },
  data() {
    return {
      isLoading: false
    };
  },
  methods: {
    async handleRegister(formData) {
      this.isLoading = true;
      try {
        const response = await this.$http.post('/api/auth/register', formData);

        if (response.success) {
          this.$router.push('/login');
        } else {
          this.$emit('register-error', response.message || '注册失败，请稍后重试');
        }
      } catch (error) {
        console.error('注册错误:', error);
        if (error.response) {
          this.$emit('register-error', error.response.message || '注册失败，请稍后重试');
        } else if (error.request) {
          this.$emit('register-error', '网络错误，无法连接到服务器，请检查网络连接');
        } else {
          this.$emit('register-error', '请求配置错误，请稍后重试');
        }
      } finally {
        this.isLoading = false;
      }
    },

    goToLogin() {
      if (this.$route.path !== '/login') {
        this.$router.push('/login');
      }
    }
  }
}
</script>

<style scoped>
.register-container {
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
