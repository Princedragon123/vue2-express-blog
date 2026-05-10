<template>
  <section class="blog-list-container__empty empty-state" aria-label="空状态">
    <div class="empty-state__icon" aria-hidden="true">{{ icon }}</div>
    <h3 class="empty-state__title">{{ title }}</h3>
    <p class="empty-state__description">{{ description }}</p>
    <div v-if="showActions" class="empty-state__actions">
      <button
        v-if="showClearSearch"
        class="empty-state__button btn btn--primary"
        @click="$emit('clear-search')"
      >
        清除搜索
      </button>
      <button
        class="empty-state__button btn btn--primary"
        @click="$emit('retry')"
      >
        重新加载
      </button>
    </div>
  </section>
</template>

<script>
export default {
  name: 'BlogEmptyState',
  props: {
    icon: {
      type: String,
      default: '📝'
    },
    title: {
      type: String,
      default: '暂无博客文章'
    },
    description: {
      type: String,
      default: '稍后再来看看吧'
    },
    showClearSearch: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    showActions() {
      return true;
    }
  }
}
</script>

<style scoped>
.empty-state {
  text-align: center;
  padding: 64px 0;
}

.empty-state__icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.empty-state__title {
  font-size: 1.5rem;
  margin: 0 0 16px;
  color: #1a202c;
}

.empty-state__description {
  font-size: 1rem;
  color: #4a5568;
  margin-bottom: 24px;
}

.empty-state__actions {
  display: flex;
  justify-content: center;
  gap: 8px;
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

@media (max-width: 480px) {
  .empty-state {
    padding: 32px 0;
  }

  .empty-state__icon {
    font-size: 3rem;
  }

  .empty-state__title {
    font-size: 1.2rem;
  }

  .btn {
    padding: 10px 20px;
    font-size: 0.9rem;
  }
}
</style>
