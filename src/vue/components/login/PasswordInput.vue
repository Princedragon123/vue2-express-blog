<template>
  <div class="mb-4 form-group">
    <label :for="inputId" class="form-label cel-label">{{ label }}</label>
    <div class="input-group">
      <span class="input-group-text bg-light">
        <i :class="iconClass"></i>
      </span>
      <input
        :type="currentType"
        :id="inputId"
        :value="value"
        @input="$emit('input', $event.target.value)"
        class="form-control cel-input"
        :placeholder="placeholder"
        :required="required"
        ref="input"
      >
      <button
        v-if="toggleable"
        class="btn btn-outline-secondary"
        type="button"
        @click="toggleVisibility"
      >
        <i class="fas" :class="visible ? 'fa-eye-slash' : 'fa-eye'"></i>
      </button>
    </div>
    <div class="error-message" v-if="error">{{ error }}</div>
  </div>
</template>

<script>
export default {
  name: 'PasswordInput',
  props: {
    value: {
      type: String,
      default: ''
    },
    inputId: {
      type: String,
      default: 'password'
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
      default: 'fas fa-lock'
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
      visible: false
    };
  },
  computed: {
    currentType() {
      return this.toggleable && this.visible ? 'text' : 'password';
    }
  },
  methods: {
    toggleVisibility() {
      this.visible = !this.visible;
    },
    focus() {
      this.$refs.input.focus();
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

.input-group .input-group-text {
  background: var(--background-light);
  color: var(--text-primary);
  border: none;
  transition: all 0.3s ease;
}

.input-group .btn {
  transition: all 0.3s ease;
}

.input-group .btn:hover {
  background: var(--primary-pink);
  color: white;
}

.cel-input {
  border: none;
  border-radius: 0;
  background: var(--background-light);
  position: relative;
  z-index: 2;
  transition: all 0.3s ease;
  padding: 0.75rem 1rem;
  font-size: 1rem;
}

.cel-input:focus {
  outline: none;
  box-shadow: none;
  transform: none;
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

.border-cel {
  border: 2px solid var(--primary-pink);
}

.error-message {
  color: #dc3545;
  font-size: 0.85rem;
  margin-top: 5px;
  animation: shake 0.5s ease;
}

.is-invalid {
  border-color: #ef4444 !important;
}

.is-invalid:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
}

.is-valid {
  border-color: #10b981 !important;
}

.is-valid:focus {
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
}

@media (max-width: 480px) {
  .cel-input {
    padding: 0.625rem 0.875rem;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
</style>
