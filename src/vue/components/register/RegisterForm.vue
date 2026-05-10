<template>
  <form @submit.prevent="handleSubmit">
    <div class="mb-4 form-group">
      <label for="registerUsername" class="form-label cel-label">用户名</label>
      <div class="input-group">
        <span class="input-group-text bg-light border-cel">
          <i class="fas fa-user"></i>
        </span>
        <input
          type="text"
          id="registerUsername"
          v-model="formData.username"
          class="form-control cel-input"
          placeholder="请设置用户名"
          required
          @blur="validateField('username')"
        >
      </div>
      <div class="error-message" v-if="errors.username">{{ errors.username }}</div>
    </div>

    <div class="mb-4 form-group">
      <label for="registerEmail" class="form-label cel-label">邮箱</label>
      <div class="input-group">
        <span class="input-group-text bg-light border-cel">
          <i class="fas fa-envelope"></i>
        </span>
        <input
          type="email"
          id="registerEmail"
          v-model="formData.email"
          class="form-control cel-input"
          placeholder="请输入邮箱"
          required
          @blur="validateField('email')"
        >
      </div>
      <div class="error-message" v-if="errors.email">{{ errors.email }}</div>
    </div>

    <PasswordInput
      v-model="formData.password"
      input-id="registerPassword"
      label="密码"
      placeholder="请设置密码（至少6位）"
      icon-class="fas fa-lock"
      :required="true"
      :error="errors.password"
    />
    <div class="form-text text-muted mt-1">密码至少6位，包含字母和数字</div>

    <PasswordInput
      v-model="formData.confirmPassword"
      input-id="confirmPassword"
      label="确认密码"
      placeholder="请再次输入密码"
      icon-class="fas fa-lock"
      :required="true"
      :error="errors.confirmPassword"
      :toggleable="true"
    />

    <div class="form-check mb-4">
      <input class="form-check-input cel-checkbox" type="checkbox" id="terms" v-model="formData.agreeTerms" required>
      <label class="form-check-label cel-label" for="terms">
        我已阅读并同意 <a href="#" class="text-primary text-decoration-none cel-link">用户协议</a> 和 <a href="#" class="text-primary text-decoration-none cel-link">隐私政策</a>
      </label>
      <div class="error-message" v-if="errors.agreeTerms">{{ errors.agreeTerms }}</div>
    </div>

    <div class="error-message" v-if="errors.register">{{ errors.register }}</div>

    <button type="submit" class="btn btn-primary w-100 py-2 cel-button btn-register" :disabled="isLoading">
      <i class="fas fa-user-plus me-2"></i>{{ isLoading ? '注册中...' : '注册' }}
    </button>
  </form>
</template>

<script>
import PasswordInput from '../login/PasswordInput.vue';

export default {
  name: 'RegisterForm',
  components: {
    PasswordInput
  },
  props: {
    isLoading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      formData: {
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeTerms: false
      },
      errors: {}
    };
  },
  methods: {
    validateField(field) {
      this.errors = { ...this.errors, [field]: '' };

      if (field === 'username') {
        if (!this.formData.username) {
          this.errors.username = '请输入用户名';
        } else if (this.formData.username.length < 3) {
          this.errors.username = '用户名长度不能少于3位';
        }
      }

      if (field === 'email') {
        if (!this.formData.email) {
          this.errors.email = '请输入邮箱';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formData.email)) {
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

      if (field === 'confirmPassword') {
        if (!this.formData.confirmPassword) {
          this.errors.confirmPassword = '请确认密码';
        } else if (this.formData.confirmPassword !== this.formData.password) {
          this.errors.confirmPassword = '两次输入的密码不一致';
        }
      }
    },

    validateForm() {
      this.errors = {};

      if (!this.formData.username) {
        this.errors.username = '请输入用户名';
      } else if (this.formData.username.length < 3) {
        this.errors.username = '用户名长度不能少于3位';
      }

      if (!this.formData.email) {
        this.errors.email = '请输入邮箱';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formData.email)) {
        this.errors.email = '请输入有效的邮箱地址';
      }

      if (!this.formData.password) {
        this.errors.password = '请输入密码';
      } else if (this.formData.password.length < 6) {
        this.errors.password = '密码长度不能少于6位';
      }

      if (!this.formData.confirmPassword) {
        this.errors.confirmPassword = '请确认密码';
      } else if (this.formData.confirmPassword !== this.formData.password) {
        this.errors.confirmPassword = '两次输入的密码不一致';
      }

      if (!this.formData.agreeTerms) {
        this.errors.agreeTerms = '请同意服务条款和隐私政策';
      }

      return Object.keys(this.errors).length === 0;
    },

    handleSubmit() {
      if (!this.validateForm()) return;
      this.$emit('submit', {
        username: this.formData.username,
        email: this.formData.email,
        password: this.formData.password
      });
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

.cel-link {
  position: relative;
  color: var(--primary-pink);
  text-decoration: none;
  transition: all 0.2s ease;
}

.cel-link:hover {
  color: var(--secondary-pink);
  text-decoration: underline;
}

.cel-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--secondary-pink);
  transition: width 0.3s ease;
}

.cel-link:hover::after {
  width: 100%;
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

.btn-register {
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

.btn-register:before {
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

.btn-register:hover:before {
  left: 100%;
}

.btn-register:hover {
  background: linear-gradient(135deg, var(--secondary-pink), var(--primary-pink));
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(236, 72, 153, 0.3);
}

.btn-register:active {
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
