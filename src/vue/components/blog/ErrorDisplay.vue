<template>
  <div
    v-if="error"
    class="blog-list-container__error error-message"
    role="alert"
    aria-live="assertive"
  >
    <p class="error-message__text">{{ error }}</p>
    <button
      class="error-message__button btn btn--primary"
      @click="$emit('retry')"
    >
      重新加载
    </button>
  </div>
</template>

<script>
export default {
  name: 'ErrorDisplay',
  props: {
    error: {
      type: String,
      default: ''
    }
  }
}
</script>

<style scoped>
.error-message {
  background: #fee2e2;
  border: 2px solid #ef4444;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  margin-bottom: 24px;
}

.error-message__text {
  color: #ef4444;
  margin: 0 0 16px;
}

.btn {
  border: none;
  padding: 12px 24px;
  border-radius: 30px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1rem;
  transition: all 300ms ease;
}

.btn--primary {
  background: #ec4899;
  color: #ffffff;
}

.btn--primary:hover {
  background: #db2777;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>
