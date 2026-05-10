<template>
  <form @submit.prevent="handleSubmit">
    <div class="mb-4 form-group">
      <label for="loginEmail" class="form-label cel-label">用户名或邮箱</label>
      <div class="input-group">
        <span class="input-group-text bg-light border-cel">
          <i class="fas fa-user"></i>
        </span>
        <input
          type="text"
          id="loginEmail"
          v-model="formData.email"
          class="form-control cel-input"
          placeholder="请输入用户名或邮箱"
          required
          @blur="validateField('email')"
        >
      </div>
      <div class="error-message" v-if="errors.email">{{ errors.email }}</div>
    </div>

    <PasswordInput
      v-model="formData.password"
      input-id="loginPassword"
      label="密码"
      placeholder="请输入您的密码"
      icon-class="fas fa-lock"
      :required="true"
      :error="errors.password"
      @blur="validateField('password')"
    />

    <div class="d-flex justify-content-between align-items-center mb-4">
      <div class="form-check">
        <input class="form-check-input cel-checkbox" type="checkbox" id="rememberMe" v-model="formData.rememberMe">
        <label class="form-check-label cel-label" for="rememberMe">记住我</label>
      </div>
    </div>

    <div class="error-message" v-if="errors.login || loginError">{{ errors.login || loginError }}</div>

    <button type="submit" class="btn btn-primary w-100 py-2 cel-button btn-login" :disabled="isLoading">
      <i class="fas fa-sign-in-alt me-2"></i>{{ isLoading ? '登录中...' : '登录' }}
    </button>
  </form>
</template>

<script>
import PasswordInput from './PasswordInput.vue';

export default {
  name: 'LoginForm',
  components: {
    PasswordInput
  },
  props: {
    isLoading: {
      type: Boolean,
      default: false
    },
    loginError: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      formData: {
        email: '',
        password: '',
        rememberMe: true
      },
      errors: {}
    };
  },
  methods: {
    validateField(field) {
      this.errors = { ...this.errors, [field]: '' };

      if (field === 'email') {
        if (!this.formData.email) {
          this.errors.email = '请输入用户名或邮箱';
        } else if (this.formData.email.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formData.email)) {
          this.errors.email = '请输入有效的邮箱地址';
        }
      }

      if (field === 'password') {
        if (!this.formData.password) {
          this.errors.password = '请输入密码';
        } else if (this.formData.password.length < 6) {
          this.errors.password = '密码长度不能少于6位';
        }
      }
    },

    validateForm() {
      this.errors = {};

      if (!this.formData.email) {
        this.errors.email = '请输入用户名或邮箱';
      } else if (this.formData.email.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formData.email)) {
        this.errors.email = '请输入有效的邮箱地址';
      }

      if (!this.formData.password) {
        this.errors.password = '请输入密码';
      } else if (this.formData.password.length < 6) {
        this.errors.password = '密码长度不能少于6位';
      }

      return Object.keys(this.errors).length === 0;
    },

    handleSubmit() {
      if (!this.validateForm()) return;
      this.$emit('submit', { ...this.formData });
    }
  }
}
</script>

<style scoped>
.input-group {
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.input-group:focus-within {
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
}

.input-group .input-group-text {
  background: var(--background-light);
  color: var(--text-primary);
  border: none;
  transition: all 0.3s ease;
}

.cel-input {
  border: 2px solid var(--primary-pink);
  border-radius: 10px;
  background: var(--background-light);
  position: relative;
  z-index: 2;
  transition: all 0.3s ease;
  padding: 0.75rem 1rem;
  font-size: 1rem;
}

.cel-input:focus {
  outline: none;
  border-color: var(--primary-pink);
  box-shadow: 0 0 15px rgba(236, 72, 153, 0.3), 0 0 0 3px rgba(236, 72, 153, 0.1);
  transform: translateY(-1px);
}

.cel-label {
  font-weight: bold;
  color: var(--text-primary);
  position: relative;
  transition: all 0.2s ease;
}

.cel-label:hover {
  color: var(--primary-pink);
}

.cel-label::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 30px;
  height: 2px;
  background: var(--primary-pink);
}

.cel-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--primary-pink);
  border-radius: 0.25rem;
  accent-color: var(--primary-pink);
  transition: all 0.3s ease;
}

.cel-checkbox:checked {
  background-color: var(--primary-pink);
  border-color: var(--primary-pink);
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23fff'%3e%3cpath fill-rule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clip-rule='evenodd'/%3e%3c/svg%3e");
}

.cel-checkbox:focus {
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
}

.border-cel {
  border: 2px solid var(--primary-pink);
}

.error-message {
  color: #dc3545;
  font-size: 0.85rem;
  margin-top: 5px;
  animation: shake 0.5s ease;
}

.btn-login {
  position: relative;
  z-index: 1;
  background: linear-gradient(135deg, var(--primary-pink), var(--secondary-pink));
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  transition: all 0.3s ease;
  overflow: hidden;
}

.btn-login:before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: all 0.5s;
  z-index: -1;
}

.btn-login:hover:before {
  left: 100%;
}

.btn-login:hover {
  background: linear-gradient(135deg, var(--secondary-pink), var(--primary-pink));
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(236, 72, 153, 0.3);
}

.btn-login:active {
  transform: translateY(0);
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

@media (max-width: 480px) {
  .cel-input {
    padding: 0.625rem 0.875rem;
  }

  .btn-primary {
    padding: 0.625rem 1.25rem;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
</style>
