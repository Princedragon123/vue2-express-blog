<template>
  <div class="mb-4 form-group">
    <label :for="inputId" class="form-label cel-label">{{ label }}</label>
    <div class="input-group auth-input-group">
      <span class="input-group-text bg-light">
        <svg-icon name="lock" :size="16"></svg-icon>
      </span>
      <input
        :type="currentType"
        :id="inputId"
        v-model="innerValue"
        class="form-control cel-input"
        :placeholder="placeholder"
        :required="required"
        :aria-describedby="`${inputId}-error`"
        ref="input"
        @blur="handleBlur"
        @input="handleInput"
      >
      <button
        v-if="toggleable"
        class="btn btn-outline-secondary"
        type="button"
        @click="toggleVisibility"
        :aria-label="visible ? '隐藏密码' : '显示密码'"
      >
        <svg-icon :name="visible ? 'eyeSlash' : 'eye'" :size="16"></svg-icon>
      </button>
    </div>
    <div v-if="error" :id="`${inputId}-error`" class="error-message">{{ error }}</div>
  </div>
</template>

<script>
export default {
  name: 'PasswordInput',
  props: {
    value: {
      type: String,
      default: '',
      validator: (val) => typeof val === 'string'
    },
    inputId: {
      type: String,
      default: 'password',
      validator: (val) => val.trim() !== ''
    },
    label: {
      type: String,
      default: '密码'
    },
    placeholder: {
      type: String,
      default: '请输入密码'
    },
    iconClass: {
      type: String,
      default: 'lock',
      validator: (val) => typeof val === 'string'
    },
    required: {
      type: Boolean,
      default: false
    },
    toggleable: {
      type: Boolean,
      default: true
    },
    error: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      visible: false,
      tempValue: this.value // 临时存储值，避免实时trim影响输入体验
    };
  },
  computed: {
    // 简化类型判断：toggleable为false时直接返回password
    currentType() {
      return this.toggleable && this.visible ? 'text' : 'password';
    },
    innerValue: {
      get() {
        return this.tempValue;
      },
      set(val) {
        this.tempValue = val;
      }
    }
  },
  methods: {
    toggleVisibility() {
      this.visible = !this.visible;
      // 切换后重新聚焦输入框，提升体验
      this.$nextTick(() => this.$refs.input?.focus());
    },
    handleInput() {
      // 实时同步值，但不trim（避免输入空格立即消失）
      this.$emit('input', this.tempValue);
    },
    handleBlur() {
      // 失焦时trim并同步，兼顾体验和数据准确性
      const trimmedVal = this.tempValue.trim();
      this.tempValue = trimmedVal;
      this.$emit('input', trimmedVal);
      this.$emit('blur');
    },
    focus() {
      this.$refs.input?.focus();
    }
  },
  watch: {
    // 监听外部value变化，同步到临时值
    value: {
      handler(newVal) {
        this.tempValue = newVal;
      },
      immediate: true
    }
  }
};
</script>

<style scoped>

.input-group .btn {
  transition: all 0.3s ease;
}

:deep(input[type="password"]) {
  /* 清除所有浏览器默认装饰 */
  border: none !important;
  outline: none !important;
}

/* Chrome / Edge / Safari 隐藏原生密码查看图标 */
:deep(input[type="password"]::-webkit-textfield-decoration-container) {
  display: none !important;
}
:deep(input[type="password"]::-webkit-contacts-auto-fill-button) {
  display: none !important;
}
:deep(input[type="password"]::-webkit-credentials-auto-fill-button) {
  display: none !important;
}
:deep(input[type="password"]::-webkit-password-toggle-button) {
  display: none !important;
}

/* Edge 专属隐藏 */
:deep(input[type="password"]::-ms-reveal) {
  display: none !important;
  visibility: hidden !important;
}

/* Firefox 专属隐藏 */
:deep(input[type="password"]::-moz-textfield-decoration-container) {
  display: none !important;
}
</style>