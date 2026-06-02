<template>
  <form @submit.prevent="handleSubmit">
    <div class="mb-4 form-group">
      <label for="registerUsername" class="form-label cel-label">用户名</label>
      <div class="input-group auth-input-group">
        <span class="input-group-text bg-light border-cel">
          <svg-icon name="user" :size="16"></svg-icon>
        </span>
        <input
          type="text"
          id="registerUsername"
          v-model="formData.username"
          class="form-control cel-input"
          placeholder="请设置用户名"
          required
          aria-describedby="registerUsername-error"
          @blur="validateField('username')"
        >
      </div>
      <div id="registerUsername-error" class="error-message" v-if="errors.username">{{ errors.username }}</div>
    </div>

    <div class="mb-4 form-group">
      <label for="registerEmail" class="form-label cel-label">邮箱</label>
      <div class="input-group auth-input-group">
        <span class="input-group-text bg-light border-cel">
          <svg-icon name="envelope" :size="16"></svg-icon>
        </span>
        <input
          type="email"
          id="registerEmail"
          v-model="formData.email"
          class="form-control cel-input"
          placeholder="请输入邮箱"
          required
          aria-describedby="registerEmail-error"
          @blur="validateField('email')"
        >
      </div>
      <div id="registerEmail-error" class="error-message" v-if="errors.email">{{ errors.email }}</div>
    </div>

    <PasswordInput
      v-model="formData.password"
      input-id="registerPassword"
      label="密码"
      placeholder="请设置密码（至少6位）"
      icon-class="lock"
      :required="true"
      :error="errors.password"
      @blur="validateField('password')"
    />
    <div class="form-text text-muted mt-1">密码至少6位，包含字母和数字</div>

    <PasswordInput
      v-model="formData.confirmPassword"
      input-id="confirmPassword"
      label="确认密码"
      placeholder="请再次输入密码"
      icon-class="lock"
      :required="true"
      :error="errors.confirmPassword"
      :toggleable="true"
      @blur="validateField('confirmPassword')"
    />

    <div class="form-check mb-4">
      <input class="form-check-input cel-checkbox" type="checkbox" id="terms" v-model="formData.agreeTerms" required>
      <label class="form-check-label cel-label" for="terms">
        我已阅读并同意 
        <a href="javascript:void(0)" class="cel-link">用户协议</a> 
        和 
        <a href="javascript:void(0)" class="cel-link">隐私政策</a>
      </label>
      <div class="error-message" v-if="errors.agreeTerms">{{ errors.agreeTerms }}</div>
    </div>

    <div class="error-message" v-if="errors.register || registerError">{{ errors.register || registerError }}</div>

    <button 
      type="submit" 
      class="btn btn-primary w-100 py-2 cel-button" 
      :disabled="isLoading"
      :aria-disabled="isLoading"
    >
      <svg-icon name="userPlus" :size="16" class-name="me-2"></svg-icon>{{ isLoading ? '注册中...' : '注册' }}
    </button>
  </form>
</template>

<script>
import PasswordInput from '../login/PasswordInput.vue'; // 统一路径（和LoginForm一致）
import { validateRules, debounce } from '@/utils/validate';

export default {
  name: 'RegisterForm',
  components: { PasswordInput },
  props: {
    isLoading: { type: Boolean, default: false },
    registerError: { type: String, default: '' }
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
      errors: {},
      debouncedSubmit: debounce(this.handleRealSubmit, 500)
    };
  },
  watch: {
    // 密码变化时，自动校验确认密码（提升体验）
    'formData.password'() {
      if (this.formData.confirmPassword) {
        this.validateField('confirmPassword');
      }
    }
  },
  methods: {
    validateField(field) {
      this.errors[field] = '';
      switch (field) {
        case 'username':
          this.errors.username = validateRules.username(this.formData.username);
          break;
        case 'email':
          this.errors.email = validateRules.strictEmail(this.formData.email);
          break;
        case 'password':
          this.errors.password = validateRules.password(this.formData.password);
          break;
        case 'confirmPassword':
          this.errors.confirmPassword = validateRules.confirmPassword(
            this.formData.confirmPassword,
            this.formData.password
          );
          break;
      }
    },
    validateForm() {
      this.errors = {};
      this.errors.username = validateRules.username(this.formData.username);
      this.errors.email = validateRules.strictEmail(this.formData.email);
      this.errors.password = validateRules.password(this.formData.password);
      this.errors.confirmPassword = validateRules.confirmPassword(
        this.formData.confirmPassword,
        this.formData.password
      );
      if (!this.formData.agreeTerms) {
        this.errors.agreeTerms = '请同意服务条款和隐私政策';
      }
      return !Object.values(this.errors).some(val => val);
    },
    handleSubmit() {
      if (!this.validateForm()) return;
      this.debouncedSubmit();
    },
    handleRealSubmit() {
      this.$emit('submit', {
        username: this.formData.username.trim(),
        email: this.formData.email.trim(),
        password: this.formData.password
      });
    }
  }
};
</script>

<style scoped>

.form-text {
  margin-left: 0.25rem;
}
</style>