<template>
  <div class="form-actions">
    <button 
      type="button" 
      class="btn-secondary" 
      @click="$emit('cancel')"
    >
      取消
    </button>
    <button 
      type="button" 
      class="btn-primary" 
      @click="$emit('save')"
      :disabled="isSubmitting"
    >
      <span v-if="isSubmitting" class="nav-icon">🔄</span>
      {{ isSubmitting ? '保存中...' : '保存更改' }}
    </button>
  </div>
</template>

<script>
export default {
  name: 'FormActions',
  props: {
    isSubmitting: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
.form-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.btn-secondary,
.btn-primary {
  padding: 12px 30px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #333;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.btn-primary {
  background-color: #ff6b9d;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #ff527d;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.nav-icon {
  font-size: 1.2rem;
}
</style>
