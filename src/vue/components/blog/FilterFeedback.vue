<template>
  <div
    v-if="hasFilter"
    class="blog-list-container__feedback filter-feedback"
    role="status"
    aria-live="polite"
  >
    <span class="filter-feedback__text">
      当前显示：{{ filterName }}
    </span>
    <button
      class="filter-feedback__clear"
      @click="$emit('clear')"
      aria-label="清除筛选条件"
    >
      <svg-icon name="close" :size="14" aria-hidden="true"></svg-icon>
      清除
    </button>
  </div>
</template>

<script>
export default {
  name: 'FilterFeedback',
  props: {
    hasFilter: {
      type: Boolean,
      default: false
    },
    filterName: {
      type: String,
      default: '全部攻略'
    }
  }
}
</script>

<style scoped>
.filter-feedback {
  background: #ffffff;
  border-radius: 30px;
  padding: 16px 24px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 2px solid #fbcfe8;
}

.filter-feedback__text {
  font-weight: bold;
  font-size: 1.1rem;
  color: #1a202c;
}

.filter-feedback__clear {
  background: #ef4444;
  color: #ffffff;
  border: none;
  padding: 4px 16px;
  border-radius: 30px;
  cursor: pointer;
  transition: all 300ms ease;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: bold;
}

.filter-feedback__clear:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>
