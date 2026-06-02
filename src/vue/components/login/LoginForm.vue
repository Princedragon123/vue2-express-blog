<template>
  <form @submit.prevent="handleSubmit" novalidate>
    <div class="mb-4 form-group">
      <label for="loginEmail" class="form-label cel-label">用户名或邮箱</label>
      <div class="input-group auth-input-group">
        <span class="input-group-text bg-light border-cel">
          <svg-icon name="user" :size="16"></svg-icon>
        </span>
        <input
          type="text"
          id="loginEmail"
          v-model="formData.email"
          class="form-control cel-input"
          placeholder="请输入用户名或邮箱"
          required
          aria-describedby="loginEmail-error"
          @blur="formData.email && validateField('email')"
        >
      </div>
      <div id="loginEmail-error" class="error-message" v-if="errors.email">{{ errors.email }}</div>
    </div>

    <PasswordInput
      v-model="formData.password"
      input-id="loginPassword"
      label="密码"
      placeholder="请输入您的密码"
      icon-class="lock"
      :required="true"
      :error="errors.password"
      @blur="formData.password && validateField('password')"
    />

    <div class="d-flex justify-content-between align-items-center mb-4">
      <div class="form-check">
        <input class="form-check-input cel-checkbox" type="checkbox" id="rememberMe" v-model="formData.rememberMe">
        <label class="form-check-label" for="rememberMe">记住我</label>
      </div>
    </div>

    <div class="error-message" v-if="errors.login || loginError">{{ errors.login || loginError }}</div>

    <button 
      type="submit" 
      class="btn btn-primary w-100 py-2 cel-button" 
      :disabled="isLoading"
      :aria-disabled="isLoading"
    >
      <svg-icon name="signIn" :size="16" class-name="me-2"></svg-icon>{{ isLoading ? '登录中...' : '登录' }}
    </button>
  </form>
</template>

<script>
import PasswordInput from './PasswordInput.vue';
import { validateRules, debounce } from '@/utils/validate';

export default {
  name: 'LoginForm',
  components: { PasswordInput },
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
      errors: {},
      // 防抖提交，防止重复点击
      debouncedSubmit: debounce(this.handleRealSubmit, 500)
    };
  },
  methods: {
    // 字段校验（复用公共规则）
    validateField(field) {
      if (field === 'email') {
        this.errors.email = validateRules.email(this.formData.email);
      }
      if (field === 'password') {
        this.errors.password = validateRules.password(this.formData.password);
      }
    },
    // 表单整体校验
    validateForm() {
      this.errors.email = validateRules.email(this.formData.email);
      this.errors.password = validateRules.password(this.formData.password);
      return !Object.values(this.errors).some(val => val);
    },
    // 提交处理（防抖）
    handleSubmit() {
      if (!this.validateForm()) return;
      this.debouncedSubmit();
    },
    // 实际提交逻辑
    handleRealSubmit() {
      this.$emit('submit', { ...this.formData });
    }
  }
};
</script>

