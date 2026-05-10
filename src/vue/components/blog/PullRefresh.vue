<template>
  <div
    v-if="isMobile"
    class="blog-list-container__refresh pull-refresh"
    :style="{ height: pullRefreshHeight }"
    aria-live="polite"
  >
    <div
      class="pull-refresh__content"
      :class="{ 'pull-refresh__content--refreshing': isRefreshing }"
    >
      <i
        class="fa fa-arrow-down pull-refresh__icon"
        :class="{ 'pull-refresh__icon--rotating': isRefreshing }"
        aria-hidden="true"
      ></i>
      <span class="pull-refresh__text">
        {{ pullRefreshText }}
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PullRefresh',
  props: {
    isMobile: {
      type: Boolean,
      default: false
    },
    isRefreshing: {
      type: Boolean,
      default: false
    },
    pullDistance: {
      type: Number,
      default: 0
    },
    isPulling: {
      type: Boolean,
      default: false
    },
    pullThreshold: {
      type: Number,
      default: 80
    }
  },
  computed: {
    pullRefreshHeight() {
      return `${(this.isPulling || this.isRefreshing) ? this.pullDistance : 0}px`;
    },
    pullRefreshText() {
      if (this.isRefreshing) return '刷新中...';
      if (this.isPulling) {
        return this.pullDistance >= this.pullThreshold ? '释放刷新' : '下拉刷新';
      }
      return '下拉刷新';
    }
  }
}
</script>

<style scoped>
.pull-refresh {
  overflow: hidden;
  transition: height 300ms ease;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
}

.pull-refresh__content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: #ffffff;
  border-bottom: 2px solid #fbcfe8;
}

.pull-refresh__icon {
  transition: transform 300ms ease;
}

.pull-refresh__icon--rotating {
  animation: rotate 1s linear infinite;
}

.pull-refresh__text {
  font-size: 0.9rem;
  color: #4a5568;
  font-weight: bold;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
